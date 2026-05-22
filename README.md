# 🎯 AMS-FaceRec — Attendance Management System with Face Recognition

AMS-FaceRec is a premium, full-stack, enterprise-grade attendance management system. It combines a modern, visually stunning **React + TypeScript (Vite)** frontend, a robust and rate-limited **Express.js** backend, a secure **Supabase PostgreSQL** database with Row-Level Security (RLS), and a high-performance **Python Flask** face recognition engine powered by OpenCV and scikit-learn.

---

## 🏗️ System Architecture & Ports

The system components coordinate dynamically over localized ports using REST APIs, JWT tokens, secure CORS policies, and a shared face engine authorization secret:

```
┌─────────────────────────────────────────────────────────────────┐
│ React + TypeScript (Vite)          Frontend (Port 5173)         │
│ • Routes: src/app/routes.tsx        (Role-based Auth Guards)    │
│ • UI: shadcn/ui + Tailwind v4 + Material UI                     │
│ • API client: src/app/lib/backendApi.ts (JWT auto-injection)    │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS + JWT Bearer Token
┌──────────────────▼──────────────────────────────────────────────┐
│ Express.js Backend Server           (Port 5003)                 │
│ • Security: Helmet + CORS whitelist + Rate Limiting             │
│ • Controllers: try-catch blocks + standardized responses        │
│ • Supabase clients: Service Role (Admin) vs Anon Client         │
└──────────────────┬─────────────────┬────────────────────────────┘
         ┌─────────┘                 │                            │
         │                           │ POST /api/attendance/log   │ GET /api/face/sync
         │                           │ (X-Face-Engine-Secret)     │ (Sync embeddings)
         ▼                           ▼                            ▼
┌───────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────┐
│ Supabase PostgreSQL + RLS │ │ Python Flask             │ │ File System Storage  │
│ • Auth → auth.users       │ │ Face Engine (Port 5001)  │ │ (Local Biometrics)   │
│ • Unified public.users    │ │ • OpenCV Haar Cascades   │ │ • face_engine/data/  │
│ • Custom get_my_role()    │ │ • KNN classifier         │ │ • Strictly ignored   │
└───────────────────────────┘ └──────────────────────────┘ └──────────────────────┘
```

### 🔐 Security & Auth Highlights:
* **Anti-Spoof JWT Verification:** User roles are verified server-side directly from the secure `public.users` database table (and its 1:1 role-extension tables like `student_details` and `teacher_details`) rather than trusting user metadata in the JWT, which is vulnerable to client-side spoofing.
* **Supabase Client Strategy:** The frontend utilizes the public anonymous key (which strictly honors RLS policies), while the backend leverages `SUPABASE_SERVICE_ROLE` in server-only scopes to securely bypass RLS for privileged management tasks.
* **Face Engine Verification:** API hooks between the Python Face Engine and the Express backend are secured via a shared `X-Face-Engine-Secret` header, ensuring only validated engine nodes can submit attendance records.

---

## 🚀 Step-by-Step Installation & Setup

### 📋 Prerequisites
Make sure you have the following installed on your machine:
* **Node.js 20+** & **npm 9+**
* **Python 3.10+** with `pip`
* A working **Webcam** (integrated or USB external)
* A **Supabase Account** with an active PostgreSQL project

---

### 1. 🗄️ Database Setup (Supabase)

AMS-FaceRec relies on a permanent, relational PostgreSQL schema managed inside Supabase.

1. **Database Schema Deployment:**
   * Open your Supabase project's SQL editor.
   * Paste and run the schema definitions found in `supabase/schema.sql` to initialize tables (`users`, `student_details`, `teacher_details`, `admin_details`, `courses`, `timetable_entries`, `attendance`, `face_embeddings`) along with triggers and security functions (`get_my_role`).
   * > [!IMPORTANT]
     > For new setups, **only run `supabase/schema.sql`**. Do not also run the incremental migration files located in `supabase/migrations/` unless you explicitly require legacy incremental updates.

2. **Supabase Edge Functions Deployment (Optional/Required for schema modifications):**
   * Deploy the Edge functions from the project root using the Supabase CLI:
     ```bash
     npx supabase functions deploy server --no-verify-jwt
     ```

---

### 2. 🗃️ Timetable Database Importing

The attendance engine relies on a pre-loaded academic timetable structure parsed directly from a CSV file.

1. **Configure Environment Variables for Importing:**
   To import the master timetable, the Node import script needs admin access to your Supabase instance.
   * **PowerShell (Windows):**
     ```powershell
     $env:SUPABASE_URL="https://your-supabase-url.supabase.co"
     $env:SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
     npm run db:import-timetable
     ```
   * **Terminal (macOS/Linux):**
     ```bash
     SUPABASE_URL="https://your-supabase-url.supabase.co" SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" npm run db:import-timetable
     ```
   * > [!IMPORTANT]
     > Note that the import script specifically requires **`SUPABASE_SERVICE_ROLE_KEY`** in the local shell environment, whereas the Express backend server references **`SUPABASE_SERVICE_ROLE`** in `backend/.env`.
   This will parse `src/app/data/masterTimetable.csv` and populate the `timetable_entries` table.

---

### 3. 💻 Frontend Setup (React + Vite)

The client application drives dashboards, calendars, and student/course management pages.

1. **Install Dependencies:**
   From the project root directory:
   ```bash
   npm install
   ```

2. **Configure Frontend Environment (`.env`):**
   * Copy the template:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` and fill in your Supabase project parameters:
     ```env
     VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
     VITE_BACKEND_URL=http://localhost:5003
     EXPRESS_BACKEND_URL=http://localhost:5003
     FACE_ENGINE_SECRET=change-me
     ```

3. **Start Frontend Client:**
   ```bash
   npm run dev
   ```
   * The client will boot at **`http://localhost:5173`**.
   * > [!NOTE]
     > **Fallback Port:** If `VITE_BACKEND_URL` is ever left unset, the frontend client will automatically fall back to **`http://localhost:5003`** (Express Server default).

---

### 4. ⚙️ Express Backend Server Setup

The Express gateway handles permissions, sanitization, system approvals, and secure attendance logging hooks.

1. **Navigate and Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Backend Environment (`backend/.env`):**
   * Copy the template:
     ```bash
     cp .env.example .env
     ```
   * Open `backend/.env` and define your credentials. Make sure `PORT=5003` is correctly set to match the frontend `VITE_BACKEND_URL`:
     ```env
     PORT=5003
     SUPABASE_URL=https://your-supabase-project.supabase.co
     SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE=your-supabase-service-role-key  # Keep private!
     FRONTEND_URL=http://localhost:5173
     FACE_ENGINE_SECRET=change-me  # MUST match the root .env FACE_ENGINE_SECRET exactly
     ```

3. **Seed Demo Data (Optional):**
   Run once after importing `schema.sql` to quickly seed mock users (admin, teachers, and students) into the authentication schema:
   ```bash
   npm run seed:demo
   ```
   * See [👥 Authenticated Demo Credentials](#-authenticated-demo-credentials) below for accounts and passwords.

4. **Start Backend Server:**
   ```bash
   npm run dev
   ```
   * The server runs in hot-reload mode on **`http://localhost:5003`**.

---

### 5. 🔑 Provisioning the First Admin User

To log in and approve self-registered students or manage instructors, you need an administrative account. Choose one of the two methods below:

#### Method A: Automated Demo Seed (Recommended)
1. Run the backend seed command:
   ```bash
   cd backend && npm run seed:demo
   ```
2. Log in using the seeded administrator:
   * **Email:** `admin@abvgiet.ac.in`
   * **Password:** `Admin@Password2024`

#### Method B: Manual Supabase Provisioning
1. Open your **Supabase Project Dashboard** → **Authentication** → **Users**.
2. Click **Add User** → **Create User** and enter an email/password.
3. Once created, navigate to the **SQL Editor** in Supabase and execute the following query to elevate the account to `admin` role and hook the trigger parameters:
   ```sql
   -- Replace 'USER_UUID' with the actual ID copied from Supabase Auth Dashboard
   UPDATE public.users
   SET role = 'admin', approval_status = 'approved'
   WHERE id = 'USER_UUID';
   
   INSERT INTO public.admin_details (user_id, permission_scope)
   VALUES ('USER_UUID', 'full')
   ON CONFLICT (user_id) DO NOTHING;
   ```

---

### 6. 🐍 Python Face Recognition Engine Setup

The Python local component processes raw camera feeds, isolates faces via OpenCV cascades, and makes predictions via a K-Nearest Neighbors (KNN) classifier.

1. **Create and Activate a Virtual Environment:**
   Navigate to the `face_engine` directory:
   ```bash
   cd face_engine
   ```
   * **Windows:**
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   * **macOS/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

2. **Install Python Packages:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Parameters:**
   * **Automatic Parent Cascade:** By default, the Python server parses the parent/root `.env` file to fetch backend URLs and secrets automatically.
   * **Local Custom Override:** If you prefer to isolate python keys, copy the template `cp .env.example .env` inside the `face_engine/` directory and configure the variables there.

4. **Start the Flask Engine:**
   ```bash
   python server.py
   ```
   * The Flask server starts on **`http://localhost:5001`**.

5. **Run Tests to Verify Python Setup:**
   Run the pytest suite to confirm routing, KNN handling, and mocking are perfectly configured:
   ```bash
   python -m pytest -v
   ```

---

## ⚡ Quick Multi-Service Startup Summary

For local development, open **3 terminal windows** and run the following commands side-by-side (with Supabase running in the cloud):

```bash
# Terminal 1: React Frontend (Root Directory)
npm run dev

# Terminal 2: Express Gateway (backend/ Directory)
cd backend && npm run dev

# Terminal 3: Face Recognition Engine (face_engine/ Directory)
cd face_engine && .venv\Scripts\activate && python server.py
```

---

## 🗃️ Detailed Environment Variable Reference

### Root Directory (`.env` — Frontend & Python Engine Defaults)

| Variable | Recommended / Default Value | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://*.supabase.co` | Endpoint URL of your Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_*` | Public anonymous key for client RLS operations |
| `VITE_BACKEND_URL` | `http://localhost:5003` | Express Gateway API URL for frontend components |
| `EXPRESS_BACKEND_URL` | `http://localhost:5003` | Targets the Express server to pipe attendance records |
| `FACE_ENGINE_SECRET` | `change-me` | Shared secret with python face engine |

### Backend Directory (`backend/.env` — Server Configuration)

| Variable | Recommended / Default Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5003` | Node Express listening port |
| `SUPABASE_URL` | `https://*.supabase.co` | Standard Supabase project API endpoint |
| `SUPABASE_ANON_KEY` | `sb_publishable_*` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE` | *(your-private-service-key)* | **Highly Sensitive** key used by server to manage schemas and bypass RLS |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS header origin to allow Vite client queries |
| `FACE_ENGINE_SECRET` | `change-me` | Shared secret verified by backend when receiving biometric logs |
| `SMTP_HOST` | `smtp.gmail.com` | Outgoing email server address |
| `SMTP_PORT` | `587` | TLS port for email |
| `SMTP_USER` | `example@gmail.com` | Active Gmail account for dispatching notifications |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | Generated Google 16-character **App Password** |
| `SMTP_FROM_NAME` | `SunnyAttend` | Outgoing email sender label |

---

## 👥 Authenticated Demo Credentials

These accounts are instantly available if you seeded the database using `npm run seed:demo`:

* **🔑 Admin Portal:**
  * **Email:** `admin@abvgiet.ac.in`
  * **Password:** `Admin@Password2024`
* **🎓 Teacher Portal:**
  * **Email:** `dr.smith@sunnyattend.com`
  * **Password:** `Teacher@AMS2024`
* **👤 Student Portal:**
  * **SBRN (Username):** `2024CE001`
  * **Password:** `Student@AMS2024`

---

## 🔁 Complete Biometric Enrollment & Attendance Workflow

```
1. Enrollment Capture (Webcam)  →  2. Embeddings Generated  →  3. Model Re-Trained  →  4. Sync to DB
        (Web UI)                   (OpenCV / NumPy)             (scikit-learn KNN)      (Supabase Storage)
```

1. **Capture Images:** The Admin opens the **Admin Panel** → **Add Student**. Under biometric configuration, the webcam capture captures 100 high-quality frames of the student's face via the local webcam and writes files to `face_engine/data/`.
2. **Train & Predict:** The Python Flask server maps facial features to a feature array (`faces_data.npy`) and labels list (`names.pkl`). The KNN model is instantly re-trained to recognize this new face.
3. **Synchronize:** Local embeddings are optionally uploaded and synchronized with Supabase Storage via `GET /api/face/sync` to ensure high availability across multiple system instances.
4. **Attendance Logging:** In a live classroom setup:
   * The teacher loads the **Live Camera Attendance** page.
   * The Python Flask engine begins processing active video streams.
   * When a student face is identified with a confidence value exceeding the recognition threshold, a **`POST /api/attendance/log`** request with the student's SBRN is sent to the Express backend (protected by `X-Face-Engine-Secret` headers).
   * The backend validates that the student profile is active and records a single daily attendance entry preventing duplication.

---

## ⚠️ Troubleshooting & Common Gotchas

### 🚨 "Python Face Engine Offline" or Mismatched Biometrics
* **Cause:** The Python engine is not running or the biometric dataset is corrupted due to an interrupted camera capture (lengths of `faces_data.npy` and `names.pkl` differ).
* **Fix:**
  1. Terminate the Python flask process.
  2. Empty the contents of `face_engine/data/` (keep the directory empty).
  3. Restart the Python Flask server: `python server.py`.
  4. Perform face enrollment from the Admin page again.

### 🎥 Webcam Failing to Boot (Windows Specific)
* **Cause:** OpenCV is attempting to open the camera using an incorrect index or DirectShow interface conflicts.
* **Fix:**
  * Open `face_engine/server.py` and search for `cv2.VideoCapture(0)`.
  * Try changing the device index to `1` or `2` (e.g., `cv2.VideoCapture(1)` or `cv2.VideoCapture(2)`) if you have multiple capture devices plugged in.

### 🔓 "Failed to Fetch" or CORS API Errors
* **Cause:** The frontend cannot establish a connection with the Express gateway, or the backend is discarding requests due to a CORS origin mismatch.
* **Fix:**
  * Check that your root `.env` points `VITE_BACKEND_URL` and `EXPRESS_BACKEND_URL` to `http://localhost:5003`.
  * Verify that `PORT=5003` is correctly set in `backend/.env`.
  * Ensure `FRONTEND_URL` in `backend/.env` exactly matches your active frontend browser URL (`http://localhost:5173`).

### 📧 SMTP Notification Dispatches Failing
* **Cause:** Gmail blocking unauthorized connections or wrong SMTP App Password.
* **Fix:**
  * Double check that the SMTP credentials in `backend/.env` are not using your standard Google account login password.
  * You **must** generate a 16-character **App Password** from Google Accounts (Security tab → App passwords) after enabling 2-Step Verification.

---

## 🔗 Key Documentation References

* **📂 Technical Architecture & Quirks:** [docs/AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md)
* **📊 Current Phase Status & Backlog:** [docs/STATUS.md](docs/STATUS.md)
* **🧩 Database Relationships & Diagrams:** [guidelines/database_schema_guide.md](guidelines/database_schema_guide.md)
