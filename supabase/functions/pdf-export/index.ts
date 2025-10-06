// supabase/functions/pdf-export/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { launch } from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // KORREKTUR: Wir lesen jetzt 'htmlContent' statt 'html' aus.
    const { htmlContent } = await req.json();

    if (!htmlContent) {
      return new Response(JSON.stringify({ error: 'Missing html content' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const browser = await launch();
    const page = await browser.newPage();

    // Setze den HTML-Inhalt der Seite
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generiere das PDF
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

    await browser.close();

    // Sende das PDF als Antwort zurück
    return new Response(pdf, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="contract.pdf"',
      },
      status: 200,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})