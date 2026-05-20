-- Migration: Add extended fields to public.profiles
-- Run this in the Supabase SQL Editor.
-- It is idempotent — safe to run multiple times.

-- Add new columns (IF NOT EXISTS guards prevent errors on re-run)
DO $$
BEGIN
  -- full_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  -- student_id (the SBRN / student number — different from uuid id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN student_id TEXT UNIQUE;
  END IF;

  -- department
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN department TEXT;
  END IF;

  -- semester (1–8)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'semester'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN semester INTEGER CHECK (semester BETWEEN 1 AND 8);
  END IF;

  -- profile_image (URL or path)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_image TEXT;
  END IF;
END
$$;

-- Update handle_new_user trigger to also populate full_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, student_id, department, semester, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')::user_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'department',
    NULLIF(new.raw_user_meta_data->>'semester', '')::INTEGER,
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name    = EXCLUDED.full_name,
    student_id   = EXCLUDED.student_id,
    department   = EXCLUDED.department,
    semester     = EXCLUDED.semester,
    phone        = EXCLUDED.phone;
  RETURN new;
END;
$$;

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
