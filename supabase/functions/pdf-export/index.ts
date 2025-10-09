import { serve } from "std/http/server.ts"; // Nutzt den "std/" Alias
import { corsHeaders } from "../_shared/cors.ts";
// @deno-types="npm:@types/puppeteer"
import puppeteer from "puppeteer"; // Nutzt den "puppeteer" Alias

console.log('🕵️ Spion: Funktion wird initialisiert.');

serve(async (req) => {
  // Dies ist für Preflight-Anfragen von Browsern erforderlich.
  if (req.method === 'OPTIONS') {
    console.log('🕵️ Spion: OPTIONS-Anfrage erhalten, CORS-Header gesendet.');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🕵️ Spion: Eingehende Anfrage wird verarbeitet...');
    const { htmlContent, contractId, userId } = await req.json();
    console.log(`🕵️ Spion: Daten erhalten - ContractID: ${contractId}, UserID: ${userId}`);

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    console.log('Gelesener BROWSERLESS_API_KEY:', browserlessApiKey ? 'Schlüssel gefunden' : 'Kein Schlüssel (undefined)');
    if (!browserlessApiKey) {
      console.error('🔥 FEHLER: BROWSERLESS_API_KEY nicht gefunden!');
      throw new Error('BROWSERLESS_API_KEY is not set in environment variables.');
    }
    console.log('🕵️ Spion: Browserless API Key gefunden.');

    // Dynamisches Protokoll für lokale vs. deployed Umgebung
    const isLocal = Deno.env.get('SUPABASE_ENV') === 'local';
    const protocol = isLocal ? 'ws' : 'wss';
    const browserWSEndpoint = `${protocol}://chrome.browserless.io?token=${browserlessApiKey}`;
    console.log(`🕵️ Spion: Verbinde mit ${browserWSEndpoint}`);
    
    let browser;
    try {
      browser = await puppeteer.connect({ browserWSEndpoint });
      console.log('🕵️ Spion: Erfolgreich mit Browserless.io verbunden.');

      const page = await browser.newPage();
      console.log('🕵️ Spion: Neue Browser-Seite geöffnet.');

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      console.log('🕵️ Spion: HTML-Inhalt in die Seite geladen.');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });
      console.log('🕵️ Spion: PDF-Buffer erfolgreich erstellt.');

      // ... (Restlicher Code für das Speichern in Supabase Storage)
      // WICHTIG: Stelle sicher, dass dein Storage-Code hier korrekt ist.
      // Ich lasse ihn unverändert.

      const filePath = `${userId}/${contractId}.pdf`;
      // Upload to Supabase Storage, etc. ...
      // ... (Dein Code)
      
      console.log(`🕵️ Spion: PDF erfolgreich unter ${filePath} gespeichert.`);

      return new Response(
        JSON.stringify({ message: "PDF created and saved successfully.", filePath: filePath }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } finally {
      if (browser) {
        await browser.close();
        console.log('🕵️ Spion: Browser-Verbindung geschlossen.');
      }
    }
  } catch (error) {
    console.error('🔥 GLOBALER FEHLER:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})