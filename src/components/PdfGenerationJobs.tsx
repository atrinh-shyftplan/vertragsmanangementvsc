import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // shadcn/ui toast
// import { toast as sonnerToast } from 'sonner'; // Sonner toast (optional, falls du das bevorzugst)

// Definiere den Typ für einen PDF-Job (ggf. in types.ts verschieben)
interface PdfGenerationJob {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  storage_path: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Polling-Intervall in Millisekunden (z.B. alle 10 Sekunden)
const POLLING_INTERVAL = 10000;

export function PdfGenerationJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<PdfGenerationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast(); // shadcn/ui toast

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdf_generation_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Neueste zuerst

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching PDF jobs:', error);
      toast({
        title: "Fehler",
        description: "PDF-Aufträge konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initiales Laden und Polling-Setup
  useEffect(() => {
    if (user) {
      fetchJobs(); // Sofort laden
      const intervalId = setInterval(fetchJobs, POLLING_INTERVAL); // Polling starten

      // Aufräumen, wenn die Komponente unmountet wird
      return () => clearInterval(intervalId);
    }
  }, [user, fetchJobs]);

  const handleDownload = async (job: PdfGenerationJob) => {
    if (!job.storage_path) return;
    setDownloadingId(job.id);
    try {
      const { data, error } = await supabase.storage
        .from('pdf_files') // Der Name deines Storage Buckets
        .download(job.storage_path);

      if (error) throw error;
      if (!data) throw new Error('Keine Daten erhalten.');

      // Download im Browser starten
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = job.filename; // Verwende den gespeicherten Dateinamen
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download fehlgeschlagen",
        description: error.message || "Das PDF konnte nicht heruntergeladen werden.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: PdfGenerationJob['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600/50"><Clock className="h-3 w-3 mr-1" /> Ausstehend</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-blue-600 border-blue-600/50"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> In Bearbeitung</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600/50"><CheckCircle className="h-3 w-3 mr-1" /> Fertig</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="secondary">Unbekannt</Badge>;
    }
  };

  if (!user) {
    return null; // Zeige nichts an, wenn kein Benutzer angemeldet ist
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generierte PDFs</CardTitle>
        <CardDescription>Status Ihrer PDF-Exportaufträge. Die Liste aktualisiert sich automatisch.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && jobs.length === 0 && <p className="text-muted-foreground">Lade Aufträge...</p>}
        {!loading && jobs.length === 0 && <p className="text-muted-foreground">Noch keine PDF-Exporte gestartet.</p>}

        {jobs.length > 0 && (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium text-sm truncate max-w-xs">{job.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    Erstellt: {new Date(job.created_at).toLocaleString('de-DE')}
                  </p>
                  {job.status === 'failed' && job.error_message && (
                    <p className="text-xs text-destructive mt-1">Fehler: {job.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.status)}
                  {job.status === 'completed' && job.storage_path && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(job)}
                      disabled={downloadingId === job.id}
                    >
                      {downloadingId === job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}