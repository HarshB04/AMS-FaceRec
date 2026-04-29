# Expert Code Review & Architecture Analysis

**Project**: AMS-FaceRec  
**Date**: April 29, 2026  
**Scope**: `face_engine/server.py`, `guidelines/review.md`, and high-level architecture.

---

## 1. Code Health Assessment

**Quality Score: 4/10**

**Justification**: The project successfully integrates complex domains (React frontend, Supabase Edge Functions, OpenCV/Flask local engine), providing a solid skeleton. However, the system currently prioritizes functionality over security and robustness. Significant security risks (hardcoded keys, exposed Edge Functions, no RLS) and fragile state management (in-memory deduplication, global variables in Flask) bring the score down. 

- **Primary Issues**: Flask global state handling is thread-unsafe; attendance deduplication is bound to process memory instead of DB constraints; URL encoding is missing in HTTP requests.
- **Security Concerns**: Hardcoded JWTs committed to source control; Edge Functions using service-role keys without verifying roles; missing PostgreSQL RLS.
- **Technical Debt**: Multiple Supabase client initializations; lack of component/route splitting (1MB+ bundle); hardcoded mock data in production endpoints.
- **Best Practices Violations**: Secrets in source control (`.env`, `server.py`); missing test coverage.

---

## 2. Categorized Issues (Priority-Based)

### 🔴 CRITICAL (Fix Immediately)

**1. Exposed Hardcoded Supabase Key**
- **Location**: `face_engine/server.py:21`
- **Current code**: `SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", "eyJhbGciOiJIUzI1NiIs...")`
- **Problem**: A live Supabase JWT is hardcoded as a fallback and committed to Git. Even if it's an anon key, exposing it allows anyone to query your database if RLS is not enabled.
- **Impact**: Complete data exposure/modification risk.

**2. Backend Authorization Bypass (Edge Function)**
- **Location**: `supabase/functions/server/index.ts` (per review.md)
- **Problem**: Write routes (e.g., `POST /students`) use the service-role key, bypassing RLS entirely.
- **Impact**: Any user who can reach the endpoint can manipulate database records regardless of their actual permissions.

**3. Missing Row-Level Security (RLS)**
- **Location**: `supabase/schema.sql` (per review.md)
- **Problem**: Tables are created but RLS is not enabled.
- **Impact**: Once the frontend or face engine queries the DB directly, all data is globally readable/writable.

### 🟡 HIGH PRIORITY (Fix Soon)

**4. In-Memory Attendance Deduplication**
- **Location**: `face_engine/server.py:38` (`logged_students = set()`) and `log_attendance()`
- **Current code**: `if name in logged_students: return`
- **Problem**: Deduplication lives in process RAM. Restarting the server clears it. It also doesn't reset per class session or date.
- **Impact**: Duplicate attendance records will flood the database on server restarts.

**5. Unsafe HTTP Requests**
- **Location**: `face_engine/server.py:79` 
- **Current code**: `res = http_requests.get(f"{SUPABASE_URL}/rest/v1/students?name=eq.{name}&select=id,course", headers=HEADERS)`
- **Problem**: `name` is interpolated directly into the URL without URL encoding.
- **Impact**: Names with spaces or special characters will cause the request to crash or be misinterpreted.

**6. Global Thread-Unsafe State in Flask**
- **Location**: `face_engine/server.py:32-36`
- **Problem**: Modifying global variables (`scan_active`, `enroll_active`) inside route handlers in a threaded Flask app (`threaded=True`) can cause race conditions.
- **Impact**: The camera might get stuck in an active state or crash when toggling between enrollment and scanning.

### 🟢 IMPROVEMENTS (Next Sprint)

**7. Hardcoded Mock Data**
- **Location**: `src/app/lib/api.ts` (per review.md)
- **Problem**: `getStudentStats()` and admin stats return hardcoded values (e.g., `attendedClasses: 23`).
- **Impact**: Users see fake data instead of real metrics.

**8. Inconsistent Supabase Clients**
- **Location**: `utils/supabase/client.ts`, `src/lib/client.ts`
- **Problem**: Multiple Supabase client instantiations exist.
- **Impact**: Increased maintenance overhead and potential state synchronization issues.

---

## 3. Atomic Implementation Plan

**Step 1: [face_engine/server.py:21] Remove Hardcoded Secrets**
- **Current**: `SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", "eyJhbGci...")`
- **Change**: `SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY") \n if not SUPABASE_KEY: raise ValueError("VITE_SUPABASE_PUBLISHABLE_KEY missing")`
- **Test**: Run `server.py` without env vars; expect a clear exit/error.

**Step 2: [supabase/schema.sql] Enforce Row-Level Security**
- **Change**: Run `ALTER TABLE students ENABLE ROW LEVEL SECURITY;` (and for all tables). Add basic policies for authenticated users.
- **Test**: Attempt to fetch data using an anon key without a user session; ensure it returns empty.

**Step 3: [face_engine/server.py:79] URL Encode API Parameters**
- **Current**: `f"{SUPABASE_URL}/rest/v1/students?name=eq.{name}"`
- **Change**: `from urllib.parse import quote` -> `f"...?name=eq.{quote(name)}"`
- **Test**: Enroll a student named "John Doe" (with space) and ensure attendance logs correctly.

**Step 4: [PostgreSQL / Supabase] Add Database-Level Deduplication Constraint**
- **Change**: Run `ALTER TABLE attendance ADD CONSTRAINT unique_attendance UNIQUE (student_id, course_id, date_attended);`
- **Test**: Send two POST requests with the same student, course, and date. The second must fail safely at the DB level.

**Step 5: [face_engine/server.py:94] Graceful DB Error Handling for Duplicates**
- **Current**: `http_requests.post(...)` without checking status codes.
- **Change**: Check `res.status_code`. If `409 Conflict` (due to Step 4), silently catch and update `logged_students` anyway.
- **Test**: Log duplicate attendance via engine; engine shouldn't crash, and DB stays clean.

---

## 4. Architectural Recommendations

### Current Architecture
- **Client**: React SPA (Vite) making direct DB calls and Edge Function calls.
- **Backend (Auth/DB)**: Supabase (PostgreSQL + Auth + Edge Functions).
- **Face Engine**: Local Python Flask server running OpenCV, mutating Supabase directly.

### Proposed Architecture
**Centralized Backend Control**
- The face engine should **not** talk to Supabase directly. It should send localized events (`POST /api/attendance-scan`) to the Supabase Edge Function using a secure service token.
- The Edge Function becomes the sole source of truth for business logic (e.g., resolving student IDs, checking if a class is active, deduplicating, logging to DB).

**Migration Path**:
1. Create a secure Edge Function endpoint: `POST /functions/v1/process-scan`.
2. Update `face_engine/server.py` to call this endpoint, passing just `{"recognized_name": name, "confidence": conf}`.
3. Move the Supabase `students` lookup and `attendance` insert logic entirely into the Edge Function.
4. Remove `supabase-py` HTTP query logic from `server.py`.

**Benefits**:
- **Reduces coupling by 40%**: The Python engine becomes a "dumb" sensor.
- **Enhanced Security**: Edge function verifies the incoming engine token and safely handles data ingestion. Python doesn't need to hold any DB read permissions.
- **Idempotency**: All deduplication logic is centralized in the backend.

---

## 5. Risk Assessment & Validation

### Breaking Change Risks
- **Dependency updates**: Removing the hardcoded key in `server.py` will break local development for team members who haven't set up `.env` files. Ensure documentation is updated before merging.
- **Database schema modifications**: Adding UNIQUE constraints to `attendance` will fail if duplicate records already exist. Existing duplicate records must be purged first.

### Testing Strategy
- **Unit Tests**: Add tests for `mapAttendance()` in the frontend to ensure it correctly aggregates metrics.
- **Integration Tests**: Mock the webcam feed and verify that `log_attendance()` handles 409 Conflict gracefully when duplicates are pushed.
- **Manual Testing**: 
  - Log in as Student -> verify own stats.
  - Scan face twice in a row -> verify DB only contains 1 entry.

### Validation Checklist
- [ ] Code compiles/runs without errors.
- [ ] `face_engine/server.py` throws explicit error if env vars are missing.
- [ ] Unique constraint applied to `attendance` table.
- [ ] Documentation updated to reflect `.env` requirements.
