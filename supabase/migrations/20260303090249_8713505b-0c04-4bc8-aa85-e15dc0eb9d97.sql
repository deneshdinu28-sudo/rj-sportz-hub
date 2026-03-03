
-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  pricing JSONB NOT NULL DEFAULT '{"standard":{"1m":3500,"3m":10000,"6m":19000},"premium":{"1m":5000,"3m":14000,"6m":27000}}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sports table
CREATE TABLE public.sports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏸',
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  coach_name TEXT NOT NULL DEFAULT '',
  coach_phone TEXT NOT NULL DEFAULT '',
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  active_days TEXT[] NOT NULL DEFAULT '{}',
  standard_fee NUMERIC NOT NULL DEFAULT 3500,
  premium_fee NUMERIC NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL DEFAULT 10,
  parent_name TEXT NOT NULL DEFAULT '',
  parent_whatsapp TEXT NOT NULL DEFAULT '',
  parent_phone TEXT NOT NULL DEFAULT '',
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  batch_time TEXT NOT NULL DEFAULT '',
  age_group TEXT NOT NULL DEFAULT 'kids' CHECK (age_group IN ('kids', 'adults')),
  batch_type TEXT NOT NULL DEFAULT 'standard' CHECK (batch_type IN ('standard', 'premium')),
  payment_plan TEXT NOT NULL DEFAULT '1m' CHECK (payment_plan IN ('1m', '3m', '6m')),
  fee_amount NUMERIC NOT NULL DEFAULT 3500,
  fee_status TEXT NOT NULL DEFAULT 'pending' CHECK (fee_status IN ('paid', 'pending', 'overdue')),
  payment_start_date DATE,
  payment_end_date DATE,
  next_due_date DATE,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  transaction_id TEXT,
  plan_period TEXT NOT NULL DEFAULT '1m',
  period_start DATE,
  period_end DATE,
  verification_method TEXT NOT NULL DEFAULT 'manual' CHECK (verification_method IN ('auto', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can do everything (admin app)
CREATE POLICY "Authenticated users can view communities" ON public.communities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update communities" ON public.communities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete communities" ON public.communities FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sports" ON public.sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sports" ON public.sports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sports" ON public.sports FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sports" ON public.sports FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_sports_community ON public.sports(community_id);
CREATE INDEX idx_students_community ON public.students(community_id);
CREATE INDEX idx_students_sport ON public.students(sport_id);
CREATE INDEX idx_students_fee_status ON public.students(fee_status);
CREATE INDEX idx_students_student_id ON public.students(student_id);
CREATE INDEX idx_payments_student ON public.payments(student_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON public.sports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
