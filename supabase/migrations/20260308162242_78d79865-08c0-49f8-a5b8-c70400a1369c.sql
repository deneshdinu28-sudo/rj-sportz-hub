
-- Add signup_completed column to coaches table for tracking coach registration status
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS signup_completed boolean DEFAULT false;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS signup_email text;
