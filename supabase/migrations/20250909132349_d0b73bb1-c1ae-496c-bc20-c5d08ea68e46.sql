-- Add category column to global_variables table
ALTER TABLE global_variables ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Update existing variables with appropriate categories
UPDATE global_variables SET category = 'header' WHERE key IN ('firma', 'angebot_nr', 'datum');

UPDATE global_variables SET category = 'vertragskonditionen' WHERE key IN (
  'poc_beginn', 'poc_laufzeit', 'poc_lizenzen', 'poc_pauschale',
  'rollout_beginn', 'rollout_laufzeit', 'rollout_pauschale', 'rollout_zusatzlizenz',
  'prod_beginn', 'prod_laufzeit', 'prod_lizenzen', 'prod_basispreis', 'prod_zusatzlizenz',
  'std_vertragsbeginn', 'std_vertragslaufzeit', 'std_lizenzen', 'std_basispreis', 'std_zusatzlizenz'
);