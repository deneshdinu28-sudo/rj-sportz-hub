
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS sessions_1month integer;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS sessions_3month integer;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS sessions_6month integer;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS historical_sessions_before_migration integer NOT NULL DEFAULT 0;
