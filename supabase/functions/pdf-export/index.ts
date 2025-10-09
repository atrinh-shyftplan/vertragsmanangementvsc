// supabase/functions/pdf-export/index.ts

// Wir verwenden wieder die vollen URLs, um Fehler mit der import_map zu vermeiden
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@v10.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN');
if (!BROWSERLESS_TOKEN) {
  // Im Fehlerfall eine klare Fehlermeldung zurückgeben
  const errorResponse = { error: "BROWSERLESS_TOKEN is not set in Supabase secrets." };
  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const BROWSERLESS_URL = `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let browser;
  try {
    const { htmlContent } = await req.json();
    if (!htmlContent) {
      return new Response(JSON.stringify({ error: "htmlContent is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    browser = await puppeteer.connect({
      browserWSEndpoint: BROWSERLESS_URL,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vertragsdokument.pdf"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error in PDF generation process:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});