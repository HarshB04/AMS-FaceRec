# AMS-FaceRec

## What This Is

A secure, role-based attendance platform for schools and colleges where face recognition handles daily attendance capture, and a web app handles management, visibility, and reporting. It gives admins, teachers, and students role-specific dashboards to interact with real-time, trustworthy attendance data.

## Core Value

Make attendance faster, more reliable, and harder to falsify using face recognition.

## Requirements

### Validated

- ✓ Basic React frontend scaffolding
- ✓ Python OpenCV face recognition engine
- ✓ Supabase database schema (students, courses, attendance, instructors)

### Active

- [ ] Secure login and role-based routing (`admin`, `teacher`, `student`)
- [ ] Admin management portal (users, courses, enrollment, system security)
- [ ] Teacher tools (classes, live camera attendance, summaries, reports)
- [ ] Student tools (attendance history, schedule, profile, face enrollment state)
- [ ] Attendance reports with CSV/PDF export
- [ ] Automated absence emails to students
- [ ] Low attendance alerts to admins (e.g., < 75%)
- [ ] Weekly attendance digest for teachers
- [ ] Secure integration between Supabase and the face engine
- [ ] Admin-led in-person face enrollment process via local Python engine

### Out of Scope

- [ ] Remote/self-serve student face enrollment via webcam — **Why:** Prevents falsification; requires an admin to verify identity during enrollment.
- [ ] Automated offline queue sync — **Why:** Always-online connection to Supabase is required for the MVP to ensure immediate data accuracy.

## Context

- **Tech Stack:** React (Vite) frontend, Python (Flask, OpenCV, scikit-learn) face engine backend, Supabase (PostgreSQL) database.
- **Current State:** The product skeleton is strong. The main priority moving forward is making it production-trustworthy with secure authorization, real user-scoped data, accurate reporting, and clean integration.
- **Database Architecture:** Uses PostgreSQL Row Level Security (RLS) and constraints to ensure attendance idempotency.

## Constraints

- **Hardware:** Standard webcams on teacher laptops for live attendance.
- **Connectivity:** Always-online requirement; the face engine communicates directly with the cloud database.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Admin-led enrollment | Guarantees the right face is enrolled to the right student ID | — Pending |
| Database Idempotency | Use `UNIQUE` constraints in Postgres to handle duplicate scans from the face engine without crashing | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after initialization*
