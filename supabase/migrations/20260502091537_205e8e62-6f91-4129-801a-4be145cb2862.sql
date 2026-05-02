-- Students: plan-change scheduling
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS plan_change_effective_from date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS plan_change_requested_at timestamptz;

-- Students: direct contact for teens/adults
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_whatsapp text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_phone text;

-- Cron logs
CREATE TABLE IF NOT EXISTS public.cron_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  ran_at timestamptz NOT NULL DEFAULT now(),
  status text,
  students_affected int DEFAULT 0,
  messages_sent int DEFAULT 0,
  error_message text,
  duration_ms int
);
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view cron_logs" ON public.cron_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert cron_logs" ON public.cron_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- System settings (single-row config)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wati_token text,
  wati_server_url text,
  wati_webhook_url text,
  google_vision_key text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view system_settings" ON public.system_settings
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert system_settings" ON public.system_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update system_settings" ON public.system_settings
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Seed a single settings row if none exists
INSERT INTO public.system_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);