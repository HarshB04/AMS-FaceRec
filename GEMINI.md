# AMS-FaceRec Project Instructions

Attendance Management System with Face Recognition. This project combines a React frontend, a Python-based face recognition engine, and a Supabase backend to provide a secure, role-based attendance solution.

## Architecture & Tech Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS (v4), Shadcn UI, Lucide Icons.
- **Backend:** Supabase (PostgreSQL, Row Level Security, Edge Functions).
- **Face Engine:** Python (Flask, OpenCV, scikit-learn).
- **Routing:** React Router v7 with role-based `AuthGuard`.

## Core Conventions & Rules

### 1. Security & Authentication
- **Roles:** User roles are stored in `public.profiles`, NOT `user_metadata` (to prevent JWT spoofing).
- **RLS:** All tables must have Row Level Security enabled. Policies should utilize the custom Postgres function `get_my_role()` to enforce permissions.
- **Auth Guard:** Use the `AuthGuard` component to protect routes based on roles (`admin`, `teacher`, `student`).

### 2. Frontend Development
- **Strict TypeScript:** Required for all new files. Avoid `any`.
- **Imports:** Use the `@/` path alias for absolute imports from the `src/` directory.
- **Styling:** Prefer Tailwind CSS utility classes. Use Shadcn UI components for consistent design.
- **Environment Variables:** Access via `import.meta.env.VITE_*`. Do not use `process.env`.
- **Components:** Default to "light" theme unless a `ThemeProvider` is explicitly requested/implemented.

### 3. Backend (Supabase)
- **Edge Functions:** Use for complex logic and direct relational SQL queries.
- **Triggers:** Use Postgres triggers (e.g., `handle_new_user`) for automatic data management across tables.
- **Schema:** Follow the relational schema defined in `supabase/schema.sql`.

### 4. Face Engine (Python)
- **Local Server:** A Flask server (`face_engine/server.py`) handles hardware interactions (webcam).
- **Communication:** Communicates directly with Supabase using credentials from the root `.env` file.
- **Biometric Data:** Stored locally in `face_engine/data/`. NEVER commit these files to the repository.
- **Data Integrity:** Strict length assertions between `.npy` and `.pkl` files are required to prevent recognition crashes.

## Workflows

### Phase-Based Development
Follow the roadmap and phases documented in `.planning/` and track progress in `STATUS.md`.

### Face Enrollment
- Admins must lead the face enrollment process via the web UI to ensure identity verification.
- The Python engine collects 100 frames for robust recognition.

## Important Gotchas
- **"Failed to Fetch" Errors:** Usually caused by mismatched Edge Function URLs. Ensure `api.ts` correctly points to the deployed function path (`/functions/v1/server/`).
- **Python Dataset:** If biometric data files get out of sync (different lengths), delete the contents of `face_engine/data/` and re-enroll.

---
*Refer to AGENT_CONTEXT.md for detailed implementation history and technical quirks.*
