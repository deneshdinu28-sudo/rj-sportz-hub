ALTER TABLE public.students ADD COLUMN IF NOT EXISTS locked_price numeric;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS locked_price_sessions integer;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS price_version_id uuid;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS current_price_version_id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS price_last_changed_at timestamptz;
UPDATE public.sports SET current_price_version_id = gen_random_uuid() WHERE current_price_version_id IS NULL;