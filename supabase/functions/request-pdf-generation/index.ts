import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Importiere die CORS-Header

console.log(`Function 'request-pdf-generation' starting up.`);

serve(async (req) => {
  // CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    const { html_content, filename } = await req.json();

    // Validierung der Eingabedaten
    if (!html_content || !filename) {
      throw new Error('html_content and filename are required.');
    }

    console.log('Request body parsed successfully. Filename:', filename);

    // Supabase-Admin-Client erstellen (benötigt Zugriff auf JWT)
    // Wichtig: Dieser Client prüft das User-Token!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Benutzer-ID aus dem JWT holen
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated.');
    }
    console.log('User authenticated:', user.id);

    // Neuen Job in die Datenbank einfügen
    const { data: jobData, error: insertError } = await supabaseClient
      .from('pdf_generation_jobs')
      .insert({
        user_id: user.id,
        html_content: html_content,
        filename: filename,
        status: 'pending' // Startstatus
      })
      .select('id') // Nur die ID des neuen Jobs zurückgeben
      .single(); // Wir erwarten nur einen Eintrag

    if (insertError) {
      console.error('Error inserting job into DB:', insertError);
      throw insertError;
    }

    console.log('Job created successfully with ID:', jobData.id);

    // Erfolgreiche Antwort an das Frontend senden
    return new Response(JSON.stringify({ success: true, jobId: jobData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    // Detailliertere Fehlermeldung zurückgeben
    return new Response(JSON.stringify({ error: `Failed to process PDF request: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'User not authenticated.' ? 401 : 400, // 401 bei Auth-Fehler, sonst 400
    });
  }
});