
-- 1. Fix RLS on session_pack_pricing: drop admin-only insert/update/delete and replace with simpler authenticated CRUD matching sport_pricing
DROP POLICY IF EXISTS "Admins can insert session pack pricing" ON public.session_pack_pricing;
DROP POLICY IF EXISTS "Admins can update session pack pricing" ON public.session_pack_pricing;
DROP POLICY IF EXISTS "Admins can delete session pack pricing" ON public.session_pack_pricing;

CREATE POLICY "Auth users can insert session_pack_pricing"
  ON public.session_pack_pricing FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Auth users can update session_pack_pricing"
  ON public.session_pack_pricing FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete session_pack_pricing"
  ON public.session_pack_pricing FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_pack_pricing TO authenticated;
GRANT ALL ON public.session_pack_pricing TO service_role;

-- 2. Kid/Adult columns
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS allows_kids boolean DEFAULT true;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS allows_adults boolean DEFAULT true;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS kid_custom_monthly_price numeric;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS kid_custom_monthly_sessions integer;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS adult_custom_monthly_price numeric;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS adult_custom_monthly_sessions integer;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS renewal_days integer;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS kid_sessions_per_month integer;
ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS adult_sessions_per_month integer;

ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS kid_standard_1month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS kid_standard_3month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS kid_standard_6month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS kid_premium_1month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS kid_premium_3month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS kid_premium_6month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS adult_standard_1month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS adult_standard_3month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS adult_standard_6month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS adult_premium_1month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS adult_premium_3month numeric;
ALTER TABLE public.sport_pricing ADD COLUMN IF NOT EXISTS adult_premium_6month numeric;

ALTER TABLE public.session_pack_pricing ADD COLUMN IF NOT EXISTS kid_standard_price numeric;
ALTER TABLE public.session_pack_pricing ADD COLUMN IF NOT EXISTS kid_premium_price numeric;
ALTER TABLE public.session_pack_pricing ADD COLUMN IF NOT EXISTS adult_standard_price numeric;
ALTER TABLE public.session_pack_pricing ADD COLUMN IF NOT EXISTS adult_premium_price numeric;

-- 3. Backfill existing data into both kid/adult columns
UPDATE public.sports SET allows_kids = COALESCE(allows_kids, true), allows_adults = COALESCE(allows_adults, true);

UPDATE public.sports
SET kid_custom_monthly_price = COALESCE(kid_custom_monthly_price, custom_monthly_price),
    kid_custom_monthly_sessions = COALESCE(kid_custom_monthly_sessions, custom_monthly_sessions),
    adult_custom_monthly_price = COALESCE(adult_custom_monthly_price, custom_monthly_price),
    adult_custom_monthly_sessions = COALESCE(adult_custom_monthly_sessions, custom_monthly_sessions),
    kid_sessions_per_month = COALESCE(kid_sessions_per_month, sessions_per_month),
    adult_sessions_per_month = COALESCE(adult_sessions_per_month, sessions_per_month);

UPDATE public.sport_pricing SET
  kid_standard_1month = COALESCE(kid_standard_1month, standard_1month),
  kid_standard_3month = COALESCE(kid_standard_3month, standard_3months),
  kid_standard_6month = COALESCE(kid_standard_6month, standard_6months),
  kid_premium_1month = COALESCE(kid_premium_1month, premium_1month),
  kid_premium_3month = COALESCE(kid_premium_3month, premium_3months),
  kid_premium_6month = COALESCE(kid_premium_6month, premium_6months),
  adult_standard_1month = COALESCE(adult_standard_1month, standard_1month),
  adult_standard_3month = COALESCE(adult_standard_3month, standard_3months),
  adult_standard_6month = COALESCE(adult_standard_6month, standard_6months),
  adult_premium_1month = COALESCE(adult_premium_1month, premium_1month),
  adult_premium_3month = COALESCE(adult_premium_3month, premium_3months),
  adult_premium_6month = COALESCE(adult_premium_6month, premium_6months);

UPDATE public.session_pack_pricing SET
  kid_standard_price = COALESCE(kid_standard_price, standard_price),
  kid_premium_price = COALESCE(kid_premium_price, premium_price),
  adult_standard_price = COALESCE(adult_standard_price, standard_price),
  adult_premium_price = COALESCE(adult_premium_price, premium_price);
