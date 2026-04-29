# Pitfalls Research: Attendance Management System additions

## 1. Supabase Realtime Exhaustion
- **Warning Sign:** The React dashboard hits connection limits or gets rate-limited by Supabase when teachers leave the "Live Attendance" screen open all day.
- **Prevention:** Ensure the Supabase Realtime subscription is strictly scoped to `channel.unsubscribe()` in the React `useEffect` cleanup function. Do not over-subscribe to every table, only the specific `course_id` the teacher is viewing.
- **Phase Mapping:** Phase handling the Teacher Live Dashboard.

## 2. Asynchronous State Race Conditions (Python)
- **Warning Sign:** The camera freezes or drops frames while the Python script waits for the HTTP request to Supabase to complete.
- **Prevention:** The Python `log_attendance` function MUST run on a background thread (e.g., using `threading.Thread(target=log_attendance)`) or via an asynchronous queue, ensuring the `cv2.imshow` frame loop is never blocked by network latency.
- **Phase Mapping:** Face Engine Refactor / Integration Phase.

## 3. JWT Role Spoofing
- **Warning Sign:** Students change their own `user_metadata` in localStorage to `role: admin` and successfully access admin data.
- **Prevention:** Do not rely solely on the frontend UI to hide elements. Row Level Security (RLS) in Postgres must be configured to check the JWT claims via `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`. The frontend is just UX; the database is the security.
- **Phase Mapping:** Security / RLS Phase.

## 4. Email Spam Loop
- **Warning Sign:** A student walks past the camera 10 times, the face engine records them 10 times, and the system sends 10 "Attendance Marked" emails.
- **Prevention:** The `UNIQUE (student_id, course_id, date_attended)` constraint handles the database side, but the Edge Function trigger must ONLY fire on `INSERT`. Because duplicates will be rejected (or `ON CONFLICT DO NOTHING`), the trigger won't fire multiple times.
- **Phase Mapping:** Automated Alerts / Email Phase.
