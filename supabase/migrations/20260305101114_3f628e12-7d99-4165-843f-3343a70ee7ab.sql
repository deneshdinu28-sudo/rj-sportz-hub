
-- batch_promotions table
CREATE TABLE IF NOT EXISTS public.batch_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  student_code TEXT NOT NULL,
  from_batch TEXT NOT NULL,
  to_batch TEXT NOT NULL,
  old_fee NUMERIC(10,2) NOT NULL,
  new_fee NUMERIC(10,2) NOT NULL,
  promoted_by UUID,
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  whatsapp_sent BOOLEAN DEFAULT false,
  reason TEXT
);

ALTER TABLE public.batch_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view batch_promotions" ON public.batch_promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert batch_promotions" ON public.batch_promotions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update batch_promotions" ON public.batch_promotions FOR UPDATE TO authenticated USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_batch_promotions_student ON public.batch_promotions(student_id);

-- Add missing indexes on existing tables for performance
CREATE INDEX IF NOT EXISTS idx_students_fee_status ON public.students(fee_status, next_due_date);
CREATE INDEX IF NOT EXISTS idx_students_community ON public.students(community_id);
CREATE INDEX IF NOT EXISTS idx_students_sport ON public.students(sport_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_sports_community ON public.sports(community_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_community ON public.time_slots(community_id, sport_id);
CREATE INDEX IF NOT EXISTS idx_sport_pricing_community ON public.sport_pricing(community_id, sport_id);
