
-- Add columns to existing tables
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS total_students integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sports integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.sports
  ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_students integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_collected numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS time_slot_id uuid,
  ADD COLUMN IF NOT EXISTS is_on_hold boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hold_reason text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS receipt_number varchar(20),
  ADD COLUMN IF NOT EXISTS student_code varchar(20),
  ADD COLUMN IF NOT EXISTS screenshot_url text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Create global_sports table
CREATE TABLE IF NOT EXISTS public.global_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text DEFAULT '🏸',
  is_default boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create sport_pricing table
CREATE TABLE IF NOT EXISTS public.sport_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  sport_id uuid REFERENCES public.sports(id) ON DELETE CASCADE NOT NULL,
  standard_1month numeric(10,2) NOT NULL DEFAULT 3500,
  standard_3months numeric(10,2) NOT NULL DEFAULT 10000,
  standard_6months numeric(10,2) NOT NULL DEFAULT 19000,
  premium_1month numeric(10,2) NOT NULL DEFAULT 5000,
  premium_3months numeric(10,2) NOT NULL DEFAULT 14000,
  premium_6months numeric(10,2) NOT NULL DEFAULT 27000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(community_id, sport_id)
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS public.time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  sport_id uuid REFERENCES public.sports(id) ON DELETE CASCADE NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  age_group text NOT NULL DEFAULT 'kids',
  batch_type text NOT NULL DEFAULT 'standard',
  max_students integer DEFAULT 30,
  current_students integer DEFAULT 0,
  active_days text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(community_id, sport_id, start_time, age_group, batch_type)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE SET NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  marked_by uuid,
  marked_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Add FK for students.time_slot_id
ALTER TABLE public.students
  ADD CONSTRAINT students_time_slot_id_fkey
  FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.global_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for global_sports
CREATE POLICY "Auth users can view global_sports" ON public.global_sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert global_sports" ON public.global_sports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update global_sports" ON public.global_sports FOR UPDATE TO authenticated USING (true);

-- RLS policies for sport_pricing
CREATE POLICY "Auth users can view sport_pricing" ON public.sport_pricing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sport_pricing" ON public.sport_pricing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update sport_pricing" ON public.sport_pricing FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete sport_pricing" ON public.sport_pricing FOR DELETE TO authenticated USING (true);

-- RLS policies for time_slots
CREATE POLICY "Auth users can view time_slots" ON public.time_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert time_slots" ON public.time_slots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update time_slots" ON public.time_slots FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete time_slots" ON public.time_slots FOR DELETE TO authenticated USING (true);

-- RLS policies for attendance
CREATE POLICY "Auth users can view attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_sport_pricing_updated_at
  BEFORE UPDATE ON public.sport_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sport_pricing_community ON public.sport_pricing(community_id);
CREATE INDEX IF NOT EXISTS idx_sport_pricing_sport ON public.sport_pricing(sport_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_community ON public.time_slots(community_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_sport ON public.time_slots(sport_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Seed default global sports
INSERT INTO public.global_sports (name, icon, is_default) VALUES
('Badminton', '🏸', true),
('Yoga', '🧘', true),
('Karate', '🥋', true),
('Swimming', '🏊', true),
('Table Tennis', '🏓', true),
('Basketball', '🏀', true),
('Skating', '⛸️', true),
('Football', '⚽', true),
('Tennis', '🎾', true),
('Volleyball', '🏐', true),
('Cricket', '🏏', true),
('Dance', '💃', true)
ON CONFLICT (name) DO NOTHING;
