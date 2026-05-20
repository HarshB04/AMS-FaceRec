# AMS-FaceRec Agent Instructions

**AMS-FaceRec** is a full-stack attendance management system with face recognition,
role-based access control, and real-time analytics.

---

## 🎯 Essential Context (Read First)

Before working on any feature, review these documents in order:

1. **[docs/AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md)** — Implementation status, security model, known gotchas
2. **[docs/STATUS.md](docs/STATUS.md)** — Current phase (4/6), immediate next steps, blockers
3. **[README.md](README.md)** — Architecture diagram, environment setup, quick start

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ React + TypeScript (Vite)          Frontend (port 5173)         │
│ • Routes: src/app/routes.tsx        (role-based guards)         │
│ • Pages: src/app/pages/*.tsx        (Admin/Teacher/Student)     │
│ • API client: src/app/lib/backendApi.ts (JWT auto-injection)    │
│ • UI: shadcn/ui + Tailwind + Material UI                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS + JWT Bearer Token
┌──────────────────▼──────────────────────────────────────────────┐
│ Express.js Backend                  (port 5000)                 │
│ • Routes: backend/routes/*.js       (protected + rate-limited)  │
│ • Controllers: backend/controllers/ (try-catch + standardized)  │
│ • Auth: authMiddleware + roleMiddleware                         │
│ • Security: Helmet + CORS whitelist + rate limiting             │
│ • Supabase clients: anon (public/RLS) vs admin (service role)   │
└──────────────────┬──────────────────────────────────────────────┘
         ┌─────────┴──────────────────┬──────────────────┐
         │                            │                  │
┌────────▼──────────────────┐ ┌──────▼──────────┐ ┌────▼──────────────────────┐
│ Supabase PostgreSQL + RLS │ │ Python Flask    │ │ File System (Blob Uploads)│
│ • Auth → auth.users       │ │ Face Engine     │ │ • Student photos          │
│ • Data → tables with RLS  │ │ (port 5001)     │ │ • Face training data      │
│ • Edge Functions (Deno)   │ │ • OpenCV Haar   │ │ • Audit logs              │
│                           │ │ • KNN classifier│ │                          │
└───────────────────────────┘ │ • Threading     │ └───────────────────────────┘
                              └─────────────────┘
```

**Security Model**:
- `SUPABASE_SERVICE_ROLE` lives **only** in `backend/.env` — never in browser
- Roles verified from `profiles` table via backend (JWT metadata is spoofable)
- All Supabase tables have RLS enforced via `get_my_role()` function
- Face Engine validates attendance via shared secret header

---

## 📂 Directory Structure & Patterns

### Frontend (React + TypeScript)

```
src/app/
├── routes.tsx                    ← Add new pages here (lazy-loaded routes)
├── pages/
│   ├── AdminApprovals.tsx        (admin-only page example)
│   ├── AdminCourses.tsx
│   ├── StudentAttendance.tsx
│   └── ...
├── components/
│   ├── figma/                    (Figma-imported components)
│   ├── layout/
│   │   └── AuthGuard.tsx         (role-based render guard)
│   ├── shared/                   (reusable domain components)
│   └── ui/                       (shadcn/ui primitives)
├── lib/
│   ├── backendApi.ts             (★ ALL API calls go here — auto JWT injection)
│   ├── api.ts                    (Supabase queries for direct seeding only)
│   └── timetable.ts              (domain logic)
└── hooks/
    └── useSeeder.ts              (idempotent demo data seed)
```

**Key Pattern**: Never use direct Supabase queries in components. Always route through `backendApi.ts`:

```typescript
// ✓ Correct
import { backendApi } from '@/app/lib/backendApi';
const response = await backendApi.get('/api/students');

// ✗ Wrong
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('students').select();
```

### Backend (Express.js)

```
backend/
├── server.js                     (entry point + security middleware)
├── package.json                  (Node dependencies)
├── routes/
│   ├── authRoutes.js             (login/register)
│   ├── studentRoutes.js          (CRUD + filtering)
│   ├── attendanceRoutes.js       (POST /api/attendance/log via face engine)
│   ├── faceRoutes.js             (enrollment API)
│   └── ...
├── controllers/
│   ├── studentController.js      (try-catch + standardized responses)
│   ├── attendanceController.js   (validates student → face → active status)
│   ├── authController.js
│   └── ...
├── middleware/
│   ├── authMiddleware.js         (validates JWT → attaches req.user)
│   ├── roleMiddleware.js         (requires specific role; fetches from DB)
├── config/
│   └── supabaseClient.js         (anon vs admin client instantiation)
└── utils/
    └── emailService.js           (nodemailer wrapper)
```

**Error Response Format** (all endpoints):
```javascript
// Success (2xx)
{ data: {...} }

// Client error (4xx)
{ error: "ValidationError", message: "Email already registered" }

// Server error (5xx)
{ error: "DatabaseError", message: "Failed to fetch student" }
```

### Python Face Engine

```
face_engine/
├── server.py                     (Flask app + camera loop)
├── requirements.txt              (pip dependencies)
├── data/
│   ├── faces_data.npy            (⚠️ numpy array — never commit)
│   └── names.pkl                 (⚠️ pickle — must match faces_data.npy length)
├── tests/
│   ├── conftest.py               (pytest fixtures; mocks HTTP)
│   └── test_server.py            (unit tests)
├── test_*.py                     (diagnostic scripts)
└── haarcascade_*.xml             (OpenCV Haar cascades)
```

**Attendance Flow**:
1. Face Engine detects face → KNN classifier predicts student SBRN
2. POST to `backend/api/attendance/log` with `X-Face-Engine-Secret` header
3. Backend validates: SBRN exists → face enrolled → student active
4. Insert attendance record (unique constraint on date/course/student prevents duplicates)

---

## 🔐 Security & Auth Patterns

### Frontend Auth Guard

Wrap routes in `<AuthGuard>` with required role:

```tsx
<AuthGuard role="admin">
  <AdminDashboard />
</AuthGuard>
```

Behind the scenes:
- Fetches `get_my_role()` via backend endpoint
- Renders `null` (nothing) if role doesn't match
- Never relies on JWT metadata alone

### Backend Role Middleware

Protect endpoints with `requireRole()` factory:

```javascript
router.get(
  '/admin/stats',
  authMiddleware,           // validates JWT → req.user
  requireRole('admin'),     // checks profiles table → 403 if no match
  controllerFunction
);
```

### Supabase Client Strategy

- **anon** (public key in frontend) — Respects RLS policies, safe for public queries
- **admin** (service role in backend only) — Bypasses RLS for privileged operations

See [backend/config/supabaseClient.js](backend/config/supabaseClient.js).

---

## 🗄️ Database Schema & Migrations

**Key Tables**:
- `auth.users` — Managed by Supabase Auth (never edit directly)
- `profiles` — **Secure roles table** with RLS; `get_my_role()` function fetches role
- `students` — Attendance tracking; `face_enrolled` flag; `status` (active/inactive)
- `courses` — Course metadata; linked via course_instructors
- `attendance` — Daily logs; UNIQUE(student_id, course_id, date_attended)
- `timetable_entries` — Schedule import from CSV

**Adding Tables**:

1. Edit [supabase/schema.sql](supabase/schema.sql) or create new migration:
   ```bash
   npx supabase migration new add_new_table
   ```

2. Migration files stored in [supabase/migrations/](supabase/migrations/); run in order

3. **Never** edit `schema.sql` directly if using migrations — migrations are the source of truth

4. After schema changes, redeploy Edge Functions:
   ```bash
   npx supabase functions deploy server --no-verify-jwt
   ```

---

## 🛠️ Development Workflow

### Setup (First Time)

1. **Clone & install**:
   ```bash
   git clone <repo>
   npm install
   cd backend && npm install && cd ..
   cd face_engine && pip install -r requirements.txt && cd ..
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env` (frontend + face engine)
   - Copy `backend/.env.example` to `backend/.env` (backend secrets)
   - Fill in Supabase keys and Face Engine secret

3. **Start services**:
   ```bash
   # Terminal 1: Frontend
   npm run dev                    # http://localhost:5173
   
   # Terminal 2: Backend
   cd backend && node server.js   # http://localhost:5000
   
   # Terminal 3: Face Engine (optional)
   cd face_engine && python server.py  # http://localhost:5001
   ```

### Common Commands

```bash
# Frontend
npm run build                    # Production build
npm run db:import-timetable      # Load course schedule from CSV

# Backend
npm run start                    # Production mode
npm run dev                      # Watch mode with nodemon

# Database
npx supabase migration list      # See pending migrations
npx supabase functions deploy server --no-verify-jwt  # Update Edge Function

# Python Face Engine
python -m pytest -v             # Run unit tests (no camera needed)
python face_engine/test_faces.py  # Inspect enrollment data
python face_engine/test_dshow.py  # Debug Windows camera access
```

---

## ⚠️ Common Gotchas & Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| **Face engine crashes on startup** | `faces_data.npy` and `names.pkl` length mismatch (interrupted enrollment) | Delete `face_engine/data/` and re-enroll all faces |
| **Backend endpoints return 404** | Edge Function not redeployed after schema changes | Run `npx supabase functions deploy server --no-verify-jwt` |
| **Camera won't open (Windows)** | DirectShow not available or port occupied | Test `face_engine/test_dshow.py`; try camera index 1 or 2 |
| **Face engine auth fails (401)** | `FACE_ENGINE_SECRET` mismatch | Ensure both `backend/.env` and `.env` use same value |
| **Environment variables not loading** | Running from wrong directory | `cd face_engine && python server.py` (loads `.env` from cwd) |
| **TypeError in attendance controller** | Missing student or course lookup | Validate input before querying DB |
| **CORS errors from frontend** | Frontend URL not whitelisted | Add to `FRONTEND_URL` in `backend/.env` |

---

## 📋 Current Project Status

**Phase**: 4 of 6 (Teacher Live Dashboard)  
**Completed**: Phases 1-3 (Auth, Student enrollment, Attendance logging)  
**Next**: Live dashboard refresh + export features  
**Blockers**: See [docs/STATUS.md](docs/STATUS.md)

---

## 🔗 Important Links

| Document | Purpose |
|----------|---------|
| [docs/AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md) | Implementation details + tech choices |
| [docs/STATUS.md](docs/STATUS.md) | Phase tracker + next milestones |
| [guidelines/database_schema_guide.md](guidelines/database_schema_guide.md) | ER diagram + table relationships |
| [docs/CLEANUP.md](docs/CLEANUP.md) | What was removed (prevent re-creation) |
| [README.md](README.md) | Architecture diagram + setup |

---

## ✅ Checklist for New Features

- [ ] Route/endpoint added to appropriate file (routes.tsx or routes/*.js)
- [ ] Frontend wrapped in `<AuthGuard role="...">` if needed
- [ ] Backend endpoint uses `authMiddleware` + `requireRole()` if needed
- [ ] Error responses follow `{ error, message }` format
- [ ] Rate limiting considered for public endpoints
- [ ] Database query tested (schema changes trigger Edge Function redeploy)
- [ ] Python face engine tests pass (`python -m pytest`) if touching `server.py`
- [ ] `.env` / `backend/.env` secrets not committed (check `.gitignore`)
- [ ] Verified with another role (student/teacher/admin) in browser dev tools

---

**Questions?** Check [docs/AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md) first — most issues are covered there.
