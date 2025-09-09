-- Add variables to Rollout conditions module
UPDATE contract_modules 
SET variables = '[
  {"key": "poc_beginn", "name_de": "POC Vertragsbeginn", "description": "Startdatum der Proof of Concept Phase"},
  {"key": "poc_laufzeit", "name_de": "POC Laufzeit", "description": "Dauer der POC Phase in Monaten"},
  {"key": "poc_lizenzen", "name_de": "POC Lizenzen", "description": "Anzahl der POC Lizenzen"},
  {"key": "poc_pauschale", "name_de": "POC Pauschale", "description": "Einmalige POC Pauschale"},
  {"key": "rollout_beginn", "name_de": "Rollout Beginn", "description": "Startdatum der Rollout-Phase"},
  {"key": "rollout_laufzeit", "name_de": "Rollout Laufzeit", "description": "Dauer der Rollout-Phase in Monaten"},
  {"key": "rollout_pauschale", "name_de": "Rollout Pauschale", "description": "Rollout Pauschale für bis zu 10.000 Lizenzen"},
  {"key": "rollout_zusatzlizenz", "name_de": "Rollout Zusatzlizenz", "description": "Preis pro zusätzlicher Lizenz pro Monat"},
  {"key": "prod_beginn", "name_de": "Produktiv Beginn", "description": "Startdatum der Produktiv-Phase"},
  {"key": "prod_laufzeit", "name_de": "Produktiv Laufzeit", "description": "Dauer der Produktiv-Phase in Jahren"},
  {"key": "prod_lizenzen", "name_de": "Produktiv Lizenzen", "description": "Anzahl der Produktiv Lizenzen"},
  {"key": "prod_basispreis", "name_de": "Produktiv Basispreis", "description": "Jährlicher Basispreis für Produktiv-Phase"},
  {"key": "prod_zusatzlizenz", "name_de": "Produktiv Zusatzlizenz", "description": "Preis pro zusätzlicher Lizenz pro Jahr"}
]'::jsonb
WHERE key = 'ep_rollout_conditions';

-- Add variables to Standard conditions module
UPDATE contract_modules 
SET variables = '[
  {"key": "std_vertragsbeginn", "name_de": "Standard Vertragsbeginn", "description": "Startdatum des Standard-Vertrags"},
  {"key": "std_vertragslaufzeit", "name_de": "Standard Vertragslaufzeit", "description": "Laufzeit in Jahren"},
  {"key": "std_lizenzen", "name_de": "Standard Lizenzen", "description": "Anzahl der inkludierten User-Lizenzen"},
  {"key": "std_basispreis", "name_de": "Standard Basispreis", "description": "Jährlicher Basispreis"},
  {"key": "std_zusatzlizenz", "name_de": "Standard Zusatzlizenz", "description": "Preis pro zusätzlicher User-Lizenz pro Jahr"}
]'::jsonb
WHERE key = 'ep_standard_conditions';