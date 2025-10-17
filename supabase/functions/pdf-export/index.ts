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

    if (!modules || !Array.isArray(modules)) {
      throw new Error('"modules" ist erforderlich und muss ein Array sein.');
    }

    // TEMPORÄRER DEBUGGING-SCHRITT: Ersetze das komplexe HTML durch ein minimales Test-HTML.
    const cleanHtml = `<!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body style="border: 5px solid red; padding: 20px;">
          <h1 style="color: blue;">Hallo Welt!</h1>
          <p>Wenn dieser Text im PDF erscheint, funktioniert die Basis-Kommunikation mit browserless.io.</p>
        </body>
      </html>`;

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('BROWSERLESS_API_KEY is not set.');
    }

    const response = await fetch(`https://production-sfo.browserless.io/screenshot?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: cleanHtml,
        options: {
          fullPage: true, // Macht einen Screenshot der gesamten Seite
          type: 'png'     // Wir wollen ein PNG-Bild
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Browserless API Error Response:', errorBody); // Wichtig für Server-Logs
      // Gib den Fehler als strukturierte JSON-Antwort an den Client zurück
      return new Response(JSON.stringify({ 
        error: 'Fehler von browserless.io API.',
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        }
      }), {
        status: 502, // Bad Gateway - passender Fehler für ein Upstream-Problem
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const imageBuffer = await response.arrayBuffer(); // Umbenennen für Klarheit

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="debug_screenshot.png"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Allgemeiner Fehler in der Edge Function:', error);
    return new Response(JSON.stringify({ 
      error: 'Ein interner Fehler ist aufgetreten.',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});