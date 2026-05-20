-- ─────────────────────────────────────────────────────────────────────────────
-- AMS-FaceRec: Schema Migration — Registration & Face Enrollment Fields
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── students table: add new columns ──────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS semester   INT CHECK (semester BETWEEN 1 AND 8),
  ADD COLUMN IF NOT EXISTS section    TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT;

-- ── profiles table: add new columns ──────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name       TEXT,
  ADD COLUMN IF NOT EXISTS student_id      TEXT,
  ADD COLUMN IF NOT EXISTS department      TEXT,
  ADD COLUMN IF NOT EXISTS semester        INT,
  ADD COLUMN IF NOT EXISTS section         TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS face_enrolled   BOOLEAN DEFAULT FALSE;

-- ── Unique index on profiles.student_id (SBRN is globally unique) ─────────────
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL;

-- ── attendance table: ensure time column exists ───────────────────────────────
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS time_attended TIME;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run after migration):
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'students' ORDER BY column_name;
--
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'profiles' ORDER BY column_name;
-- ─────────────────────────────────────────────────────────────────────────────
