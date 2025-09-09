-- Create contracts table for storing actual contract data
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'pending', 'expired', 'draft')),
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  assigned_to TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  contract_type_key TEXT,
  template_variables JSONB DEFAULT '{}',
  global_variables JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for contract access
CREATE POLICY "Authenticated users can view contracts" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update their contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can delete their contracts" 
ON public.contracts 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data to maintain existing functionality
INSERT INTO public.contracts (
  title, client, status, value, start_date, end_date, assigned_to, description, tags, progress
) VALUES 
(
  'Software-Lizenzvertrag Microsoft', 
  'TechCorp GmbH', 
  'active', 
  150000.00, 
  '2024-01-15', 
  '2024-12-31', 
  'Maria Schmidt',
  'Jahresvertrag für Microsoft Office 365 Enterprise Lizenzen für 500 Mitarbeiter',
  ARRAY['Software', 'Microsoft', 'Enterprise'],
  75
),
(
  'Cloud Infrastructure AWS',
  'StartupXYZ',
  'pending',
  85000.00,
  '2024-02-01',
  '2025-01-31',
  'Thomas Müller',
  'AWS Cloud Services für Skalierung der E-Commerce Plattform',
  ARRAY['Cloud', 'AWS', 'Infrastructure'],
  25
),
(
  'Consulting Agreement Q1',
  'Industrie AG',
  'active',
  75000.00,
  '2024-01-01',
  '2024-03-31',
  'Lisa Weber',
  'Strategische IT-Beratung für Digitalisierungsprojekt',
  ARRAY['Consulting', 'Strategy', 'Digital'],
  90
);