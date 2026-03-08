
-- Add days_overdue column to students if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'days_overdue') THEN
    ALTER TABLE public.students ADD COLUMN days_overdue integer DEFAULT 0;
  END IF;
END $$;

-- Create payment_students junction table
CREATE TABLE IF NOT EXISTS public.payment_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  allocated_amount numeric(10,2) NOT NULL,
  plan_chosen varchar(10) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(payment_id, student_id)
);

ALTER TABLE public.payment_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view payment_students" ON public.payment_students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert payment_students" ON public.payment_students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update payment_students" ON public.payment_students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete payment_students" ON public.payment_students FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_payment_students_payment ON public.payment_students(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_students_student ON public.payment_students(student_id);

-- Add student_codes and student_names columns to payments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'student_codes') THEN
    ALTER TABLE public.payments ADD COLUMN student_codes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'student_names') THEN
    ALTER TABLE public.payments ADD COLUMN student_names text;
  END IF;
END $$;

-- Create days_overdue update trigger
CREATE OR REPLACE FUNCTION public.update_days_overdue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fee_status IN ('unpaid', 'overdue') AND NEW.next_due_date IS NOT NULL THEN
    NEW.days_overdue = GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - NEW.next_due_date))::INT);
  ELSE
    NEW.days_overdue = 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_update_days_overdue
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_days_overdue();

-- Create fee status update function
CREATE OR REPLACE FUNCTION public.update_fee_statuses()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.students
  SET fee_status = 'unpaid',
      days_overdue = 0
  WHERE fee_status = 'paid'
    AND payment_end_date < CURRENT_DATE;
  
  UPDATE public.students
  SET fee_status = 'overdue',
      days_overdue = EXTRACT(DAY FROM (CURRENT_DATE - next_due_date))::INT
  WHERE fee_status = 'unpaid'
    AND next_due_date < (CURRENT_DATE - INTERVAL '2 days');
END;
$$;
