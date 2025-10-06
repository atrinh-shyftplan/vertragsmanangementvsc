// supabase/functions/pdf-export/index.ts

import { serve } from "std/http/server.ts";
import puppeteer from "puppeteer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Erlaubt Anfragen von allen Quellen
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Wichtig: OPTIONS hinzufügen
};

const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN');
const BROWSERLESS_URL = `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`;

serve(async (req) => {
  // Stelle sicher, dass auf OPTIONS-Anfragen korrekt geantwortet wird
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { htmlContent } = await req.json();
    if (!htmlContent) {
      return new Response(JSON.stringify({ error: "htmlContent is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const browser = await puppeteer.connect({
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

    await browser.close();

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
  }
});