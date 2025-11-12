// scripts/embed-css.mjs
import fs from 'fs';
import path from 'path';

const cssFilePath = path.join(process.cwd(), 'src', 'lib', 'contract-print-styles.css');
const outputFilePath = path.join(process.cwd(), 'supabase', 'functions', 'process-pdf-job', 'css-as-string.ts');

console.log('Embedding CSS for Supabase Function...');

try {
  const cssContent = fs.readFileSync(cssFilePath, 'utf8');
  
  // Wir "escapen" Backticks ` und Backslashes \ im CSS-Inhalt
  const escapedCss = cssContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`');

  const tsContent = `// AUTOMATISCH GENERIERTE DATEI - NICHT MANUELL BEARBEITEN
// Dieses Skript wird von 'scripts/embed-css.mjs' erstellt

export const cssString = \`
${escapedCss}
\`;
`;

  fs.writeFileSync(outputFilePath, tsContent);
  console.log('✅ CSS-String erfolgreich in css-as-string.ts geschrieben.');

} catch (error) {
  console.error('❌ Fehler beim Einbetten der CSS-Datei:', error.message);
  process.exit(1);
}