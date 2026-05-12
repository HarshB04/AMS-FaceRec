---
created: 2026-05-12T18:41:23.858Z
title: Auto-create auth profile with SBRN and password on student registration
area: auth
files:
  - src/app/pages/StudentManagement.tsx
  - src/app/pages/LoginPage.tsx
  - src/app/lib/api.ts
  - supabase/functions/server/index.ts
---

## Problem

The new student registration form in the admin dashboard needs to automatically provision a Supabase auth profile. The user requested that the admin form collects a login password alongside the SBRN (Student ID), and automatically creates the secure profile so the student can log in using their SBRN and password.

*(Note: This was implemented prior to this todo capture, but captured here per explicit workflow request).*

## Solution

1. Add password input field to the StudentManagement form.
2. Ensure the `createStudent` API accepts the password.
3. Update the Edge Function (`POST /students`) to intercept the password and call `supabase.auth.admin.createUser()`.
4. Rely on the existing Postgres trigger `handle_new_user()` to automatically populate `public.profiles`.
5. Implement a `/lookup-sbrn` edge function to allow `LoginPage.tsx` to map the SBRN input to the secure auth email during the sign-in flow.
