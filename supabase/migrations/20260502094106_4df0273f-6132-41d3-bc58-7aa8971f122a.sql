-- Add student_type column with check constraint and default
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_type text
  CHECK (student_type IN ('kid', 'adult'))
  DEFAULT 'kid';

-- Backfill from existing age_group
UPDATE public.students
SET student_type = CASE WHEN age_group = 'adults' THEN 'adult' ELSE 'kid' END
WHERE student_type IS NULL;

-- Remove old welcome templates so the new pair seeds cleanly from the app
DELETE FROM public.whatsapp_templates
WHERE template_id IN (
  'welcome_student',
  'welcome_parent_young_child',
  'welcome_parent_child',
  'welcome_parent_teen',
  'welcome_parent_adult',
  'welcome_student_teen',
  'welcome_student_adult'
);