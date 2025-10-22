import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Buffer } from 'https://deno.land/std@0.168.0/io/buffer.ts';

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

    // Wir wechseln zum /function Endpunkt, da /pdf die "waitFor" Option mit HTML nicht unterstützt.
    // Dies ist der korrekte Weg, um sicherzustellen, dass alle Ressourcen (Bilder) geladen werden.
    const code = `
      module.exports = async ({ page, context }) => {
        // Setze den HTML-Inhalt der Seite
        await page.setContent(context.html, {
          // Warte, bis das Netzwerk für 500ms inaktiv ist. Das stellt sicher, dass Bilder etc. geladen sind.
          waitUntil: 'networkidle0',
        });

        // Generiere das PDF mit den Optionen direkt hier.
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        return pdf;
      };
    `;

    const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        context: {
          html: cleanHtml,
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