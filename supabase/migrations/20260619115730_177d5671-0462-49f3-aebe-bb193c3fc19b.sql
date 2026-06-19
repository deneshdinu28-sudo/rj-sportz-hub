-- Fix broken function first
CREATE OR REPLACE FUNCTION public.update_days_overdue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.fee_status IN ('unpaid', 'overdue') AND NEW.next_due_date IS NOT NULL THEN
    NEW.days_overdue = GREATEST(0, (CURRENT_DATE - NEW.next_due_date)::INT);
  ELSE
    NEW.days_overdue = 0;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_fee_statuses()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.students
  SET fee_status = 'unpaid', days_overdue = 0
  WHERE fee_status = 'paid' AND payment_end_date < CURRENT_DATE;

  UPDATE public.students
  SET fee_status = 'overdue', days_overdue = (CURRENT_DATE - next_due_date)::INT
  WHERE fee_status = 'unpaid' AND next_due_date < (CURRENT_DATE - INTERVAL '5 days');
END;
$function$;

-- Sports columns
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'duration_based';
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS renewal_trigger text DEFAULT 'date_based';
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS custom_monthly_price numeric;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS custom_monthly_sessions integer;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS sessions_per_month integer;

DO $$ BEGIN
  ALTER TABLE public.sports ADD CONSTRAINT sports_pricing_type_check CHECK (pricing_type IN ('duration_based','custom_monthly','session_pack'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.sports ADD CONSTRAINT sports_renewal_trigger_check CHECK (renewal_trigger IN ('date_based','session_based'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.session_pack_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid REFERENCES public.sports(id) ON DELETE CASCADE,
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  pack_name text NOT NULL,
  session_count integer NOT NULL,
  standard_price numeric NOT NULL,
  premium_price numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_pack_pricing TO authenticated;
GRANT SELECT ON public.session_pack_pricing TO anon;
GRANT ALL ON public.session_pack_pricing TO service_role;

ALTER TABLE public.session_pack_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view session pack pricing" ON public.session_pack_pricing;
DROP POLICY IF EXISTS "Admins can insert session pack pricing" ON public.session_pack_pricing;
DROP POLICY IF EXISTS "Admins can update session pack pricing" ON public.session_pack_pricing;
DROP POLICY IF EXISTS "Admins can delete session pack pricing" ON public.session_pack_pricing;

CREATE POLICY "Anyone can view session pack pricing" ON public.session_pack_pricing FOR SELECT USING (true);
CREATE POLICY "Admins can insert session pack pricing" ON public.session_pack_pricing FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update session pack pricing" ON public.session_pack_pricing FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete session pack pricing" ON public.session_pack_pricing FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_session_pack_pricing_updated_at ON public.session_pack_pricing;
CREATE TRIGGER update_session_pack_pricing_updated_at BEFORE UPDATE ON public.session_pack_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Students columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pricing_type text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS renewal_trigger text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS total_sessions_paid integer DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sessions_remaining integer DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS current_pack_name text;

DO $$ BEGIN
  ALTER TABLE public.students ADD CONSTRAINT students_pricing_type_check CHECK (pricing_type IS NULL OR pricing_type IN ('duration_based','custom_monthly','session_pack'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.students ADD CONSTRAINT students_renewal_trigger_check CHECK (renewal_trigger IS NULL OR renewal_trigger IN ('date_based','session_based'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.sports SET pricing_type='duration_based' WHERE pricing_type IS NULL;
UPDATE public.sports SET renewal_trigger='date_based' WHERE renewal_trigger IS NULL;
UPDATE public.students SET pricing_type='duration_based' WHERE pricing_type IS NULL;
UPDATE public.students SET renewal_trigger='date_based' WHERE renewal_trigger IS NULL;