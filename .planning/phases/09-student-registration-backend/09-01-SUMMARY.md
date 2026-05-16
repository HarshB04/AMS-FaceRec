---
plan: "09-01"
phase: "09"
status: "complete"
completed: "2026-05-15"
self_check: "PASSED"
---

# Summary: 09-01 — Secure Express.js Backend Core

## What Was Built

A production-grade Express.js backend server (`backend/`) that isolates the Supabase service role key from the browser. The server enforces security at every layer: Helmet headers, tiered CORS, rate limiting, JWT verification against `public.profiles`, and role-based route guards.

## Key Files Created

- `backend/server.js` — Express app entry point with Helmet, CORS (allowlist), tiered rate limiters (global 100/15min, auth 10/15min, registration 5/15min), JSON size guard (1MB)
- `backend/config/supabaseClient.js` — Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY` (never sent to browser)
- `backend/middleware/authMiddleware.js` — Validates `Bearer` tokens via `supabase.auth.getUser()` + cross-references `public.profiles` for role
- `backend/middleware/roleMiddleware.js` — `requireRole(...roles)` factory used to gate admin and student routes
- `backend/routes/authRoutes.js` + `backend/controllers/authController.js` — `POST /api/auth/admin/login`, `POST /api/auth/student/login`, `GET /api/auth/me`
- `backend/routes/studentRoutes.js` + `backend/controllers/studentController.js` — Full student CRUD: register, profile, all, update, delete
- `backend/package.json` — Dependencies: express, @supabase/supabase-js, helmet, cors, express-rate-limit, dotenv, nodemailer

## Notable Decisions

- **Role source**: Roles are read from `public.profiles`, not JWT `user_metadata` — prevents JWT spoofing as per project security contract
- **Student login**: `studentLogin` checks `profiles.approval_status === 'approved'` before returning session — unapproved students cannot log in
- **CORS**: Allows `FRONTEND_URL` env var + `localhost:5174` fallback; rejects all other origins

## Self-Check: PASSED

- ✅ All endpoints return structured JSON error objects
- ✅ 404 and global error handlers in place
- ✅ Service role key confined to backend process only
- ✅ Role verification uses profiles table, not JWT metadata
