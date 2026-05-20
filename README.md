# AMS-FaceRec — Attendance Management System with Face Recognition

A full-stack attendance management system using React + Vite (frontend),
Express.js (backend), Supabase (database/auth), and a Python Flask face
recognition engine.

---

## Architecture

```
┌──────────────┐     HTTPS      ┌──────────────────┐     Service Role    ┌─────────────────┐
│  React/Vite  │ ─────────────▶ │  Express Backend  │ ──────────────────▶ │    Supabase     │
│  (port 5173) │ ◀─────────────  │  (port 5000)      │                     │  Auth + DB + RLS│
└──────────────┘    JWT Bearer  └──────────────────┘                     └─────────────────┘
                                                                                   ▲
┌──────────────────────────────────────────────────────────────────────────────────┘
│  Python Flask Face Engine (port 5000 → face_engine/server.py — runs separately)
```

**Security model:**

- The `SUPABASE_SERVICE_ROLE` key lives only in `backend/.env` — never in the
  browser.
- `AuthGuard` reads role from the `profiles` table (via backend), not from JWT
  metadata (which is spoofable).
- RLS policies enforce all Supabase direct queries as a second layer.

---

## Quick Start

### 1. Database Migration

Run the following file in the **Supabase SQL Editor** (Dashboard → SQL Editor):

```
supabase/schema.sql               ← full schema (if starting fresh)
supabase/migrations/add_profile_fields.sql  ← adds full_name, department, semester, etc.
```

### 2. Frontend

```bash
# Install dependencies
npm install

# Configure environment
# .env is already present — edit if needed
# VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_BACKEND_URL

# Start dev server
npm run dev
# → http://localhost:5173
```

### 3. Backend (Express API)

```bash
cd backend

# Install dependencies
npm install

# Configure environment
# Edit backend/.env — fill in SUPABASE_SERVICE_ROLE
# (Find it in: Supabase Dashboard > Project Settings > API > service_role key)

# Start the server
node server.js
# or with auto-reload:
npm run dev
# → http://localhost:5000
```

### 4. Python Face Engine (optional for face recognition)

```bash
cd face_engine
pip install -r requirements.txt
python server.py
# → http://localhost:5000  ← note: change backend port if running both
```

---

## Environment Variables

### Frontend (`.env`)

| Variable                        | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | Supabase project URL                                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key                          |
| `VITE_BACKEND_URL`              | Express backend URL (default: `http://localhost:5000`) |

### Backend (`backend/.env`)

| Variable                | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `PORT`                  | Server port (default: `5000`)                          |
| `SUPABASE_URL`          | Same as frontend                                       |
| `SUPABASE_ANON_KEY`     | Supabase anon key (for JWT verification)               |
| `SUPABASE_SERVICE_ROLE` | **Secret** — service role key (bypasses RLS)           |
| `FRONTEND_URL`          | Allowed CORS origin (default: `http://localhost:5173`) |

---

## Backend API Endpoints

### Auth

| Method | Path                      | Auth   | Description                                |
| ------ | ------------------------- | ------ | ------------------------------------------ |
| POST   | `/api/auth/admin/login`   | None   | Admin login — role verified server-side    |
| POST   | `/api/auth/student/login` | None   | Student login — role verified server-side  |
| GET    | `/api/auth/me`            | Bearer | Fetch current user's authoritative profile |

### Students

| Method | Path                     | Auth    | Description                                   |
| ------ | ------------------------ | ------- | --------------------------------------------- |
| POST   | `/api/students/register` | Admin   | Create auth user + profiles + students record |
| GET    | `/api/students/profile`  | Student | Get own profile + attendance stats            |
| GET    | `/api/students/all`      | Admin   | List all students                             |
| PUT    | `/api/students/:id`      | Admin   | Update student profile                        |
| DELETE | `/api/students/:id`      | Admin   | Delete student + auth user                    |

---

## Roles

| Role      | Login                  | Capabilities                                     |
| --------- | ---------------------- | ------------------------------------------------ |
| `admin`   | `/login` (Admin tab)   | Full CRUD — students, teachers, courses, reports |
| `teacher` | `/login` (Teacher tab) | View classes, mark attendance, view reports      |
| `student` | `/login` (Student tab) | View own profile, attendance history, schedule   |
