# Registration & Admin Approval Workflow

**Date:** 2026-05-15  
**Feature:** Student self-registration with admin-gated approval

---

## Overview

Added a complete student self-registration flow with admin approval gating.  
Students can register publicly, but cannot log in until an admin approves their account.  
Admins manage pending registrations from a dedicated dashboard page.

### Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Who can self-register? | Students only | Teachers are created by admins |
| Email verification | Skipped | Kept flow simple (`email_confirm: true`) |
| Rejected users | Marked `rejected`, kept in DB | Preserves audit trail |
| Login gate location | Express `authController.js` | Secure — enforced server-side, not client-side |

---

## Files Changed

### 🗄️ Database

#### [NEW] `supabase/migrations/add_approval_status.sql`

- Adds `approval_status TEXT NOT NULL DEFAULT 'approved'` column to `public.profiles`
- Constraint: values must be `pending`, `approved`, or `rejected`
- Default is `'approved'` so all existing admin/teacher/student accounts continue working without any migration data changes
- Updates the `handle_new_user` Postgres trigger to read `approval_status` from `user_metadata` and write it to `profiles` on signup

> ⚠️ **Action Required:** Run this file in the Supabase SQL Editor before using the feature.

---

### 🔒 Backend (`backend/`)

#### [MODIFIED] `backend/controllers/authController.js`

Added approval status gate inside `signInAndVerifyRole()`, which runs on every login:

```
Login attempt → Supabase Auth OK? → Fetch profiles.approval_status
  ├── 'pending'  → 403 "Your account is waiting for admin approval."
  ├── 'rejected' → 403 "Your registration request was rejected."
  └── 'approved' → proceed with role check → issue session token
```

Also updated the `SELECT` query to include `approval_status` from the profiles table.

#### [NEW] `backend/controllers/registrationController.js`

Public endpoint controller for student self-registration.

- **Validates:** `full_name` (min 3 chars), `email` (format), `password` (min 6 chars), `confirm_password` (match)
- **Pre-checks:** queries `profiles` for the email to return friendly duplicate messages (pending / rejected / already active)
- **Creates:** Supabase Auth user via `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true` and `user_metadata: { role: 'student', approval_status: 'pending' }`
- **Upserts:** `profiles` row with `approval_status: 'pending'` (defensive fallback in case the trigger doesn't fire)
- Returns: `{ message: "Registration submitted successfully. Your account is pending admin approval." }`

#### [NEW] `backend/controllers/approvalController.js`

Admin-only controller with four functions:

| Function | Description |
|---|---|
| `getPendingUsers` | Fetches all profiles where `approval_status = 'pending'`, ordered oldest-first (FIFO) |
| `getAllRegistrationUsers` | Fetches all self-registered users with any status (for admin overview) |
| `approveUser(id)` | Sets `approval_status = 'approved'`; validates the user exists and isn't already approved |
| `rejectUser(id)` | Sets `approval_status = 'rejected'`; user record is kept for audit trail |

#### [NEW] `backend/routes/registrationRoutes.js`

```
POST /api/auth/register   → registrationController.register   (public)
```

#### [NEW] `backend/routes/approvalRoutes.js`

All routes require `authMiddleware` + `requireRole("admin")`:

```
GET  /api/admin/pending-users          → getPendingUsers
GET  /api/admin/all-registration-users → getAllRegistrationUsers
POST /api/admin/approve/:id            → approveUser
POST /api/admin/reject/:id             → rejectUser
```

#### [MODIFIED] `backend/server.js`

- Imported `registrationRoutes` and `approvalRoutes`
- Added a dedicated `registrationLimiter` (5 requests per 15 min per IP) for the public register endpoint
- Mounted `registrationRoutes` at `/api/auth` (with `registrationLimiter`)
- Mounted `approvalRoutes` at `/api/admin`
- Updated the root `GET /` endpoint documentation to list all new routes

---

### 🖥️ Frontend (`src/`)

#### [MODIFIED] `src/app/lib/backendApi.ts`

Added the following typed API functions:

**Public (no auth token):**
```ts
backendRegisterSelf(payload: SelfRegisterPayload): Promise<{ message: string }>
```

**Admin-only:**
```ts
backendGetPendingUsers(): Promise<{ users: PendingUser[], count: number }>
backendGetAllRegistrationUsers(): Promise<{ users: PendingUser[], count: number }>
backendApproveUser(id: string): Promise<{ message: string }>
backendRejectUser(id: string): Promise<{ message: string }>
```

Also exported a new `PendingUser` interface:
```ts
interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
}
```

> Note: `backendRegisterSelf` does **not** use the shared `backendFetch` helper (which requires a session token). It makes a raw `fetch()` call to the public endpoint.

#### [MODIFIED] `src/app/pages/RegistrationPage.tsx`

Complete rewrite of the existing broken stub. New implementation:

- **Layout:** Matches the `LoginPage` blue split-panel design (left branding panel + right form)
- **Fields:** Full Name, Email, Password, Confirm Password
- **Role:** Fixed to `student` (displayed as a read-only chip — no selection needed)
- **Validation:** Client-side per-field validation with inline error messages under each input
- **Submit:** Calls `backendRegisterSelf`, disables button during loading with spinner
- **Success state:** Replaces the form with a green confirmation screen explaining the pending approval process
- **Error state:** Server errors shown in a red alert banner above the form
- Mobile-responsive (single column below `lg` breakpoint)

#### [NEW] `src/app/pages/AdminApprovals.tsx`

New admin dashboard page at `/admin/approvals`:

- **Stats row:** Three clickable cards (Pending / Approved / Rejected) — clicking a card filters the table
- **Toolbar:** Text search (name or email) + status dropdown filter + clear button
- **Table columns:** User (avatar initials + name + email), Role, Registered (date/time), Status badge, Actions
- **Status badges:** Color-coded — amber (pending), emerald (approved), red (rejected)
- **Action buttons:**
  - Approved users: only **Reject** button shown
  - Rejected users: only **Approve** button shown
  - Pending users: both **Approve** and **Reject** buttons shown
  - Buttons show inline spinner while action is in flight; row updates optimistically on success
- **Toast notifications:** Success/error toasts (4 second auto-dismiss) in the top-right corner
- **Empty states:** Contextual messages for "no pending registrations" vs "no results"
- **Refresh button:** Manual refresh with loading indicator
- Consistent with existing dashboard styling (white cards, `slate-*` borders, `indigo-*` accents)

#### [MODIFIED] `src/app/routes.tsx`

Added two lazy-loaded routes:

```ts
{ path: "/register", element: withSuspense(RegistrationPage) }      // public
{ path: "approvals", element: withSuspense(AdminApprovals) }        // under /admin/*
```

#### [MODIFIED] `src/app/pages/LoginPage.tsx`

Changed the bottom "Don't have an account?" link:

```diff
- <a href="#">Contact your admin</a>
+ <Link to="/register">Create an account</Link>
```

#### [MODIFIED] `src/app/components/layout/DashboardSidebar.tsx`

- Imported `UserCheck` from Lucide and `backendGetPendingUsers` from `backendApi`
- Added **Approvals** nav item to the admin sidebar (between Reports and Settings)
- On mount (admin role only), fetches the pending user count and stores it in state
- Renders an **amber badge** showing the count next to "Approvals" when `pendingCount > 0`
  - Expanded sidebar: number badge on the right side of the label
  - Collapsed sidebar: small amber dot in the top-right corner of the icon

---

## API Reference

### Public Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Student self-registration |

**Request body:**
```json
{
  "full_name": "Sarah Johnson",
  "email": "sarah@university.edu",
  "password": "secret123",
  "confirm_password": "secret123"
}
```

**Success response (201):**
```json
{ "message": "Registration submitted successfully. Your account is pending admin approval." }
```

---

### Admin-Only Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/pending-users` | Admin JWT | List users with `status = pending` |
| `GET` | `/api/admin/all-registration-users` | Admin JWT | List all self-registered users |
| `POST` | `/api/admin/approve/:id` | Admin JWT | Approve a user |
| `POST` | `/api/admin/reject/:id` | Admin JWT | Reject a user |

---

### Modified Login Endpoint

`POST /api/auth/admin/login` and `POST /api/auth/student/login` now return additional 403 error cases:

| Scenario | HTTP Status | Message |
|---|---|---|
| Account pending | `403` | `"Your account is waiting for admin approval. You will be notified once access is granted."` |
| Account rejected | `403` | `"Your registration request was rejected. Please contact your administrator."` |
| Wrong role | `403` | `"Access denied. This login portal is for '…' accounts only."` |
| Bad credentials | `401` | Supabase auth error message |

---

## Setup Instructions

1. **Run the database migration** in the Supabase SQL Editor:
   ```
   supabase/migrations/add_approval_status.sql
   ```

2. **Restart the Express backend** to pick up the new route files.

3. **Rebuild the frontend** (or the dev server will hot-reload automatically).

4. **Test the flow:**
   - Visit `/register` → submit a student registration
   - Log in as admin → go to **Approvals** in the sidebar
   - Approve or reject the pending account
   - Try logging in as that student — should now succeed (or show rejection message)
