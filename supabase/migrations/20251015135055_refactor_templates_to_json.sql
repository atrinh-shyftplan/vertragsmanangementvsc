-- Fügt die neue Spalte "modules" vom Typ JSONB zur Tabelle "contract_templates" hinzu.
-- Der Befehl wird nur ausgeführt, falls die Spalte noch nicht existiert, um Fehler zu vermeiden.

ALTER TABLE public.contract_templates
ADD COLUMN IF NOT EXISTS modules JSONB;