# AMS-FaceRec Project Review

Reviewed on: April 29, 2026

## Scope

This review covers the checked-in project files for the React/Vite frontend, Supabase schema and Edge Function, local Python face recognition service, documentation, and repository hygiene. Generated dependencies under `node_modules` and the Python virtual environment contents were not reviewed in detail.

## Current Snapshot

AMS-FaceRec is a face-recognition attendance system with three main parts:

- `src/`: Vite + React single page app with admin, teacher, and student dashboards.
- `supabase/`: PostgreSQL schema plus a Hono-based Supabase Edge Function.
- `face_engine/`: Flask + OpenCV service for webcam scanning, face enrollment, and attendance logging.

The production frontend build was checked with:

```bash
npm.cmd run build
```

Result: build succeeds. Vite reports one warning: the main JavaScript bundle is larger than 500 kB after minification.

## Strengths

- The application has a clear high-level split between frontend, Supabase backend, and local face engine.
- Core domain tables exist for `students`, `courses`, `attendance`, `instructors`, and `course_instructors`.
- The UI already covers important workflows: dashboards, student management, teachers, courses, attendance reports, login, and live camera.
- The schema uses useful constraints such as unique emails/course codes and checked status values.
- The project has planning docs under `.planning/codebase`, which makes the intended architecture easier to understand.

## High Priority Findings 

### 1. Backend authorization is not enforced

The Edge Function creates a Supabase client with the service role key at `supabase/functions/server/index.ts:22`, allows all origins at `supabase/functions/server/index.ts:12`, and exposes write routes such as:

- `POST /students` at `supabase/functions/server/index.ts:104`
- `PUT /students/:id` at `supabase/functions/server/index.ts:115`
- `POST /attendance` at `supabase/functions/server/index.ts:198`

If this function is deployed with JWT verification disabled, any caller who can reach the endpoint can create, update, or delete operational data. This is the biggest production risk in the project.

Recommendation:

- Require a valid Supabase JWT for all protected routes.
- Verify role claims server-side before allowing admin, teacher, or student actions.
- Avoid using the service role key for user-scoped operations unless the route performs explicit authorization first.
- Restrict CORS origins to known frontend domains.

### 2. Row Level Security is not defined in the database schema

`supabase/schema.sql` creates tables but does not enable RLS or define policies. The frontend also queries tables directly through `src/app/lib/api.ts`, which means database-level protections are essential.

Recommendation:

- Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for every app table.
- Add policies for admin, teacher, and student access.
- Keep service-role-only writes isolated to trusted backend workflows.

### 3. Supabase project configuration appears inconsistent

The frontend environment files use one Supabase project, while the Python face engine hardcodes a different URL at `face_engine/server.py:20`. The face engine key also falls back to `"YOUR_ANON_KEY"` at `face_engine/server.py:21`.

Impact:

- The web app and face engine may read/write different databases.
- Attendance may appear missing in the UI even if the face engine logs successfully.
- Local setup depends on hidden assumptions.

Recommendation:

- Move `SUPABASE_URL` and `SUPABASE_KEY` for the Python service into a Python-specific `.env`.
- Use the same Supabase project across frontend, Edge Function, and face engine unless there is an intentional environment split.
- Fail fast when required environment variables are missing.

### 4. Authentication roles depend only on user metadata

`AuthGuard` trusts `session.user.user_metadata?.role` at `src/app/components/layout/AuthGuard.tsx:33`. `LoginPage` also ships visible demo credentials beginning at `src/app/pages/LoginPage.tsx:6`.

Impact:

- Client-side route protection is helpful for UX but not enough for security.
- Roles need authoritative validation from the database or verified JWT claims.
- Demo credentials should not be present in a production build.

Recommendation:

- Store roles in a trusted profile table or custom JWT claims managed by backend/admin workflows.
- Enforce role checks in the Edge Function and RLS policies.
- Gate demo credentials behind a development-only flag or remove them before deployment.

## Medium Priority Findings

### 5. Multiple Supabase clients should be consolidated

There are multiple client factories/instances:

- `utils/supabase/client.ts`
- `utils/supabase/supabase.ts`
- `src/lib/client.ts`

This increases the chance of inconsistent env names, auth persistence behavior, and import drift.

Recommendation:

- Keep one browser Supabase client module.
- Update all imports to use it.
- Keep SSR/browser helper files only if the app actually needs both.

### 6. Student stats and dashboard data include placeholders

`getStudentStats()` selects the first student at `src/app/lib/api.ts:251` and returns hardcoded values like `attendedClasses: 23` at `src/app/lib/api.ts:254`. Admin stats also return `activeSessions: 3` at `src/app/lib/api.ts:227`, mirrored by the Edge Function at `supabase/functions/server/index.ts:355`.

Impact:

- A logged-in student can see another student's data.
- Dashboards may look correct while reporting non-real values.

Recommendation:

- Filter student queries by the authenticated user.
- Calculate attended/total classes from `attendance`.
- Replace `activeSessions` with real session/course scan state or label it as mock data.

### 7. Attendance report aggregation is too simplified

`mapAttendance()` uses `a.students?.student_count || 1` at `src/app/lib/api.ts:155`, but `student_count` belongs to `courses`, not `students`. Each attendance row is mapped as if it represents a whole class summary.

Impact:

- Report totals, present counts, absent counts, and rates can be misleading.

Recommendation:

- Decide whether reports consume raw attendance events or grouped summaries.
- For summaries, aggregate by date and course in SQL or in a dedicated reporting endpoint.
- Use course enrollment counts from `courses.student_count` or normalized enrollment data.

### 8. Face engine logging needs stronger operational rules

The face engine uses an in-memory `logged_students` set at `face_engine/server.py:38`, which prevents repeat logs only for the current process lifetime. It does not account for course, date, class session, or restart behavior.

Recommendation:

- Add a unique attendance constraint such as `(student_id, course_id, date_attended)` or a session-aware equivalent.
- Let the database reject duplicate logs reliably.
- Clear or scope duplicate tracking by date and class session.
- URL-encode REST filters that include names or course names.

### 9. Repository hygiene needs cleanup

The repo tracks files that are usually generated or environment-specific:

- `.env`
- `.env.local`
- `dist/`
- `face_engine/data/faces_data.npy`
- `face_engine/data/names.pkl`

Impact:

- Environment values and local biometric training data can leak into source control.
- Generated `dist` changes create noisy diffs.

Recommendation:

- Add `.env*`, `dist/`, `face_engine/data/*.npy`, and `face_engine/data/*.pkl` to `.gitignore`.
- Keep safe example files such as `.env.example`.
- Remove tracked generated/private files from git history if this repository is shared.

### 10. Bundle size should be reduced before production

The build succeeds, but Vite reports the main JS chunk is about 1 MB minified.

Recommendation:

- Lazy-load route pages with dynamic imports.
- Split heavy chart/UI libraries into separate chunks.
- Review unused dependencies in `package.json`.

## Testing Gaps

The project has no meaningful automated test coverage documented or wired into `package.json`.

Recommended first tests:

- API mapping tests for `src/app/lib/api.ts`.
- Auth guard behavior tests for role redirects.
- Supabase RLS policy tests once policies are added.
- Face engine tests for duplicate attendance logging and missing model/data cases.
- End-to-end smoke test for login, dashboard load, attendance scan, and report update.

## Suggested Fix Order

1. Align Supabase project/env configuration across frontend, Edge Function, and face engine.
2. Add RLS policies and server-side role authorization.
3. Consolidate Supabase clients.
4. Replace hardcoded dashboard/student stats with user-scoped database queries.
5. Fix attendance aggregation and duplicate logging rules.
6. Clean generated/private files from git tracking and update `.gitignore`.
7. Add focused tests around auth, data mapping, and attendance logging.
8. Code-split routes to address the large bundle warning.

## Overall Assessment

The project has a solid feature skeleton and the frontend currently builds, which is a good base. The main work before treating this as production-ready is security and data correctness: enforce authorization outside the browser, align all services to the same Supabase project, remove placeholder stats, and make attendance logging idempotent at the database level.
