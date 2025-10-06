// supabase/functions/pdf-export/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

// CORS-Header für die Antworten
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Erlaube Anfragen von jeder Herkunft
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // NEU: OPTIONS Preflight-Anfrage behandeln
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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
        "Content-Disposition": "attachment; filename=\"vertragsdokument.pdf\"",
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});