// supabase/functions/pdf-export/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import puppeteer from "puppeteer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dieser Token wird jetzt sicher aus den Secrets geladen
const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN');
const BROWSERLESS_URL = `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`;

serve(async (req) => {
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

    // Verbindet sich mit dem externen Browserless-Dienst
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