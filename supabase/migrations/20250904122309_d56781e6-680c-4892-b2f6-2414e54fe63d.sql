-- Add variables column to contract_modules for storing module-specific variables
ALTER TABLE public.contract_modules ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;

-- Create table for contract template compositions (which modules belong to which contract type)
CREATE TABLE public.contract_compositions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_type_key TEXT NOT NULL,
  module_key TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_type_key, module_key)
);

-- Enable RLS
ALTER TABLE public.contract_compositions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view contract compositions" 
ON public.contract_compositions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage contract compositions" 
ON public.contract_compositions FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_contract_compositions_updated_at
BEFORE UPDATE ON public.contract_compositions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for storing complete template configurations
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contract_type_key TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view contract templates" 
ON public.contract_templates FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage contract templates" 
ON public.contract_templates FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();