---
created: 2026-04-29T04:08:41.632Z
title: Perform expert code review and architecture analysis on AMS-FaceRec
area: general
files:
  - guidelines/review.md
  - face_engine/server.py
  - src/
---

## Problem

The existing `guidelines/review.md` contains a high-level audit identifying several critical and high-priority issues in the AMS-FaceRec project, including:

1. **No backend authorization** — RLS policies are not enforced; any authenticated user can read/modify all data.
2. **Hardcoded credentials** — `face_engine/server.py` has the Supabase anon key hardcoded as a fallback default (line 20), which risks exposure if the file is committed to a public repo.
3. **Mismatched Supabase projects** — The frontend `.env` and the face engine point to different Supabase projects/URLs, causing "Failed to fetch" errors.
4. **Placeholder dashboard stats** — Student/attendance counts are hardcoded instead of being fetched from the database.
5. **Duplicate attendance logging** — No database-level constraint prevents the same student being marked present twice in the same session.
6. **Large bundle (1 MB+)** — No code-splitting; all routes loaded eagerly, causing slow initial loads.
7. **Private/generated files tracked in git** — `.env`, `face_engine/data/`, and `face_engine/models/` should be in `.gitignore`.
8. **No meaningful test coverage** — Auth flows, data mapping, and attendance logging have no automated tests.

A full expert code review (covering security, performance, architecture, and maintainability) needs to be executed against the entire codebase using the analysis prompt template captured in this todo.

## Solution

Execute the Expert Code Review & Architecture Analysis prompt against all key source files:

1. **Security first** — Fix hardcoded Supabase key in `face_engine/server.py`; add/verify RLS policies in Supabase dashboard; remove secrets from git history.
2. **Auth & authorization** — Add server-side role checks (admin/teacher/student) beyond browser-only route guards.
3. **Data correctness** — Add a unique constraint on `(session_id, student_id)` in the `attendance` table; replace placeholder stats with scoped DB queries.
4. **Supabase consolidation** — Ensure `VITE_SUPABASE_URL` and face engine URL both point to the same project; remove duplicate client initializations.
5. **Bundle optimization** — Implement React.lazy + Suspense for route-level code splitting.
6. **Git hygiene** — Update `.gitignore` to exclude `.env*`, `face_engine/data/`, `face_engine/models/`, and `dist/`.
7. **Testing** — Add unit tests for auth logic, data mapping utilities, and attendance duplicate prevention; add an E2E smoke test.

Reference the full analysis prompt template in `guidelines/review.md` for the structured review format (quality score, categorized issues, atomic implementation plan, architectural recommendations, risk assessment).
