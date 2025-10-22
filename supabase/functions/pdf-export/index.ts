import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ContractModule {
  title: string;
  content: string;
}

interface RequestBody {
  modules: ContractModule[];
  title?: string;
}

// Hilfsfunktion zum Laden und Konvertieren von Bildern
const imageToDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Could not convert image ${url}:`, error);
    return ''; // Bei Fehler leeren String zurückgeben
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const { modules, title = "Vertrag" }: RequestBody = await req.json();

    console.log('--- PDF Export: Request erhalten ---');
    console.log(`Anzahl der Module: ${modules ? modules.length : 0}`);


    if (!modules || !Array.isArray(modules)) {
      throw new Error('"modules" ist erforderlich und muss ein Array sein.');
    }

    // Wandle alle Bild-URLs in Base64 um
    let contentWithBase64Images = '';
    for (const module of modules) {
      let moduleContent = module.content;
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const matches = moduleContent.matchAll(imgRegex);

      for (const match of matches) {
        const originalSrc = match[1];
        if (originalSrc && originalSrc.startsWith('http')) {
          const dataUrl = await imageToDataUrl(originalSrc);
          if (dataUrl) {
            moduleContent = moduleContent.replace(originalSrc, dataUrl);
          }
        }
      }
      contentWithBase64Images += `
        <div class="page">
          ${module.title ? `<h2 class="module-title">${module.title}</h2>` : ''}
          <div class="content">${moduleContent}</div>
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
          ${contentWithBase64Images}
        </body>
      </html>`;
      
    console.log('--- PDF Export: Generiertes HTML (Anfang) ---');
    console.log(cleanHtml.substring(0, 500)); 
    console.log('--- PDF Export: HTML Ende ---');


    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('BROWSERLESS_API_KEY is not set.');
    }

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
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});