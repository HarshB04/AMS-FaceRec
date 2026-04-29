# Architecture Research: Attendance Management System additions

## 1. Component Boundaries

### Edge (Hardware) -> Face Engine (Python)
- Captures frames, detects faces, extracts embeddings.
- Maintains a local memory cache of "today's scans" to prevent immediate network spam.
- **Boundary:** Only communicates Outbound to Supabase via HTTP `POST` requests to the REST API. Does not accept inbound connections.

### Cloud Backend -> Supabase (Postgres + Auth + Edge Functions)
- **Postgres:** The absolute source of truth. Enforces `UNIQUE` constraints and `RLS` policies.
- **Auth:** Manages JWTs and session lifecycle.
- **Edge Functions (New):** Listens to Postgres triggers (e.g., `ON INSERT attendance WHERE status='absent'`) to dispatch emails.

### Client -> React Dashboard (Vite)
- A pure SPA. Reads/Writes directly to Supabase using `supabase-js`.
- Respects RLS (the UI might hide the 'Admin' tab, but RLS ensures a smart student can't access it via console either).

## 2. Data Flow

**Attendance Capture Flow:**
1. Student walks by camera -> Face Engine recognizes "STU-001".
2. Face Engine `POST`s to Supabase REST API `/attendance`.
3. Supabase validates the API key and RLS. If duplicate, returns `409 Conflict`. If success, returns `201 Created`.
4. (Optional) React Dashboard subscribes via Supabase Realtime to the `attendance` table and instantly displays "STU-001 is Present".
5. (Optional) Database Trigger fires, invoking Edge Function if attendance is anomalous/absent.

**Admin Management Flow:**
1. Admin logs into React dashboard.
2. Dashboard requests `GET /students`.
3. Supabase verifies JWT has `role: admin` and returns data.

## 3. Suggested Build Order
1. **Security Foundation:** Finalize Supabase RLS and Auth integration in the React app (AuthGuard, Login).
2. **Admin Portal:** Build the CRUD interfaces for managing Students and Courses.
3. **Teacher / Student Portals:** Build the read-only or scoped dashboards.
4. **Reporting:** Add CSV/PDF export logic.
5. **Automated Alerting:** Implement Edge Functions / Resend for emails at the very end.
