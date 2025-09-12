-- Add product_tags column to contract_modules table
ALTER TABLE public.contract_modules 
ADD COLUMN product_tags TEXT[] DEFAULT '{"core"}'::TEXT[];

-- Add index for better performance when filtering by product tags
CREATE INDEX idx_contract_modules_product_tags ON public.contract_modules USING GIN(product_tags);

-- Update existing modules to have 'core' tag (these will always be included)
UPDATE public.contract_modules 
SET product_tags = '{"core"}'::TEXT[] 
WHERE product_tags IS NULL;