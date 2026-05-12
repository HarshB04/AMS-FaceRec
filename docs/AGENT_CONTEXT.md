# Agent Context & Implemented Features

> **Purpose:** This document serves as the primary technical summary for future AI agents working on this repository. It details the implemented features, security architecture, and system quirks to prevent regression and provide immediate context.

## 1. Security & Authentication (Phase 1)
- **Supabase Integration**: Auth is handled via Supabase using `@supabase/ssr` on the frontend.
- **Secure RLS Architecture**: 
  - We do **NOT** rely on `user_metadata` for roles because it is vulnerable to JWT spoofing.
  - Instead, roles are securely stored in the `public.profiles` table.
  - A database trigger (`handle_new_user`) automatically creates profile entries on signup.
  - RLS policies use a custom Postgres function `get_my_role()` to enforce permissions safely across all tables.
- **Routing**: `AuthGuard.tsx` enforces role-based access control, redirecting users to `/admin`, `/teacher`, or `/student` dashboards based on their role.

## 2. Admin Portal (Phase 2)
- **Data Management**: Full CRUD capabilities for `students`, `courses`, and `instructors` tables.
- **Course Enrollment**: Admins can assign students to specific courses. The system updates the student's `course` field accordingly.
- **UI Stack**: Built heavily on Shadcn UI components (Dialogs, Tables, Inputs) using Tailwind CSS. 

## 3. Face Enrollment Workflow (Phase 3)
- **Python Engine Integration**: A local Python Flask server (`face_engine/server.py`) handles hardware interactions (webcam). 
- **Admin Enrollment**: Admins register student faces through the web UI, which triggers the Python engine to collect 100 frames via `cv2.CascadeClassifier`.
- **Resilience**: The frontend gracefully handles "Python Engine Offline" scenarios using custom fetch wrappers.
- **Data Storage**: Facial data is stored locally in `face_engine/data/` as `.npy` and `.pkl` files (which are strictly `.gitignore`'d for privacy).

## 4. Teacher Live Dashboard (Phase 4)
- **Dynamic Rosters**: The Teacher's class list dynamically queries Supabase for courses where they are listed as the instructor.
- **Live Camera Integration**: The UI routes to `/teacher/camera?course=COURSE_NAME` and dynamically loads the total enrolled students count.
- **Attendance Processing**: The Python engine uses a KNN model (`KNeighborsClassifier`) to recognize faces and pushes `present` attendance records directly to the Supabase `attendance` table. 
- **UI Hardening**: Edge cases like `NaN%` for courses with zero enrolled students are fully handled.

## 5. Known Gotchas & Historical Fixes
- **Python Dataset Mismatches**: In the past, the Python face recognition crashed if `faces_data.npy` and `names.pkl` had different lengths due to an interrupted face capture. `test_faces.py` now includes a strict length assertion to prevent cryptic crashes. If they mismatch, the `data/` folder contents must be deleted and faces re-enrolled.
- **Environment Variables**: The Python scripts (`server.py`, `test_faces.py`) are configured to automatically parse the root `.env` file to fetch `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not hardcode keys in Python files.
- **Git Hygiene**: `.env`, `.env.local`, and biometric data (`face_engine/data/*`) are strictly excluded via `.gitignore`. 

---
*End of Context Document.*
