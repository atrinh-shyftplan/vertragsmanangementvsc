// AUTOMATISCH GENERIERTE DATEI - NICHT MANUELL BEARBEITEN
// Dieses Skript wird von 'scripts/embed-css.mjs' erstellt

export const cssString = `
/* src/lib/contract-print-styles.css */
/* Unsere "Single Source of Truth" für das Vertrags-Styling */
/* * 1. SEITEN-LAYOUT FÜR PDF
 * (aus supabase/functions/pdf-export/index.ts) 
 */
@page {
  size: A4;
  margin: 20mm; /* Du kannst '20mm' anpassen, wenn nötig */
}

/* * 2. BASIS-STYLING FÜR DEN KONSISTENTEN LOOK
 * (Kombination aus NewContractEditor.tsx und pdf-export/index.ts)
 *
 * Wir verwenden .contract-preview als unseren "Body", 
 * damit die Stile sicher gekapselt sind.
 */
.contract-preview {
  font-family: 'Inter', 'Arial', sans-serif; /* Angepasst an die Live-Vorschau */
  line-height: 1.6; /* Guter Zeilenabstand (aus pdf-export) */
  color: #000000 !important; /* Grundfarbe sicherstellen */
  font-size: 14px;
}

/* * 3. ALLE DETAIL-STILE
 * (Direkt kopiert aus dem <style>-Block in NewContractEditor.tsx) 
 */
.contract-preview h1 {
  font-size: 1.5rem !important; /* text-2xl */
}
.contract-preview h2 {
  font-size: 1.25rem !important; /* text-xl */
}
.contract-preview h3 {
  font-size: 1.125rem !important; /* text-lg */
  font-weight: 700 !important; 
  color: #1f2937 !important;
  margin-top: 0 !important;
  margin-bottom: 0.75rem !important; /* mb-3 */
}

.contract-preview .side-by-side-table {
  width: 100%;
  margin: 1.5rem 0;
}
.contract-preview .table-content-de,
.contract-preview .table-content-en {
  vertical-align: top;
}
.contract-preview .table-content-de p,
.contract-preview .table-content-en p {
  margin: 0.75rem 0;
}
.contract-preview .table-content-de ul,
.contract-preview .table-content-en ul {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
  list-style-type: disc;
}
.contract-preview .table-content-de ol,
.contract-preview .table-content-en ol {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
  list-style-type: decimal;
}
.contract-preview .table-content-de li,
.contract-preview .table-content-en li {
  margin: 0.25rem 0;
}
.contract-preview table {
  width: 100%; /* Ensure tables take full width */
  border-collapse: collapse; /* Collapse borders for a cleaner look */
  margin: 10px 0; /* Add some vertical margin for spacing */
}
.header-content table td {
  padding: 8px 12px;
  vertical-align: top;
  border: 1px solid #e5e7eb;
}
.header-content table td:first-child {
  font-weight: 600;
  background-color: #f9fafb;
  width: 40%;
}
.header-content .company-logo {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 30px;
}
.header-content .offer-info-block {
  margin: 25px 0;
  padding: 15px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.header-content .convenience-block {
  margin: 25px 0;
  padding: 15px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  border-style: dashed;
}
.header-content .company-section {
  margin: 30px 0;
  padding: 20px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.header-content .company-divider {
  margin: 40px 0;
  height: 2px;
  background-color: #e5e7eb;
  border-radius: 1px;
}
.header-content .info-line {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  padding: 6px 10px;
  background-color: #f8fafc;
  border-radius: 4px;
  border-left: 4px solid #8C5AF5;
}
.header-content .info-label {
  font-weight: 600;
  color: #374151;
  min-width: 120px;
}
.header-content .info-value {
  color: #1f2937;
}
.header-content p {
  margin: 8px 0;
  line-height: 1.5;
}
.header-content strong {
  font-weight: 600;
}
.header-content .between-text {
  margin: 30px 0 20px 0;
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
}
.contract-preview ul {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin: 0.5rem 0 !important;
  color: #000000 !important;
}
.contract-preview ul li {
  color: #000000 !important;
  margin: 0.25rem 0 !important;
}
.contract-preview ul li::marker { color: #000000 !important; content: "●" !important; }
.contract-preview ol {
  padding-left: 1.5rem !important;
  margin: 0.5rem 0 !important;
  color: #000000 !important;
}
.contract-preview ol li {
  color: #000000 !important;
  margin: 0.25rem 0 !important;
}
.contract-preview p {
  color: #000000 !important;
  margin: 0.5rem 0 !important;
}
.contract-preview * {
  color: #000000 !important;
}
.contract-preview li::before {
  color: #000000 !important;
}
.contract-preview ul > li::marker,
.contract-preview ol > li::marker {
  color: #000000 !important;
  font-weight: bold !important;
}

/* Punkt 4: Standard-Abstand für ALLE Tabellenzellen */
.contract-preview table th,
.contract-preview table td {
  padding: 8px; /* Sorgt für sauberen Abstand zur Linie */
  vertical-align: top; /* Stellt sicher, dass Texte oben beginnen */
  line-height: 1.5; /* Verbessert Lesbarkeit in Zellen */
}

/* Punkt 3: Styling für Tabellen MIT Rand (Gitter-Ansicht) */
.contract-preview table.full-border {
  border-collapse: collapse; /* Wichtig für saubere Linien */
  width: 100%;
}
.contract-preview table.full-border th,
.contract-preview table.full-border td {
  border: 1px solid #000; /* Solider schwarzer Rand */
}

/* Punkt 3: Styling für Standard-Tabellen (nur vertikale Linien, wie im Beispiel) */
.contract-preview table:not(.full-border):not(.no-border) {
   border-collapse: collapse;
   width: 100%;
}
/* Wir stylen hier nur die vertikalen Ränder für DE/EN-Spalten */
.contract-preview table:not(.full-border):not(.no-border) td,
.contract-preview table:not(.full-border):not(.no-border) th {
   border-left: 1px solid #000;
   border-right: 1px solid #000;
}
/* Entferne den Rand für die erste und letzte Zelle */
.contract-preview table:not(.full-border):not(.no-border) td:first-child,
.contract-preview table:not(.full-border):not(.no-border) th:first-child {
  border-left: none;
}
.contract-preview table:not(.full-border):not(.no-border) td:last-child,
.contract-preview table:not(.full-border):not(.no-border) th:last-child {
  border-right: none;
}

/* Erzwingt A4-Maße (210mm) und die PDF-Ränder (20mm) */
.a4-preview-frame {
  width: 210mm; /* A4-Breite */
  /* min-height: 297mm; /* (Optional, wenn du das Papier-Gefühl willst) */
  
  padding: 20mm; /* Unsere PDF-Ränder! (aus process-pdf-job) */
  
  margin-left: auto;
  margin-right: auto;
  
  /* Visuelle Simulation eines Blattes Papier */
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  border: 1px solid #ddd;
  background: #fff;
  
  box-sizing: border-box; 
}

/* * FIX FÜR 50/50-SPALTEN:
 * Zwingt Spalten in Standard-Tabellen (DE/EN) auf 50% Breite.
 * Tiptap fügt manchmal <col>-Tags mit festen Breiten hinzu, 
 * die wir hier überschreiben müssen.
 */
.contract-preview table:not(.full-border):not(.no-border) col {
  width: 50% !important;
}

.contract-preview table:not(.full-border):not(.no-border) td {
  width: 50%;
}
`;
