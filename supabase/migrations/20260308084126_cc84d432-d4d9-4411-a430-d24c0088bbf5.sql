
-- Create coaches table
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  coach_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  sport_name TEXT NOT NULL,
  sport_shortcode TEXT NOT NULL DEFAULT 'SPT',
  coach_number INT NOT NULL DEFAULT 1,
  assigned_communities UUID[] DEFAULT '{}',
  assigned_sports UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coaches_sport ON public.coaches(sport_name);
CREATE INDEX idx_coaches_coach_id ON public.coaches(coach_id);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view coaches" ON public.coaches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert coaches" ON public.coaches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update coaches" ON public.coaches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete coaches" ON public.coaches FOR DELETE TO authenticated USING (true);

-- Create coach assignments table
CREATE TABLE public.coach_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  sport_id UUID REFERENCES public.sports(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  UNIQUE(coach_id, community_id, sport_id)
);

ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view coach_assignments" ON public.coach_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert coach_assignments" ON public.coach_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update coach_assignments" ON public.coach_assignments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete coach_assignments" ON public.coach_assignments FOR DELETE TO authenticated USING (true);

-- Create sport shortcodes table
CREATE TABLE public.sport_shortcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_name TEXT UNIQUE NOT NULL,
  shortcode TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sport_shortcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view sport_shortcodes" ON public.sport_shortcodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sport_shortcodes" ON public.sport_shortcodes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update sport_shortcodes" ON public.sport_shortcodes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete sport_shortcodes" ON public.sport_shortcodes FOR DELETE TO authenticated USING (true);

-- Insert default shortcodes
INSERT INTO public.sport_shortcodes (sport_name, shortcode) VALUES
('Badminton', 'BDM'),
('Yoga', 'YGA'),
('Karate', 'KRT'),
('Swimming', 'SWM'),
('Table Tennis', 'TBL'),
('Basketball', 'BSK'),
('Skating', 'SKT'),
('Football', 'FTB'),
('Tennis', 'TEN'),
('Volleyball', 'VBL'),
('Cricket', 'CKT'),
('Dance', 'DNC');

-- Update fee status function to use 5-day threshold
CREATE OR REPLACE FUNCTION public.update_fee_statuses()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark as unpaid if payment ended
  UPDATE public.students
  SET fee_status = 'unpaid',
      days_overdue = 0
  WHERE fee_status = 'paid'
    AND payment_end_date < CURRENT_DATE;
  
  -- Mark as overdue if more than 5 days late
  UPDATE public.students
  SET fee_status = 'overdue',
      days_overdue = EXTRACT(DAY FROM (CURRENT_DATE - next_due_date))::INT
  WHERE fee_status = 'unpaid'
    AND next_due_date < (CURRENT_DATE - INTERVAL '5 days');
END;
$$;

-- Create trigger for days_overdue if not exists
DROP TRIGGER IF EXISTS trigger_update_days_overdue ON public.students;
CREATE TRIGGER trigger_update_days_overdue
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_days_overdue();
