---
plan: "09-02"
phase: "09"
status: "complete"
completed: "2026-05-15"
self_check: "PASSED"
---

# Summary: 09-02 — Student Self-Registration & Admin Approval Pipeline

## What Was Built

End-to-end student self-registration workflow: students submit a public form with their SBRN, email, and password. Accounts start as `pending`. Admins review from a dedicated dashboard and approve or reject. Approved students receive an HTML email containing their SBRN and a sign-in link. The frontend sidebar shows a live pending-count badge for admins.

## Key Files Created

**Backend:**
- `backend/routes/registrationRoutes.js` + `backend/controllers/registrationController.js` — `POST /api/auth/register` (public, rate-limited to 5/15min): validates SBRN format, checks email + SBRN uniqueness, creates auth user with `email_confirm: true`, upserts `profiles` (approval_status: 'pending'), upserts `students` (status: 'inactive', student_id_text: SBRN)
- `backend/routes/approvalRoutes.js` + `backend/controllers/approvalController.js` — Admin approval endpoints: GET pending-users, GET all-registration-users (merged with auth.users timestamps), POST approve/:id (profile→approved + students→active + email), POST reject/:id (profile→rejected + email)
- `backend/utils/emailService.js` — Lazy nodemailer transporter, `sendApprovalEmail` (HTML with SBRN callout), `sendRejectionEmail` (HTML). Both fire-and-forget; SMTP failures are logged but never block the HTTP response.

**Frontend:**
- `src/app/pages/RegistrationPage.tsx` — Public `/register` page with Full Name, SBRN, Email, Password, Confirm Password fields; pending-approval success state; link from LoginPage
- `src/app/pages/AdminApprovals.tsx` — Admin `/admin/approvals` dashboard: filter by All/Pending/Approved/Rejected, search by name/email, Approve/Reject buttons with optimistic UI updates
- `src/app/lib/backendApi.ts` — Extended with `backendRegisterSelf`, `backendGetPendingUsers`, `backendGetAllRegistrationUsers`, `backendApproveUser`, `backendRejectUser`
- `src/app/components/layout/DashboardSidebar.tsx` — Fetches pending count on mount; displays numeric badge on "Approvals" nav item when count > 0

## Notable Decisions

- **SBRN normalization**: Normalized to uppercase on save (e.g. `stu-001 → STU-001`). Stored in both `profiles.student_id` and `students.student_id_text` so the existing `lookup-sbrn` Edge Function can map SBRN→email at login.
- **students row on registration**: Inserted immediately with `status: 'inactive'` so SBRN lookup is ready before approval. Activation (`status → 'active'`) happens atomically during approval.
- **Email is non-fatal**: If SMTP env vars are absent, `getTransporter()` returns null and email functions return early — account actions still succeed and the server logs a warning.
- **Duplicate guard**: Both email and SBRN are checked for uniqueness before creating the auth user — prevents orphaned auth users with duplicate SBRNs.

## Self-Check: PASSED

- ✅ Registration endpoint validates all fields, normalizes SBRN, checks duplicates
- ✅ Approval/rejection correctly updates profiles + students tables
- ✅ Email service fails gracefully when SMTP not configured
- ✅ Frontend RegistrationPage and AdminApprovals pages route-guarded correctly
- ✅ Sidebar pending count badge fetches on mount (admin only)
- ✅ backendApi.ts has typed wrappers for all new endpoints
