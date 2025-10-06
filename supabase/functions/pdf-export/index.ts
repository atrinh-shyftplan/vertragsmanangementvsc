import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

// Dies sind die CORS-Header, die dem Browser sagen, dass unsere App mit dieser Funktion sprechen darf.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Behandelt die Preflight-Anfrage des Browsers für CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extrahiere das HTML aus der Anfrage
    const { htmlContent } = await req.json();

    if (!htmlContent) {
      throw new Error('Kein HTML-Inhalt bereitgestellt.');
    }

    // Starte den unsichtbaren Browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Setze den HTML-Inhalt in die Browser-Seite
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generiere das PDF mit A4-Format und kontrollierten Rändern
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    // Schließe den Browser, um Ressourcen freizugeben
    await browser.close();

    // Sende das generierte PDF zurück
    return new Response(pdf, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="vertrag.pdf"',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});