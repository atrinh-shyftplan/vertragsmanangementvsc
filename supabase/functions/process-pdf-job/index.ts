import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log(`Function 'process-pdf-job' starting up.`);


// 1. Importiere den CSS-String aus der automatisch generierten Datei
import { cssString as cssStyles } from './css-as-string.ts';

// 2. Erstelle das vollständige HTML-Dokument für das PDF
function createFullHtml(htmlContent: string): string {
  
  // PDF-spezifische Overrides (z.B. kleinere Schrift)
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>shyftplan Vertrag</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
          /* Lade die Stile aus unserer zentralen Datei */
          ${cssStyles}
        </style>
      </head>
      <body class="contract-preview"> 
        ${htmlContent}
      </body>
    </html>`;
}
// Erstelle einen Supabase-Admin-Client
// (Verwendet den KEY_NAME, den wir in 4.4a als "SERVICE_KEY" definiert haben)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_KEY')! // <-- Benutzt den korrigierten Key-Namen
);

// Definiere den Typ für die Job-Datenbankzeile
interface PdfGenerationJob {
  id: string;
  html_content: string;
  filename: string;
  user_id: string;
  // ... ggf. andere Felder
}

serve(async (req) => {
  // CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let jobId: string | null = null; // Job-ID für die Fehlerbehandlung

  try {
    console.log('--- process-pdf-job: searching for new job ---');

    // 1. Hole den ÄLTESTEN Job, der 'pending' ist (Deine Logik)
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('pdf_generation_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<PdfGenerationJob>();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!job) {
      console.log('No pending jobs found.');
      return new Response(JSON.stringify({ message: 'No pending jobs.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    jobId = job.id;
    console.log(`Processing job ID: ${jobId}`);

    // 2. Setze Status auf 'processing'
    await supabaseAdmin
      .from('pdf_generation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    try {
      // --- PDFLAYER API LOGIK (Deine Logik) ---
      const pdflayerApiKey = Deno.env.get('PDFLAYER_ACCESS_KEY'); // <-- Verwendet den Key-Namen aus deinem alten Code
      if (!pdflayerApiKey) {
        throw new Error('PDFLAYER_ACCESS_KEY is not set in Supabase Secrets.');
      }

      const apiUrl = `https://api.pdflayer.com/api/convert?access_key=${pdflayerApiKey}`;
      console.log(`Calling pdflayer (HTTPS) for job ${jobId}...`);

      const formData = new FormData();
      
      // *** START GEÄNDERTE STELLE ***
      // Wir verwenden nicht mehr job.html_content direkt...
      // formData.append('document_html', job.html_content);
      
      // ...sondern unser neu erstelltes, voll-gestyltes HTML
      const fullHtml = createFullHtml(job.html_content);
      formData.append('document_html', fullHtml);
      // *** ENDE GEÄNDERTE STELLE ***
      
      // -- Optionen (aus deinem alten Code) --
      formData.append('page_size', 'A4');
      formData.append('margin_top', '20mm');
      formData.append('margin_right', '20mm');
      formData.append('margin_bottom', '20mm');
      formData.append('margin_left', '20mm');
      formData.append('delay', '3000');
      // WICHTIG: Sag PDFLayer, dass es unsere @page CSS-Regeln beachten soll!
      formData.append('use_print_media', '1');
      formData.append('zoom', '1');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`pdflayer API Error for job ${jobId}:`, response.status, errorBody.substring(0, 300));
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson?.error?.info) {
              throw new Error(`pdflayer Error (${response.status}): ${errorJson.error.info}`);
          }
        } catch (parseError) {
          throw new Error(`pdflayer Error (${response.status}): ${errorBody.substring(0, 300)}`);
        }
      }

      const pdfBlob = await response.blob();
      console.log(`PDF Blob received for job ${jobId}. Size: ${pdfBlob.size} bytes`);

      // 4. PDF in Supabase Storage hochladen (Deine Bucket-Namen)
      const storagePath = `user_pdfs/${job.user_id}/${job.id}_${job.filename}`;
      const { error: storageError } = await supabaseAdmin.storage
        .from('pdf_files') // <-- Dein Bucket-Name 'pdf_files'
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (storageError) {
        throw new Error(`Storage Error: ${storageError.message}`);
      }

      console.log(`PDF for job ${jobId} uploaded to Storage:`, storagePath);

      // 5. Job als 'completed' markieren (Dein Schema)
      await supabaseAdmin
        .from('pdf_generation_jobs')
        .update({
          status: 'completed',
          storage_path: storagePath, // Speichert den Pfad
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      console.log(`--- Job ${jobId} COMPLETED ---`);

    } catch (processingError) {
      // --- FEHLERBEHANDLUNG (pdflayer oder Storage) ---
      console.error(`Failed to process job ${jobId}:`, processingError.message);
      await supabaseAdmin
        .from('pdf_generation_jobs')
        .update({
          status: 'failed',
          error_message: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }

    return new Response(JSON.stringify({ success: true, processedJobId: jobId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Genereller Fehler
    console.error('Fatal error in process-pdf-job:', error);
    if (jobId) {
      try {
        await supabaseAdmin
          .from('pdf_generation_jobs')
          .update({
            status: 'failed',
            error_message: `Fatal function error: ${error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (updateError) {
          console.error(`Failed to mark job ${jobId} as failed after fatal error:`, updateError);
      }
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});