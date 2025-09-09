-- Add contract module variables as global variables

-- Rollout conditions variables
INSERT INTO global_variables (key, name_de, description, is_active) VALUES
('poc_beginn', 'POC Vertragsbeginn', 'Startdatum der Proof of Concept Phase', true),
('poc_laufzeit', 'POC Laufzeit', 'Dauer der POC Phase in Monaten', true),
('poc_lizenzen', 'POC Lizenzen', 'Anzahl der POC Lizenzen', true),
('poc_pauschale', 'POC Pauschale', 'Einmalige POC Pauschale', true),
('rollout_beginn', 'Rollout Beginn', 'Startdatum der Rollout-Phase', true),
('rollout_laufzeit', 'Rollout Laufzeit', 'Dauer der Rollout-Phase in Monaten', true),
('rollout_pauschale', 'Rollout Pauschale', 'Rollout Pauschale für bis zu 10.000 Lizenzen', true),
('rollout_zusatzlizenz', 'Rollout Zusatzlizenz', 'Preis pro zusätzlicher Lizenz pro Monat', true),
('prod_beginn', 'Produktiv Beginn', 'Startdatum der Produktiv-Phase', true),
('prod_laufzeit', 'Produktiv Laufzeit', 'Dauer der Produktiv-Phase in Jahren', true),
('prod_lizenzen', 'Produktiv Lizenzen', 'Anzahl der Produktiv Lizenzen', true),
('prod_basispreis', 'Produktiv Basispreis', 'Jährlicher Basispreis für Produktiv-Phase', true),
('prod_zusatzlizenz', 'Produktiv Zusatzlizenz', 'Preis pro zusätzlicher Lizenz pro Jahr', true)

ON CONFLICT (key) DO UPDATE SET
name_de = EXCLUDED.name_de,
description = EXCLUDED.description,
is_active = EXCLUDED.is_active;

-- Standard conditions variables  
INSERT INTO global_variables (key, name_de, description, is_active) VALUES
('std_vertragsbeginn', 'Standard Vertragsbeginn', 'Startdatum des Standard-Vertrags', true),
('std_vertragslaufzeit', 'Standard Vertragslaufzeit', 'Laufzeit in Jahren', true),
('std_lizenzen', 'Standard Lizenzen', 'Anzahl der inkludierten User-Lizenzen', true),
('std_basispreis', 'Standard Basispreis', 'Jährlicher Basispreis', true),
('std_zusatzlizenz', 'Standard Zusatzlizenz', 'Preis pro zusätzlicher User-Lizenz pro Jahr', true)

ON CONFLICT (key) DO UPDATE SET
name_de = EXCLUDED.name_de,
description = EXCLUDED.description,
is_active = EXCLUDED.is_active;