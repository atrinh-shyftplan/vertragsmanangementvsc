import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Globale CORS-Header für alle Antworten
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractModule {
  title: string;
  content: string;
}

interface RequestBody {
  modules: ContractModule[];
  title?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { modules, title = "Vertrag" }: RequestBody = await req.json();

    console.log('--- PDF Export: Request erhalten ---');
    console.log(`Anzahl der Module: ${modules ? modules.length : 0}`);


    if (!modules || !Array.isArray(modules)) {
      throw new Error('"modules" ist erforderlich und muss ein Array sein.');
    }

    // Erstelle den HTML-Inhalt direkt aus den Modulen.
    // Die Base64-Umwandlung wird entfernt; browserless lädt die Bilder von der URL.
    let htmlContent = '';
    for (const module of modules) {
      htmlContent += `
        <div class="page">
          ${module.title ? `<h2 class="module-title">${module.title}</h2>` : ''}
          <div class="content">${module.content}</div>
        </div>
      `;
    }


    const printStyles = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #000 !important;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        box-sizing: border-box;
        page-break-after: always;
      }
      .module-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 1em;
        color: #000 !important;
      }
      .content {
        color: #000 !important;
      }
      .content img {
        max-width: 100% !important;
        height: auto !important;
      }
    `;

    const cleanHtml = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>`;
      
    console.log('--- PDF Export: Generiertes HTML (Anfang) ---');
    console.log(cleanHtml.substring(0, 5000)); 
    console.log('--- PDF Export: HTML Ende ---');


    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('BROWSERLESS_API_KEY is not set.');
    }

    // --- Konfiguration für den /pdf Endpunkt ---
    console.log('Using Browserless /pdf for fast export...');

    const browserlessPayload = {
      // 1. Der HTML-Inhalt
      html: cleanHtml,
      
      // 3. Die PDF-Druckoptionen (ersetzt die 'page.pdf' Einstellungen)
      options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      },

      // 4. Das Warten auf Bilder (ersetzt 'page.setContent' mit 'waitUntil')
      gotoOptions: {
        waitUntil: 'networkidle2', // 'networkidle2' ist effizient
      }
    };

    const response = await fetch(`https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}&timeout=60`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(browserlessPayload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Browserless API Error:', response.status, errorBody.substring(0, 300));
      throw new Error(`Browserless API Error (${response.status}): ${errorBody.substring(0, 300)}`);
    }

    // Der /pdf-Endpunkt gibt direkt den rohen PDF-Buffer zurück.
    const pdfBuffer = await response.arrayBuffer();


    return new Response(pdfBuffer, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});