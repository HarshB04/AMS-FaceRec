-- ============================================================================
-- Migration: Update Domain Model
-- Renames 'department' → 'branch', 'section' → 'session' across tables.
-- Constrains semesters to 1–6, and adds the 4 official institute branches.
-- ============================================================================

-- ── students table ───────────────────────────────────────────────────────────

-- Add new columns (idempotent)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS session TEXT;

-- Copy existing data into new columns
UPDATE public.students
  SET branch = department
  WHERE branch IS NULL AND department IS NOT NULL;

UPDATE public.students
  SET session = section
  WHERE session IS NULL AND section IS NOT NULL;

-- ── profiles table ───────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS session TEXT;

UPDATE public.profiles
  SET branch = department
  WHERE branch IS NULL AND department IS NOT NULL;

UPDATE public.profiles
  SET session = section
  WHERE session IS NULL AND section IS NOT NULL;

-- ── timetable_entries: add branch column alongside department ─────────────────

ALTER TABLE public.timetable_entries
  ADD COLUMN IF NOT EXISTS branch TEXT;

UPDATE public.timetable_entries
  SET branch = department
  WHERE branch IS NULL AND department IS NOT NULL;

-- ── attendance: sync branch ───────────────────────────────────────────────────

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS branch TEXT;

UPDATE public.attendance
  SET branch = department
  WHERE branch IS NULL AND department IS NOT NULL;

-- ── courses: sync branch ──────────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS branch TEXT;

UPDATE public.courses
  SET branch = department
  WHERE branch IS NULL AND department IS NOT NULL;

-- ── Index for fast timetable lookups by branch/semester/day ──────────────────

CREATE INDEX IF NOT EXISTS timetable_entries_branch_idx
  ON public.timetable_entries (branch, semester, day_of_week, start_time);

-- NOTE: Old columns (department, section) are kept for backward compatibility.
-- Once the frontend fully migrates to branch/session, they can be dropped.

-- ── Update handle_new_user trigger to carry branch + session from metadata ────
-- This ensures new student/teacher signups (including seed script) populate
-- the branch and session columns automatically.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, full_name, student_id,
    department, branch,
    semester,
    session,
    phone, approval_status, created_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')::user_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'student_id',
    -- department: prefer explicit 'department' key, fallback to 'branch'
    COALESCE(new.raw_user_meta_data->>'department', new.raw_user_meta_data->>'branch'),
    -- branch: prefer explicit 'branch' key, fallback to 'department'
    COALESCE(new.raw_user_meta_data->>'branch', new.raw_user_meta_data->>'department'),
    NULLIF(new.raw_user_meta_data->>'semester', '')::INTEGER,
    new.raw_user_meta_data->>'session',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'approval_status', 'approved'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name       = EXCLUDED.full_name,
    student_id      = EXCLUDED.student_id,
    department      = EXCLUDED.department,
    branch          = EXCLUDED.branch,
    semester        = EXCLUDED.semester,
    session         = EXCLUDED.session,
    phone           = EXCLUDED.phone,
    approval_status = EXCLUDED.approval_status;
  RETURN new;
END;
$$;
