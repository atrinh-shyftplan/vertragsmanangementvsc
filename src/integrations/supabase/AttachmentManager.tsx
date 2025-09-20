import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AttachmentWithModule, ContractModule, AttachmentInsert } from '@/integrations/supabase/types';

export function AttachmentManager() {
  const [attachments, setAttachments] = useState<AttachmentWithModule[]>([]);
  const [modules, setModules] = useState<ContractModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<Partial<AttachmentWithModule> | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attachmentsResult, modulesResult] = await Promise.all([
        supabase.from('attachments').select('*, contract_modules(*)').order('sort_order'),
        supabase.from('contract_modules').select('*').order('title_de')
      ]);

      if (attachmentsResult.error) throw attachmentsResult.error;
      setAttachments((attachmentsResult.data as AttachmentWithModule[]) || []);

      if (modulesResult.error) throw modulesResult.error;
      setModules(modulesResult.data || []);

    } catch (error) {
      console.error('Error fetching attachment data:', error);
      toast({ title: 'Fehler', description: 'Anhänge konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (attachment: Partial<AttachmentWithModule> | null = null) => {
    setEditingAttachment(attachment ? { ...attachment } : { name: '', type: 'produkt', module_id: null, sort_order: attachments.length });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingAttachment || !editingAttachment.name || !editingAttachment.type || !editingAttachment.module_id) {
      toast({ title: 'Fehler', description: 'Bitte alle Felder ausfüllen.', variant: 'destructive' });
      return;
    }

    const dataToSave: AttachmentInsert = {
      name: editingAttachment.name,
      type: editingAttachment.type,
      module_id: editingAttachment.module_id,
      sort_order: editingAttachment.sort_order ?? attachments.length,
      id: editingAttachment.id,
    };

    try {
      const { error } = await supabase.from('attachments').upsert(dataToSave, { onConflict: 'id' });
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Anhang wurde gespeichert.' });
      setIsModalOpen(false);
      setEditingAttachment(null);
      fetchData();
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
      fetchData();
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
      fetchData(); // revert
    } else {
      toast({ title: 'Erfolg', description: 'Reihenfolge aktualisiert.' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Vertragsanhänge verwalten</CardTitle>
          <CardDescription>Definieren Sie hier die globalen Vertragsbestandteile und deren zugehörige Textmodule.</CardDescription>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4" /> Neuer Anhang</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
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
          ))}
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAttachment?.id ? 'Anhang bearbeiten' : 'Neuen Anhang erstellen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Anhang-Name</Label>
              <Input id="name" value={editingAttachment?.name || ''} onChange={(e) => setEditingAttachment(p => ({ ...p, name: e.target.value }))} />
            </div>
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
              <Select value={editingAttachment?.module_id || ''} onValueChange={(value) => setEditingAttachment(p => ({ ...p, module_id: value }))}>
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