# Features Research: Attendance Management System additions

## 1. Table Stakes (Must Have)
- **Role-Based Authorization:** Supabase Auth mapping users to `admin`, `teacher`, or `student` roles. The UI must structurally forbid access to unauthorized routes.
- **Admin Dashboard:** A central portal to manage the `<users>`, `<courses>`, and `<instructors>` database tables.
- **In-person Face Enrollment:** A specialized dashboard page for the Admin, integrated with the local Python script, to guarantee identity validation during face capturing.
- **Daily Attendance View:** Teachers must be able to see who is present/absent on a given day.
- **Idempotency Logic:** The system must gracefully handle when a student's face is scanned 5 times in 1 minute. (Database UNIQUE constraints currently handle this).

## 2. Differentiators (Competitive Advantage)
- **Automated Absence Warnings:** Instantly emailing a student when they are marked absent increases accountability compared to batch end-of-semester reporting.
- **Weekly Teacher Digest:** An automated summary (cron job) sent to the teacher highlighting "at-risk" students (attendance < 75%).
- **Live-Scan Dashboard:** A React view that polls the Supabase `attendance` table in real-time using Supabase Realtime subscriptions, showing students popping up on screen as they walk past the camera.

## 3. Anti-Features (Do Not Build)
- **Remote / Self-Service Face Enrollment:** This is an academic setting. If students can enroll via their own webcams, they can enroll a picture of their friend or a celebrity, destroying the integrity of the system.
- **Manual Password Management by Admins:** Rely strictly on Supabase Auth's built-in "Forgot Password" magic links. Building custom password-reset forms is an anti-pattern.
