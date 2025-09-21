import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, FileText } from 'lucide-react';
import type { Database, AttachmentWithModule } from '@/integrations/supabase/types';
import { useAdminData } from '@/hooks/useAdminData';
import { Badge } from '@/components/ui/badge';

type AttachmentInsert = Database['public']['Tables']['attachments']['Insert'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];

type ModuleOption = Pick<ContractModule, 'id' | 'title_de'>;

export function AttachmentManager() {
  const [attachments, setAttachments] = useState<AttachmentWithModule[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<Partial<AttachmentWithModule> | null>(null);
  const { toast } = useToast();

  const { contractTypes, loading: contractTypesLoading, getModuleByKey } = useAdminData();
  const [selectedContractTypeId, setSelectedContractTypeId] = useState<string>('');

  const fetchAttachments = async (contractTypeId: string) => {
    if (!selectedContractTypeId) {
      setAttachments([]);
      return;
    }

    setLoadingAttachments(true);
    setError(null);
    try {
      const { data: attachmentsResult, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*, contract_modules(*)')
        .eq('contract_type_id', contractTypeId)
        .order('sort_order', { ascending: true });

      if (attachmentsError) throw attachmentsError;
      setAttachments((attachmentsResult as AttachmentWithModule[]) || []);
    } catch (error) {
      console.error('Error fetching attachment data:', error);
      const errorMessage = 'Anhänge für diesen Vertragstyp konnten nicht geladen werden.';
      setError(errorMessage);
      toast({ title: 'Fehler', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase.from('contract_modules').select('id, title_de').order('title_de');
        if (error) throw error;
        setModules(data || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast({ title: 'Fehler', description: 'Textmodule konnten nicht geladen werden.', variant: 'destructive' });
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedContractTypeId) {
      fetchAttachments(selectedContractTypeId);
    }
  }, [selectedContractTypeId]);

  const handleOpenModal = (attachment: Partial<AttachmentWithModule> | null = null) => {
    setEditingAttachment(attachment ? { ...attachment } : { name: '', type: 'produkt', module_id: null, sort_order: attachments.length });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingAttachment || !editingAttachment.module_id || !editingAttachment.type) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie ein Textmodul und einen Typ aus.', variant: 'destructive' });
      return;
    }
    if (!selectedContractTypeId) {
      toast({ title: 'Fehler', description: 'Kein Vertragstyp ausgewählt.', variant: 'destructive' });
      return;
    }

    const dataToSave: AttachmentInsert = {
      name: editingAttachment.name,
      type: editingAttachment.type,
      module_id: editingAttachment.module_id,
      sort_order: editingAttachment.sort_order ?? attachments.length,
      id: editingAttachment.id,
      contract_type_id: selectedContractTypeId,
    };

    try {
      const { error } = await supabase.from('attachments').upsert(dataToSave, { onConflict: 'id' });
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Anhang wurde gespeichert.' });
      setIsModalOpen(false);
      setEditingAttachment(null);
      fetchAttachments(selectedContractTypeId);
    } catch (error) {
      console.error('Error saving attachment:', error);
      toast({ title: 'Fehler', description: 'Anhang konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('attachments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Anhang wurde gelöscht.' });
      fetchAttachments(selectedContractTypeId);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({ title: 'Fehler', description: 'Anhang konnte nicht gelöscht werden.', variant: 'destructive' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= attachments.length) return;

    const newAttachments = [...attachments];
    [newAttachments[index], newAttachments[newIndex]] = [newAttachments[newIndex], newAttachments[index]];

    const updates = newAttachments.map((att, idx) => ({ id: att.id, sort_order: idx }));

    setAttachments(newAttachments.map((att, idx) => ({ ...att, sort_order: idx })));

    const { error } = await supabase.from('attachments').upsert(updates);
    if (error) {
      toast({ title: 'Fehler', description: 'Reihenfolge konnte nicht gespeichert werden.', variant: 'destructive' });
      fetchAttachments(selectedContractTypeId); // revert
    } else {
      toast({ title: 'Erfolg', description: 'Reihenfolge aktualisiert.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Vertragsanhänge verwalten</CardTitle>
            <CardDescription>Definieren Sie hier die globalen Vertragsbestandteile pro Vertragstyp.</CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()} disabled={!selectedContractTypeId || loadingAttachments}>
            <Plus className="mr-2 h-4 w-4" /> Neuer Anhang
          </Button>
        </div>
        <div className="pt-4">
          <Label>Vertragstyp auswählen</Label>
          {contractTypesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground mt-2"><Loader2 className="h-4 w-4 animate-spin" /> Lade Vertragstypen...</div>
          ) : (
            <Select value={selectedContractTypeId} onValueChange={setSelectedContractTypeId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Bitte einen Vertragstyp zur Bearbeitung auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{type.name_de}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedContractTypeId ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Kein Vertragstyp ausgewählt</h3>
            <p className="mt-1 text-sm text-gray-500">Bitte wählen Sie oben einen Vertragstyp aus, um dessen Anhänge zu verwalten.</p>
          </div>
        ) : loadingAttachments ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Anhänge werden geladen...
          </div>
        ) : error ? (
          <p className="text-destructive text-center py-8">{error}</p>
        ) : (
          <div className="space-y-2">
            {attachments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <h3 className="mt-2 text-sm font-medium">Keine Anhänge</h3>
                <p className="mt-1 text-sm">Für diesen Vertragstyp sind noch keine Anhänge vorhanden.</p>
                <div className="mt-6">
                  <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Ersten Anhang erstellen
                  </Button>
                </div>
              </div>
            ) : (
              attachments.map((attachment, index) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <Button variant="ghost" size="sm" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ChevronUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleMove(index, 'down')} disabled={index === attachments.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                    </div>
                    <div>
                      <p className="font-medium">{attachment.name} <Badge variant="secondary">{attachment.type}</Badge></p>
                      <p className="text-sm text-muted-foreground">Verknüpftes Modul: {attachment.contract_modules?.title_de || 'Keines'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(attachment)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(attachment.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAttachment?.id ? 'Anhang bearbeiten' : 'Neuen Anhang erstellen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select value={editingAttachment?.type || 'produkt'} onValueChange={(value) => setEditingAttachment(p => ({ ...p, type: value as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fest">Fester Bestandteil</SelectItem>
                  <SelectItem value="produkt">Produkt</SelectItem>
                  <SelectItem value="zusatz">Zusatzleistung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="module_id">Zugehöriges Textmodul</Label>
              <Select value={editingAttachment?.module_id || ''} onValueChange={(value) => {
                const selectedModule = modules.find(m => m.id === value);
                setEditingAttachment(p => ({ ...p, module_id: value, name: selectedModule?.title_de || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Modul auswählen..." /></SelectTrigger>
                <SelectContent>
                  {modules.map(module => <SelectItem key={module.id} value={module.id}>{module.title_de}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}