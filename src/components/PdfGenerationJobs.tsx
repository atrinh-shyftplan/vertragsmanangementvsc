import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, AlertCircle, CheckCircle, Clock, Trash2, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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

type SortKey = 'created_at' | 'filename';
type SortDirection = 'asc' | 'desc';

// Polling-Intervall in Millisekunden (z.B. alle 10 Sekunden)
const POLLING_INTERVAL = 10000;

export function PdfGenerationJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<PdfGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    // Nur beim initialen Laden den Ladezustand anzeigen
    if (jobs.length === 0) setLoading(true);
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
  }, [user, toast, jobs.length]);

  const handleDelete = async (jobToDelete: PdfGenerationJob) => {
    setDeletingId(jobToDelete.id);
    try {
      // Schritt 1: Lösche die Datei aus dem Storage, falls ein Pfad existiert.
      if (jobToDelete.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('pdf_files')
          .remove([jobToDelete.storage_path]);
        
        // Wir loggen den Fehler, brechen aber nicht ab, falls nur die DB-Zeile gelöscht werden soll.
        if (storageError) {
          console.warn(`Konnte die Datei nicht aus dem Storage löschen (vielleicht schon weg?): ${storageError.message}`);
        }
      }

      // Schritt 2: Lösche den Job-Eintrag aus der Datenbank.
      const { error: dbError } = await supabase
        .from('pdf_generation_jobs')
        .delete()
        .eq('id', jobToDelete.id);

      if (dbError) throw dbError;

      toast({ title: "Erfolgreich gelöscht", description: `Der Auftrag "${jobToDelete.filename}" wurde entfernt.` });
      await fetchJobs(); // Liste neu laden
    } catch (error) {
      toast({ title: "Fehler beim Löschen", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // Initiales Laden und Polling-Setup
  useEffect(() => {
    if (user) {
      fetchJobs(); // Sofort laden
      const intervalId = setInterval(fetchJobs, POLLING_INTERVAL); // Polling starten

      // Aufräumen, wenn die Komponente unmountet wird
      return () => clearInterval(intervalId);
    }
  }, [user, fetchJobs]);

  const filteredAndSortedJobs = useMemo(() => {
    return jobs
      .filter(job =>
        job.filename.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        let comparison = 0;
        if (aValue > bValue) {
          comparison = 1;
        } else if (aValue < bValue) {
          comparison = -1;
        }

        return sortDirection === 'desc' ? comparison * -1 : comparison;
      });
  }, [jobs, searchTerm, sortKey, sortDirection]);

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split('-') as [SortKey, SortDirection];
    setSortKey(key);
    setSortDirection(direction);
  };

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Generierte PDFs</CardTitle>
            <CardDescription>Status Ihrer PDF-Exportaufträge. Die Liste aktualisiert sich automatisch.</CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="PDF suchen..."
                  className="pl-10 w-full rounded-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select onValueChange={handleSortChange} defaultValue={`${sortKey}-${sortDirection}`}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sortieren nach..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Datum (Neueste zuerst)</SelectItem>
                  <SelectItem value="created_at-asc">Datum (Älteste zuerst)</SelectItem>
                  <SelectItem value="filename-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="filename-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading && jobs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2">Lade Aufträge...</p>
              </div>
            )}
            {!loading && jobs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>Noch keine PDF-Exporte gestartet.</p>
              </div>
            )}
            {!loading && jobs.length > 0 && filteredAndSortedJobs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>Keine PDFs gefunden, die Ihrer Suche entsprechen.</p>
              </div>
            )}

            {filteredAndSortedJobs.length > 0 && (
              <ul className="space-y-3">
                {filteredAndSortedJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={job.filename}>{job.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        Erstellt: {new Date(job.created_at).toLocaleString('de-DE')}
                      </p>
                      {job.status === 'failed' && job.error_message && (
                        <p className="text-xs text-destructive mt-1" title={`Fehler: ${job.error_message}`}>
                          Fehler: {job.error_message.length > 80 ? `${job.error_message.substring(0, 80)}...` : job.error_message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {getStatusBadge(job.status)}
                      {job.status === 'completed' && job.storage_path && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(job)}
                          disabled={downloadingId === job.id}
                          aria-label="PDF herunterladen"
                        >
                          {downloadingId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive h-8 w-8" aria-label="PDF löschen">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Möchten Sie dieses PDF wirklich löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Diese Aktion kann nicht rückgängig gemacht werden. Das PDF "<strong>{job.filename}</strong>" wird dauerhaft von den Servern entfernt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(job)} disabled={deletingId === job.id} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {deletingId === job.id ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lösche...</>
                          ) : (
                            'Löschen'
                          )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}