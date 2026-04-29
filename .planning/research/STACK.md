# Stack Research: Attendance Management System additions

## 1. Validated Baseline
- **Frontend:** React + Vite (already configured)
- **Backend:** Python + OpenCV + Flask (for face recognition)
- **Database:** Supabase (PostgreSQL + Auth + Storage)

## 2. Recommended Additions for Target Features

### Frontend Data Fetching & State
- **Recommendation:** `Supabase-js` direct client querying + `Zustand` (if global state is needed).
- **Rationale:** The application is already using `supabase-js`. Since the backend face engine is totally decoupled, the frontend acts as a pure SPA dashboard. Zustand is lighter than Redux for UI state.

### Reports & Exporting
- **CSV Export:** `papaparse`
- **PDF Export:** `jspdf` + `jspdf-autotable`
- **Rationale:** These are the industry standards for client-side exporting. Because Supabase handles the data, it is cheaper to download the JSON to the browser and generate the CSV/PDF locally than spinning up a cloud function.

### Automated Emails
- **Recommendation:** Supabase Edge Functions + Resend (or SendGrid API).
- **Rationale:** Edge Functions can run on Postgres Database Webhooks. Whenever a row in `attendance` is inserted with `status = absent`, the webhook triggers the Edge Function, which sends the email via Resend instantly. This offloads the alerting logic from both the Python engine and the React frontend.

## 3. What NOT to Use
- **Do not use a middle-tier Node.js API:** You already have Supabase. Building an Express.js backend just to serve JSON to the frontend is redundant and breaks the current architecture. Use Supabase RLS for security instead.
- **Do not use Python for emails:** The face-recognition camera script should focus ONLY on hardware processing and pushing data. Adding email SMTP logic to it will block the camera thread.
