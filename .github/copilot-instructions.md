---
name: AMS-FaceRec Code Assistant
description: Optimized for full-stack attendance management with face recognition
version: "1.0"
---

# GitHub Copilot Instructions: AMS-FaceRec

You are assisting with **AMS-FaceRec**, a full-stack attendance management system combining
face recognition, role-based access control, and real-time analytics.

## What You Should Know First

1. **Read [AGENTS.md](AGENTS.md)** — Complete system overview, patterns, and gotchas
2. **Bookmark [docs/AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md)** — Implementation status and security model
3. **Check [docs/STATUS.md](docs/STATUS.md)** — Current phase and immediate priorities

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Express.js + Node.js (CommonJS)
- **Database**: PostgreSQL via Supabase (with RLS + Edge Functions in Deno)
- **Face Recognition**: Python 3 + OpenCV + scikit-learn (Flask)
- **Security**: JWT + Supabase Auth + Service Role Isolation

## Architecture Mindset

This system has **three distinct security domains**:

1. **Frontend** (React) — No direct Supabase queries; always route through backend API
2. **Backend** (Express) — Holds service role key; validates all requests; enforces rate limits
3. **Face Engine** (Python) — Isolated process; communicates with backend via shared secret

**Golden Rule**: Data flows Frontend → Backend → Supabase/Face Engine. Never skip the backend.



## Common Tasks

### Add a Frontend Page

1. Create page component in `src/app/pages/MyNewPage.tsx`
2. Add route to `src/app/routes.tsx` with lazy loading + `<AuthGuard role="...">` wrapper
3. Import API functions from `src/app/lib/backendApi.ts` (NOT direct Supabase)
4. Use shadcn/ui components + Tailwind for styling

### Add a Backend Endpoint

1. Create controller function in `backend/controllers/myController.js` (try-catch + standardized response format)
2. Add route to `backend/routes/myRoutes.js` (protect with `authMiddleware` + `requireRole()` if needed)
3. Use `supabaseClient.admin` (service role) for privileged operations
4. Test with curl or Postman before wiring to frontend

### Modify Database Schema

1. Create migration: `npx supabase migration new add_my_table`
2. Write SQL in `supabase/migrations/` (never edit `schema.sql` directly)
3. After deploy, redeploy Edge Functions: `npx supabase functions deploy server --no-verify-jwt`
4. Test RLS policies: roles can only see their own data

### Add Face Recognition Feature

1. Edit `face_engine/server.py` (thread-safe, handle camera failures)
2. Run tests: `python -m pytest -v` (mocks HTTP, no camera needed)
3. Test manually: `python face_engine/test_faces.py` (inspect data integrity)
4. Coordinate backend attendance endpoint for validation

## Code Standards

### Error Responses

All API endpoints return consistent format:

```javascript
// Success
res.json({ data: { id: 123, name: "John" } })

// Client error (400-499)
res.status(400).json({ error: "ValidationError", message: "Email required" })

// Server error (500+)
res.status(500).json({ error: "DatabaseError", message: "Connection failed" })
```

### Frontend API Calls

Always use the API wrapper; never direct Supabase:

```typescript
import { backendApi } from '@/app/lib/backendApi';

// Correct: auto-injects JWT bearer token
const { data } = await backendApi.get('/api/students');

// Wrong: no JWT, violates security model
const { data } = await supabase.from('students').select();
```

### Role-Based Rendering

Wrap sensitive UI in `<AuthGuard>`:

```tsx
<AuthGuard role="admin">
  <AdminPanel />
</AuthGuard>

<AuthGuard role={["teacher", "admin"]}>
  <Classroom />
</AuthGuard>
```

Role is fetched from DB (not JWT) — cannot be spoofed.

## Key Gotchas

1. **Face data corruption**: Interrupted enrollment causes `faces_data.npy` / `names.pkl` mismatch → Delete `face_engine/data/` and re-enroll
2. **Edge Function 404s**: Schema changes require redeploy → `npx supabase functions deploy server --no-verify-jwt`
3. **Camera won't open (Windows)**: Try DirectShow test → `python face_engine/test_dshow.py`
4. **Env variables not loading**: Run from correct directory → `cd face_engine && python server.py`
5. **CORS failures**: Frontend URL not whitelisted in `backend/.env` → Add to `FRONTEND_URL` list

## Before You Code

- [ ] Understand the endpoint/component's role (user type: admin/teacher/student?)
- [ ] Check existing patterns in nearby files (don't reinvent error handling)
- [ ] Verify database schema changes don't break RLS policies
- [ ] Test rate limits and auth on new endpoints
- [ ] Run tests: `npm run dev` (frontend), `npm run test` (backend/face engine if available)

## Documentation to Reference

| File | When to Read |
|------|--------------|
| [AGENTS.md](AGENTS.md) | Overview of all patterns + troubleshooting |
| [docs/AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md) | Implementation details + security model |
| [docs/STATUS.md](docs/STATUS.md) | Current phase + blockers |
| [guidelines/database_schema_guide.md](guidelines/database_schema_guide.md) | ER diagram + table relationships |
| [README.md](README.md) | Architecture diagram + quick start |

## Quick Commands

```bash
# Development
npm run dev                               # Frontend (port 5173)
cd backend && node server.js              # Backend (port 5000)
cd face_engine && python server.py        # Face engine (port 5001)

# Testing & Deployment
npm run build                             # Production build
python -m pytest face_engine/tests -v     # Face engine tests
npx supabase migration list               # Check DB migrations
npx supabase functions deploy server --no-verify-jwt  # Update Edge Function
```

---

**Questions?** Start with [AGENTS.md](AGENTS.md) — it covers most scenarios.