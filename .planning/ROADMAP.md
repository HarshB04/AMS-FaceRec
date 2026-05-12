# Roadmap: AMS-FaceRec

## Overview

This roadmap defines the path to upgrading the AMS-FaceRec MVP into a production-trustworthy attendance platform. It covers securing the app with role-based auth, building out the admin, teacher, and student portals, integrating the Python face engine for in-person enrollment, and finishing with automated reporting and notifications.

## Phases

- [ ] **Phase 1: Security & Authentication** - Lock down the app with Supabase Auth and RLS.
- [ ] **Phase 2: Admin Portal Core** - Build CRUD interfaces for users, courses, and instructors.
- [ ] **Phase 3: Face Enrollment Workflow** - Admin-led in-person face enrollment via Python engine.
- [ ] **Phase 4: Teacher Live Dashboard** - Real-time attendance view for live classes.
- [x] **Phase 5: Student & Teacher Histories** - Read-only attendance schedules and profiles. ✅
- [ ] **Phase 6: Reporting & Exporting** - CSV and PDF attendance exports.
- [ ] **Phase 7: Weekly Digests** - Scheduled attendance summaries for teachers.
- [ ] **Phase 8: Automated Absence Alerts** - Real-time email alerts for missing students.

## Phase Details

### Phase 1: Security & Authentication
**Goal**: Implement secure login, role-based routing, and database-level security.
**Depends on**: Nothing
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Users can log in using Supabase Auth.
  2. Users are automatically routed to their role-specific dashboard.
  3. RLS prevents unauthorized data access at the database level.
  4. JWT roles cannot be spoofed.
**Plans**: TBD

Plans:
- [ ] 01-01: Configure Supabase Auth and Login Page
- [ ] 01-02: Setup Role-Based Routing (AuthGuard)
- [ ] 01-03: Implement strict RLS policies on all tables

### Phase 2: Admin Portal Core
**Goal**: Build the CRUD interfaces for managing the school's data.
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. Admin can manage Students, Courses, and Instructors.
  2. Admin can assign students to specific courses.
**Plans**: TBD

Plans:
- [ ] 02-01: Student and Instructor Management Pages
- [ ] 02-02: Course Management and Enrollment UI

### Phase 3: Face Enrollment Workflow
**Goal**: Enable secure, in-person face enrollment using the local Python engine.
**Depends on**: Phase 2
**Requirements**: ADMIN-05
**Success Criteria** (what must be TRUE):
  1. Admin has a dedicated UI for launching face enrollment.
  2. Python engine captures and stores student faces securely.
**Plans**: TBD

Plans:
- [ ] 03-01: Admin Face Enrollment UI
- [ ] 03-02: Python OpenCV Face Enrollment integration

### Phase 4: Teacher Live Dashboard
**Goal**: Real-time attendance tracking for live classes.
**Depends on**: Phase 1
**Requirements**: TCHR-01, TCHR-02, TCHR-03
**Success Criteria** (what must be TRUE):
  1. Teacher sees their assigned courses.
  2. Teacher sees real-time attendance updates during a live class.
**Plans**: TBD

Plans:
- [ ] 04-01: Teacher Course List View
- [ ] 04-02: Live Attendance Polling/Realtime Dashboard

### Phase 5: Student & Teacher Histories
**Goal**: Read-only historical views for users.
**Depends on**: Phase 1
**Requirements**: STU-01, STU-02, STU-03, STU-04
**Success Criteria** (what must be TRUE):
  1. Student can view their attendance history, schedule, and face enrollment status.
  2. Student can view their weekly attendance analysis.
**Plans**: TBD

Plans:
- [x] 05-01: Student Profile and History Views
- [x] 05-02: Student Weekly Analysis Components

### Phase 6: Reporting & Exporting
**Goal**: Allow teachers to export attendance data.
**Depends on**: Phase 4
**Requirements**: TCHR-04, TCHR-05
**Success Criteria** (what must be TRUE):
  1. Teacher can export attendance reports as CSV.
  2. Teacher can export attendance reports as PDF.
**Plans**: TBD

Plans:
- [x] 06-01: CSV Export logic via papaparse (built-in blob utilized)
- [x] 06-02: PDF Export logic via jspdf

### Phase 7: Weekly Digests
**Goal**: Automated weekly attendance summaries for teachers.
**Depends on**: Phase 6
**Requirements**: NOTF-03
**Success Criteria** (what must be TRUE):
  1. Teachers receive a weekly email summarizing class attendance.
**Plans**: TBD

Plans:
- [ ] 07-01: Supabase Edge Function for weekly cron digest

### Phase 8: Automated Absence Alerts
**Goal**: Immediate email notifications for attendance issues.
**Depends on**: Phase 1
**Requirements**: NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. Students receive an email instantly when marked absent.
  2. Admins are alerted when student attendance drops below 75%.
**Plans**: TBD

Plans:
- [ ] 08-01: Postgres Webhook for real-time absent trigger
- [ ] 08-02: Edge Function for low-attendance admin alerts

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security & Auth | 0/3 | Not started | - |
| 2. Admin Portal | 0/2 | Not started | - |
| 3. Face Enrollment | 0/2 | Not started | - |
| 4. Teacher Live Dashboard | 0/2 | Not started | - |
| 5. Student Histories | 2/2 | ✅ Complete | 2026-05-12 |
| 6. Reporting & Exporting | 2/2 | ✅ Complete | 2026-05-13 |
| 7. Weekly Digests | 0/1 | Not started | - |
| 8. Absence Alerts | 0/2 | Not started | - |
