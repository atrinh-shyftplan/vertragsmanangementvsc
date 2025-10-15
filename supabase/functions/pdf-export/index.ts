// supabase/functions/pdf-export/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { install } from "https://deno.land/x/puppeteer-install@v1.0.0/mod.ts";

// ... deine interfaces ...

serve(async (req) => {
    // ... deine CORS und try/catch Blöcke ...

    // innerhalb des try-Blocks:
    const { modules, title = "Vertrag" }: RequestBody = await req.json();

    // ... deine Logik zum HTML-Erstellen ...

    // Die wichtigen neuen Zeilen:
    const executablePath = await install();
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // ... der Rest deines Codes bleibt gleich ...
});

// Definiere die erwartete Struktur eines Moduls
interface ContractModule {
  title: string;
  content: string;
}

// Definiere die erwartete Eingabe
interface RequestBody {
  modules: ContractModule[];
  title?: string;
}

serve(async (req) => {
  // CORS Headers für die PREFLIGHT-Anfrage und die Hauptanfrage
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }});
  }

  try {
    const { modules, title = "Vertrag" }: RequestBody = await req.json();

    if (!modules || !Array.isArray(modules)) {
      throw new Error('"modules" ist erforderlich und muss ein Array sein.');
    }

    // 1. Generiere das Inhaltsverzeichnis
    const tableOfContents = modules.map((module, index) => `
      <li>${index + 1}. ${module.title}</li>
    `).join('');

    // 2. Generiere den Hauptinhalt des Vertrags
    const mainContent = modules.map((module, index) => `
      <section class="module">
        <h2>${index + 1}. ${module.title}</h2>
        <div>${module.content}</div>
      </section>
    `).join('');

    // 3. Baue das komplette, saubere HTML zusammen
    const cleanHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          /* Wichtige Druck-Styles */
          body { font-family: sans-serif; font-size: 12px; line-height: 1.5; }
          h1, h2 { page-break-after: avoid; }
          h1 { font-size: 24px; text-align: center; margin-bottom: 40px; }
          .module { page-break-inside: avoid; margin-bottom: 20px; }
          .toc { margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
          .toc h2 { font-size: 18px; }
          .toc ul { list-style: none; padding: 0; }
          /* Weitere Styles hier... */
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="toc">
          <h2>Inhaltsverzeichnis</h2>
          <ul>${tableOfContents}</ul>
        </div>
        ${mainContent}
      </body>
      </html>
    `;

    // 4. Starte Puppeteer und generiere das PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(cleanHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '40px', right: '20px', bottom: '40px', left: '20px' },
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%;">
          Seite <span class="pageNumber"></span> von <span class="totalPages"></span>
        </div>
      `,
      headerTemplate: '<div></div>' // Leerer Header, kann aber genutzt werden
    });

    await browser.close();

    // 5. Sende das PDF zurück
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});