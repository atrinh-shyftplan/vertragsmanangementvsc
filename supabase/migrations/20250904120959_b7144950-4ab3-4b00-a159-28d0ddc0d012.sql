-- Create tables for admin panel functionality

-- Contract types table
CREATE TABLE public.contract_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Contract modules/components table
CREATE TABLE public.contract_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title_de TEXT NOT NULL,
  title_en TEXT,
  content_de TEXT NOT NULL,
  content_en TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Global variables table
CREATE TABLE public.global_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Template configurations table
CREATE TABLE public.template_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  configuration JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (only authenticated users can manage)
CREATE POLICY "Authenticated users can view contract types" 
ON public.contract_types FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage contract types" 
ON public.contract_types FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view contract modules" 
ON public.contract_modules FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage contract modules" 
ON public.contract_modules FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view global variables" 
ON public.global_variables FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage global variables" 
ON public.global_variables FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view template configurations" 
ON public.template_configurations FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage template configurations" 
ON public.template_configurations FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at fields
CREATE TRIGGER update_contract_types_updated_at
BEFORE UPDATE ON public.contract_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_modules_updated_at
BEFORE UPDATE ON public.contract_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_variables_updated_at
BEFORE UPDATE ON public.global_variables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_configurations_updated_at
BEFORE UPDATE ON public.template_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data from template.json
INSERT INTO public.contract_types (key, name_de, name_en) VALUES
('employment', 'Arbeitsvertrag', 'Employment Contract'),
('freelance', 'Freelancer-Vertrag', 'Freelance Contract'),
('service', 'Dienstleistungsvertrag', 'Service Contract'),
('nda', 'Vertraulichkeitsvereinbarung', 'Non-Disclosure Agreement');

-- Insert sample global variables
INSERT INTO public.global_variables (key, name_de, name_en, description, is_required) VALUES
('company_name', 'Firmenname', 'Company Name', 'Name des Unternehmens', true),
('company_address', 'Firmenadresse', 'Company Address', 'Vollständige Adresse des Unternehmens', true),
('company_phone', 'Firmentelefon', 'Company Phone', 'Telefonnummer des Unternehmens', false),
('company_email', 'Firmen-E-Mail', 'Company Email', 'E-Mail-Adresse des Unternehmens', true),
('ceo_name', 'Geschäftsführer', 'CEO Name', 'Name des Geschäftsführers', false),
('legal_form', 'Rechtsform', 'Legal Form', 'Rechtsform des Unternehmens (GmbH, AG, etc.)', true);