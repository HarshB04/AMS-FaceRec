-- Migration: Add approval_status to public.profiles
-- Purpose: Gate login for self-registered users until an admin approves them.
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (idempotent).

-- ── 1. Add approval_status column ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved'
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));

    COMMENT ON COLUMN public.profiles.approval_status IS
      'pending = awaiting admin review, approved = can log in, rejected = access denied. '
      'Admin-created accounts start as approved. Self-registered students start as pending.';
  END IF;
END $$;

-- ── 2. Add created_at column (needed for sorting registrations) ───────────────
-- auth.users has created_at, but public.profiles does not — add it here.
-- Existing rows get NOW() as default; new rows get the insert timestamp.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON COLUMN public.profiles.created_at IS
      'Row creation timestamp. Backfilled to NOW() for pre-existing profiles.';
  END IF;
END $$;

-- ── 3. Update handle_new_user trigger to carry approval_status from metadata ──
-- When admins create users via the backend (supabaseAdmin.auth.admin.createUser),
-- they pass user_metadata: { approval_status: "approved" } so those accounts work immediately.
-- Self-registered users pass user_metadata: { approval_status: "pending" }.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, full_name, student_id, department, semester, phone, approval_status, created_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')::user_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'department',
    NULLIF(new.raw_user_meta_data->>'semester', '')::INTEGER,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'approval_status', 'approved'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name       = EXCLUDED.full_name,
    student_id      = EXCLUDED.student_id,
    department      = EXCLUDED.department,
    semester        = EXCLUDED.semester,
    phone           = EXCLUDED.phone,
    approval_status = EXCLUDED.approval_status;
  RETURN new;
END;
$$;

-- ── 4. RLS: no changes needed ─────────────────────────────────────────────────
-- The existing "Admin All profiles" policy already covers ALL operations for admins.
-- Users can already read their own profile via "Student Select own profile".

-- ── 5. Verify ────────────────────────────────────────────────────────────────
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
