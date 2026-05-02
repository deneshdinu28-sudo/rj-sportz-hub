CREATE TABLE public.plan_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  student_code text,
  previous_plan text,
  new_plan text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  effective_from date,
  note text
);

ALTER TABLE public.plan_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view plan_change_logs"
  ON public.plan_change_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth users can insert plan_change_logs"
  ON public.plan_change_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_plan_logs_student ON public.plan_change_logs(student_id);
CREATE INDEX idx_coaches_sport_active ON public.coaches(sport_name, is_active) WHERE is_active = true;