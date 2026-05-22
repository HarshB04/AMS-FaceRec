# AMS-FaceRec — Attendance Management System with Face Recognition

A premium, full-stack attendance management system combining a modern **React + Vite** frontend, a secure **Express.js** backend, a permanent **Supabase PostgreSQL** database, and a highly responsive **Python Flask** face recognition engine.

---

## 🏗️ System Architecture & Ports

The system components run on coordinated local ports and communicate securely via JWT tokens and a shared engine secret:

```
┌─────────────────┐             HTTPS             ┌──────────────────┐
│   React / Vite  │ ────────────────────────────> │  Express Backend │
│  (Port 5173)    │ <──────────────────────────── │  (Port 5003)     │
└─────────────────┘           JWT Bearer          └──────────────────┘
        ▲                                                   ▲
        │                                                   │
        │ Direct Stream                                     │ POST /api/attendance/log
        │ (MJPEG feeds)                                     │ (X-Face-Engine-Secret)
        │                                                   │
┌─────────────────┐                                         │
│   Face Engine   │ ────────────────────────────────────────┘
│  (Port 5001)    │ ◀───────────────────────────────────────┐
└─────────────────┘        GET /api/face/sync               │
                                                            ▼
                                                  ┌──────────────────┐
                                                  │     Supabase     │
                                                  │ (Auth + DB + RLS)│
                                                  └──────────────────┘
```

### 🔐 Security & Auth Highlights:
* **JWT Verification:** Authentication is verified server-side. User roles are fetched directly from the secure database `profiles` table to prevent client-side JWT role-metadata spoofing.
* **Supabase Client Strategy:** The backend uses the highly privileged `SUPABASE_SERVICE_ROLE` key to orchestrate operations while enforcing Row Level Security (RLS) policies at the database level for all user roles.
* **Face Engine Verification:** All logging communication between the Python Face Engine and the Express backend is secured with a shared header secret (`X-Face-Engine-Secret`).

---

## 🚀 Quick Start Guide

### 1. Supabase Database Migration
Ensure your database tables and functions are deployed.
* Edit and run migrations located in `supabase/migrations/` or schema file `supabase/schema.sql` in your Supabase SQL Editor.
* If making changes to the Edge functions, redeploy with:
  ```bash
  npx supabase functions deploy server --no-verify-jwt
  ```

### 2. Frontend Setup (React + Vite)
The frontend manages user dashboards, course registration, scheduling, and admin panels.

```bash
# 1. Install packages
npm install

# 2. Configure environment
# Make sure your root `.env` exists and contains correct values:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# VITE_BACKEND_URL=http://localhost:5003

# 3. Import timetable data (CSV schedule)
npm run db:import-timetable

# 4. Start development server
npm run dev
# → Local preview: http://localhost:5173
```

### 3. Backend Setup (Express.js)
The backend acts as the gateway API, enforcing rate limits, roles, and processing logging hooks.

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
# Edit backend/.env file (use .env.example as template)
# Ensure PORT=5003 and SMTP credentials are set up.

# 4. Run development backend with hot-reload
npm run dev
# → Running on: http://localhost:5003
```

### 4. Python Face Engine Setup
A Python Flask server coordinates OpenCV Haar cascade face detection and KNN embeddings classification.

```bash
# 1. Navigate to face_engine directory
cd face_engine

# 2. Activate Python Virtual Environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3. Install packages
pip install -r requirements.txt

# 4. Start the face recognition engine
python server.py
# → Running on: http://localhost:5001
```

---

## 🗃️ Environment Configurations

### Frontend (`.env` - Root Directory)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | *(your-supabase-url)* | Supabase project API endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | *(your-anon-key)* | Supabase publishable/anonymous API key |
| `VITE_BACKEND_URL` | `http://localhost:5003` | Express API address for frontend calls |
| `EXPRESS_BACKEND_URL` | `http://localhost:5003` | Used by Face Engine to identify target API |

### Backend (`backend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5003` | Server listening port |
| `SUPABASE_URL` | *(your-supabase-url)* | Same as frontend |
| `SUPABASE_ANON_KEY` | *(your-anon-key)* | Same as frontend publishable key |
| `SUPABASE_SERVICE_ROLE` | *(your-service-role)* | **Secret** Service Role Key (bypasses RLS) |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin header |
| `FACE_ENGINE_SECRET` | *(your-secret)* | Shared secret with the Python Face Engine |
| `SMTP_HOST` | `smtp.gmail.com` | Email host for enrollment/approval logs |
| `SMTP_PORT` | `587` | Email connection port |
| `SMTP_USER` | *(your-email)* | SMTP user email address |
| `SMTP_PASS` | *(your-app-password)* | App specific password |
| `SMTP_FROM_NAME` | `SunnyAttend` | Outgoing email sender display name |

---

## 📡 Backend API Endpoints

### 🔑 Authentication (`/api/auth`)
* `POST /api/auth/register` — Self-registration for students.
* `POST /api/auth/admin/login` — Admin login panel.
* `POST /api/auth/teacher/login` — Teacher login panel.
* `POST /api/auth/student/login` — Student login panel.
* `GET /api/auth/me` — JWT verification + authoritative profile recovery.

### 👥 Student Management (`/api/students`)
* `GET /api/students/all` — List all registered students (Admin only).
* `POST /api/students/register` — Direct administrative student creation.
* `GET /api/students/profile` — Read active student profile.
* `PUT /api/students/:id` — Update profile metadata (Admin only).
* `DELETE /api/students/:id` — Remote delete student profile and authentication details.

### 🛡️ Approvals & Admin Roles (`/api/admin`)
* `GET /api/admin/pending-users` — Retrieve self-registered accounts awaiting approval.
* `GET /api/admin/all-registration-users` — Retrieve complete list of registered users.
* `POST /api/admin/approve/:id` — Approve pending registration (Triggers notification email).
* `POST /api/admin/reject/:id` — Reject/purge registration records.

### 📸 Face Enroll & Sync (`/api/face`)
* `GET /api/face/sync` — Synchronize local KNN model data with backend DB.
* `POST /api/face/sync` — Upload newly captured face embeddings to Supabase storage.
* `POST /api/face/enroll-complete` — Finalize student enrollment pipeline.

### 📝 Attendance Tracking (`/api/attendance`)
* `POST /api/attendance/log` — Secure logger. Used by the Python Face Engine to post scans.

---

## 👥 Role Matrix

| Role | Interface / View | Key Privileges |
| :--- | :--- | :--- |
| **`admin`** | `/login` (Admin tab) | Full CRUD on students, teachers, courses, class schedules, and system overrides. |
| **`teacher`** | `/login` (Teacher tab) | Monitor live dashboard, access class rosters, manual attendance editing, and data export. |
| **`student`** | `/login` (Student tab) | View personalized calendar/schedule, review historical attendance logs, and edit personal profiles. |
