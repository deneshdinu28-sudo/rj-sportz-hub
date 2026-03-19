
-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view whatsapp_templates" ON public.whatsapp_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert whatsapp_templates" ON public.whatsapp_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update whatsapp_templates" ON public.whatsapp_templates FOR UPDATE TO authenticated USING (true);

-- Create payment_settings table
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id VARCHAR(100),
  upi_number VARCHAR(15),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view payment_settings" ON public.payment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert payment_settings" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update payment_settings" ON public.payment_settings FOR UPDATE TO authenticated USING (true);

-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-qr-codes', 'payment-qr-codes', true);

CREATE POLICY "Public can view QR codes" ON storage.objects FOR SELECT USING (bucket_id = 'payment-qr-codes');
CREATE POLICY "Auth users can upload QR codes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-qr-codes');
CREATE POLICY "Auth users can update QR codes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'payment-qr-codes');
