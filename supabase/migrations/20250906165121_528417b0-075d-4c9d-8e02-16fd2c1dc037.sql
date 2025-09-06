-- Create contract_categories table for dynamic category management
CREATE TABLE public.contract_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.contract_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view contract categories" 
ON public.contract_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage contract categories" 
ON public.contract_categories 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_contract_categories_updated_at
BEFORE UPDATE ON public.contract_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories to maintain existing functionality
INSERT INTO public.contract_categories (key, name_de, name_en, description, sort_order) VALUES
('general', 'Allgemein', 'General', 'Allgemeine Vertragsbausteine', 1),
('legal', 'Legal', 'Legal', 'Rechtliche Bestimmungen und Klauseln', 2),
('privacy', 'Datenschutz', 'Privacy', 'Datenschutzbezogene Bestimmungen', 3),
('termination', 'Kündigung', 'Termination', 'Kündigungs- und Beendigungsklauseln', 4),
('compensation', 'Vergütung', 'Compensation', 'Vergütungs- und Gehaltsbestimmungen', 5);

-- Add foreign key constraint to contract_modules table
-- First, ensure all existing modules have valid categories
UPDATE public.contract_modules 
SET category = 'general' 
WHERE category IS NULL OR category NOT IN ('general', 'legal', 'privacy', 'termination', 'compensation');

-- Add the foreign key constraint
ALTER TABLE public.contract_modules 
ADD CONSTRAINT fk_contract_modules_category 
FOREIGN KEY (category) REFERENCES public.contract_categories(key) 
ON UPDATE CASCADE ON DELETE SET DEFAULT;