import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ContractModule {
  title: string;
  content: string;
}

interface RequestBody {
  modules: ContractModule[];
  title?: string;
}

serve(async (req) => {
  // CORS Header für PREFLIGHT und die Hauptanfrage
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }});
  }

  try {
    const { modules, title = "Vertrag" }: RequestBody = await req.json();

    // --- HIER DIE SPION-ZEILE EINFÜGEN ---
    console.log("Empfangene Module:", JSON.stringify(modules, null, 2));

    if (!modules || !Array.isArray(modules)) {
      throw new Error('"modules" ist erforderlich und muss ein Array sein.');
    }

    // Definiere die CSS-Stile für den Druck und das seitenbasierte Layout.
    const printStyles = `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        line-height: 1.6;
      }
      .page {
        width: 210mm;
        min-height: 297mm; /* Stellt sicher, dass die Seite immer voll ist */
        padding: 20mm;
        box-sizing: border-box;
        page-break-after: always; /* Erzwingt einen Seitenumbruch nach jedem Modul */
      }
      .module-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 1em;
        color: #333;
      }
      .content {
        /* Stile für den Inhaltsbereich, falls benötigt */
      }
    `;

    // Erstelle für jedes Modul eine eigene Seite.
    const pagesHtml = modules.map(module => `
      <div class="page">
        ${module.title ? `<h2 class="module-title">${module.title}</h2>` : ''}
        <div class="content">${module.content}</div>
      </div>
    `).join('');

    // Setze das finale HTML-Dokument zusammen.
    const cleanHtml = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>`;

    // Hole den API Key aus den Secrets
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('BROWSERLESS_API_KEY is not set.');
    }

    // **DIE NEUE, STABILE LOGIK via REST API**
    const response = await fetch(`https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: cleanHtml,
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: '40px', right: '20px', bottom: '40px', left: '20px' },
          displayHeaderFooter: true,
          footerTemplate: `<div style="font-size: 9px; text-align: center; width: 100%;">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>`,
          headerTemplate: '<div></div>'
        }
      })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Browserless API Error (${response.status}): ${errorBody}`);
    }

    const pdfBuffer = await response.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});