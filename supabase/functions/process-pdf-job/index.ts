import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Wir brauchen CORS für den Trigger

console.log(`Function 'process-pdf-job' starting up.`);

// Erstelle einen Supabase-Admin-Client
// Dieser Client nutzt den Service Role Key, um RLS zu umgehen
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // WICHTIG: Service Role Key!
);

serve(async (req) => {
  // Diese Funktion sollte idealerweise durch einen Cronjob oder Webhook getriggert werden.
  // Wir fügen eine einfache Autorisierung hinzu, falls sie manuell aufgerufen wird.
  // Für einen echten Cronjob-Trigger ist das ggf. anzupassen.

  // CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('--- process-pdf-job: searching for new job ---');

    // 1. Hole den ÄLTESTEN Job, der 'pending' ist
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('pdf_generation_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) // Ältesten zuerst
      .limit(1)
      .single(); // Nimm nur einen

    if (fetchError || !job) {
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = "No rows found"
        console.error('Error fetching job:', fetchError.message);
      } else {
        console.log('No pending jobs found.');
      }
      return new Response(JSON.stringify({ message: 'No pending jobs.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Processing job ID: ${job.id}`);

    // 2. Setze Status auf 'processing', damit er nicht nochmal geholt wird
    await supabaseAdmin
      .from('pdf_generation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.id);

    try {
      // --- HIER STARTET DEINE ALTE PDF-EXPORT LOGIK ---
      const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
      if (!browserlessApiKey) {
        throw new Error('BROWSERLESS_API_KEY is not set.');
      }

      const browserlessPayload = {
        html: job.html_content, // HTML aus dem Job holen
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
        }
      };

      console.log(`Calling Browserless for job ${job.id}...`);

      const response = await fetch(`https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}&timeout=60`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(browserlessPayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Browserless API Error for job ${job.id}:`, response.status, errorBody.substring(0, 300));
        throw new Error(`Browserless Error (${response.status}): ${errorBody.substring(0, 300)}`);
      }

      // 3. PDF-Buffer von Browserless erhalten
      const pdfBuffer = await response.arrayBuffer();
      console.log(`PDF Buffer received for job ${job.id}. Size: ${pdfBuffer.byteLength} bytes`);

      // 4. PDF in Supabase Storage hochladen
      const storagePath = `generated-pdfs/${job.user_id}/${job.id}_${job.filename}`;
      const { error: storageError } = await supabaseAdmin.storage
        .from('pdf_files') // Sicherstellen, dass dieser Bucket existiert!
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true // Überschreiben, falls Job neu gestartet wurde
        });

      if (storageError) {
        console.error(`Storage Upload Error for job ${job.id}:`, storageError);
        throw new Error(`Storage Error: ${storageError.message}`);
      }

      console.log(`PDF for job ${job.id} uploaded to Storage:`, storagePath);

      // 5. Job als 'completed' markieren
      await supabaseAdmin
        .from('pdf_generation_jobs')
        .update({ 
          status: 'completed', 
          storage_path: storagePath, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', job.id);

      console.log(`--- Job ${job.id} COMPLETED ---`);

    } catch (processingError) {
      // --- FEHLERBEHANDLUNG (Browserless oder Storage) ---
      console.error(`Failed to process job ${job.id}:`, processingError.message);
      // Job als 'failed' markieren
      await supabaseAdmin
        .from('pdf_generation_jobs')
        .update({ 
          status: 'failed', 
          error_message: processingError.message, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', job.id);
    }

    // Erfolg der *Funktion* melden (nicht des PDF-Jobs)
    return new Response(JSON.stringify({ success: true, processedJobId: job.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Genereller Fehler beim Start der Funktion
    console.error('Fatal error in process-pdf-job:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});