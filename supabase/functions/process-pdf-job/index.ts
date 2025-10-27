// supabase/functions/process-pdf-job/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log(`Function 'process-pdf-job' starting up.`);

// Erstelle einen Supabase-Admin-Client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Definiere den Typ für die Job-Datenbankzeile (passe dies an deine Tabelle an)
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

    // 1. Hole den ÄLTESTEN Job, der 'pending' ist
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('pdf_generation_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) 
      .limit(1)
      .maybeSingle<PdfGenerationJob>(); // Erlaube null, wenn nichts gefunden wird

    // Fehler beim Abrufen (außer "nichts gefunden")
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching job:', fetchError.message);
      throw fetchError;
    }

    // Nichts zu tun
    if (!job) {
      console.log('No pending jobs found.');
      return new Response(JSON.stringify({ message: 'No pending jobs.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    jobId = job.id; // Speichere die Job-ID für die Fehlerbehandlung
    console.log(`Processing job ID: ${jobId}`);

    // 2. Setze Status auf 'processing'
    await supabaseAdmin
      .from('pdf_generation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    try {
      // --- PDFLAYER API LOGIK ---
      const pdflayerApiKey = Deno.env.get('PDFLAYER_ACCESS_KEY');
      if (!pdflayerApiKey) {
        throw new Error('PDFLAYER_ACCESS_KEY is not set in Supabase Secrets.');
      }

      // 1. URL auf HTTPS geändert
      const apiUrl = `https://api.pdflayer.com/api/convert?access_key=${pdflayerApiKey}`;
      console.log(`Calling pdflayer (HTTPS) for job ${jobId}...`);

      const formData = new FormData();
      formData.append('document_html', job.html_content);
      
      // -- Optionen (wie von dir gewünscht, erstmal minimal) --
      formData.append('page_size', 'A4');
      formData.append('margin_top', '20mm');
      formData.append('margin_right', '20mm');
      formData.append('margin_bottom', '20mm');
      formData.append('margin_left', '20mm');
      // formData.append('test', '1'); // Zum Testen ohne Credits zu verbrauchen (entfernen für Produktion)

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

      // 4. PDF in Supabase Storage hochladen
      // 2. Bucket-Name auf 'pdf_files' geändert
      const storagePath = `user_pdfs/${job.user_id}/${job.id}_${job.filename}`;
      const { error: storageError } = await supabaseAdmin.storage
        .from('pdf_files') // <-- DEIN BUCKET NAME
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (storageError) {
        console.error(`Storage Upload Error for job ${jobId}:`, storageError);
        throw new Error(`Storage Error: ${storageError.message}`);
      }

      console.log(`PDF for job ${jobId} uploaded to Storage:`, storagePath);

      // 5. Job als 'completed' markieren (mit storage_path)
      await supabaseAdmin
        .from('pdf_generation_jobs')
        .update({
          status: 'completed',
          storage_path: storagePath, // Hier speichern wir den Pfad
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

    // Erfolg der *Funktion* melden
    return new Response(JSON.stringify({ success: true, processedJobId: jobId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Genereller Fehler (z.B. DB-Verbindung)
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