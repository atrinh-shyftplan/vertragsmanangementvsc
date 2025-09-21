import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database, AttachmentWithModule } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];

interface TemplateBuilderProps {
  contractTypes: ContractType[];
  contractModules: ContractModule[];
  contractCompositions: ContractComposition[];
  onUpdate: () => void;
}

export function TemplateBuilder({ 
  contractTypes, 
  contractModules,
  contractCompositions,
  onUpdate 
}: TemplateBuilderProps) {
  const [selectedContractTypeKey, setSelectedContractTypeKey] = useState('');
  const [selectedModuleKey, setSelectedModuleKey] = useState('');
  const [attachmentsForType, setAttachmentsForType] = useState<Pick<AttachmentWithModule, 'id' | 'module_id'>[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const { toast } = useToast();

  const selectedContractType = contractTypes.find(t => t.key === selectedContractTypeKey);

  useEffect(() => {
    const fetchAttachmentsForFilter = async () => {
      if (!selectedContractType) {
        setAttachmentsForType([]);
        return;
      }
      setLoadingAttachments(true);
      try {
        const { data, error } = await supabase
          .from('attachments')
          .select('id, module_id')
          .eq('contract_type_id', selectedContractType.id);
        if (error) throw error;
        setAttachmentsForType(data || []);
      } catch (error) {
        console.error('Error fetching attachments for filtering:', error);
        toast({ title: 'Fehler', description: 'Wählbare Anhänge konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchAttachmentsForFilter();
  }, [selectedContractType, toast]);

  const addModuleToComposition = async () => {
    if (!selectedContractTypeKey || !selectedModuleKey) {
      toast({ title: 'Fehler', description: 'Bitte Vertragstyp und Modul auswählen.', variant: 'destructive' });
      return;
    }

    const currentCompositions = getCompositionsForType(selectedContractTypeKey);
    const newSortOrder = currentCompositions.length > 0 ? Math.max(...currentCompositions.map(c => c.sort_order || 0)) + 1 : 0;

    try {
      const { error } = await supabase
        .from('contract_compositions')
        .insert([{
          contract_type_key: selectedContractTypeKey,
          module_key: selectedModuleKey,
          sort_order: newSortOrder,
        }]);

      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Modul wurde zur Struktur hinzugefügt.' });
      setSelectedModuleKey('');
      onUpdate();
    } catch (error) {
      console.error('Error adding module to composition:', error);
      toast({ title: 'Fehler', description: 'Modul konnte nicht hinzugefügt werden.', variant: 'destructive' });
    }
  };

  const removeModuleFromComposition = async (compositionId: string) => {
    try {
      const { error } = await supabase.from('contract_compositions').delete().eq('id', compositionId);
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Modul wurde aus der Struktur entfernt.' });
      onUpdate();
    } catch (error) {
      console.error('Error removing module from composition:', error);
      toast({ title: 'Fehler', description: 'Modul konnte nicht entfernt werden.', variant: 'destructive' });
    }
  };

  const updateCompositionOrder = async (compositionId: string, direction: 'up' | 'down') => {
    const compositions = getCompositionsForType(selectedContractTypeKey);
    const currentIndex = compositions.findIndex(c => c.id === compositionId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= compositions.length) return;

    const currentComposition = compositions[currentIndex];
    const targetComposition = compositions[newIndex];

    try {
      // To prevent unique constraint violations, we need to be careful
      // Best way is to update both with their new sort_order values
      const { error } = await supabase.from('contract_compositions').upsert([
        { id: currentComposition.id, sort_order: targetComposition.sort_order },
        { id: targetComposition.id, sort_order: currentComposition.sort_order },
      ]);
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Reihenfolge wurde aktualisiert.' });
      onUpdate();
    } catch (error) {
      console.error('Error updating composition order:', error);
      toast({ title: 'Fehler', description: 'Reihenfolge konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const getCompositionsForType = (typeKey: string) => {
    return contractCompositions
      .filter(c => c.contract_type_key === typeKey)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  const getModuleByKey = (key: string) => contractModules.find(m => m.key === key);

  const attachmentModuleIds = new Set(attachmentsForType.map(a => a.module_id));
  const availableModules = contractModules.filter(m => !attachmentModuleIds.has(m.id));
  const currentCompositionsForType = getCompositionsForType(selectedContractTypeKey);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feste Vertragsstruktur verwalten</CardTitle>
          <CardDescription>
            Definieren Sie die feste, nicht wählbare Reihenfolge von Textbausteinen für einen Vertragstyp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2 md:col-span-1">
              <Label>Vertragstyp auswählen</Label>
              <Select value={selectedContractTypeKey} onValueChange={setSelectedContractTypeKey}>
                <SelectTrigger><SelectValue placeholder="Vertragstyp wählen" /></SelectTrigger>
                <SelectContent>
                  {contractTypes.filter(t => t.key).map(t => (
                    <SelectItem key={t.key} value={t.key}>{t.name_de}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedContractTypeKey && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label>Verfügbare Module hinzufügen</Label>
                  {loadingAttachments ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade Modulfilter...</div>
                  ) : (
                    <Select value={selectedModuleKey} onValueChange={setSelectedModuleKey}>
                      <SelectTrigger><SelectValue placeholder="Modul zur Struktur hinzufügen..." /></SelectTrigger>
                      <SelectContent>
                        {availableModules
                          .filter(m => !currentCompositionsForType.some(c => c.module_key === m.key))
                          .map(m => (
                            <SelectItem key={m.key} value={m.key}>{m.name || m.title_de}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button onClick={addModuleToComposition} disabled={!selectedModuleKey || loadingAttachments}>
                  <Plus className="h-4 w-4 mr-2" /> Hinzufügen
                </Button>
              </div>

              <CardTitle className="text-lg mt-6 mb-4">Aktuelle Struktur für: {selectedContractType?.name_de}</CardTitle>
              {currentCompositionsForType.length === 0 ? (
                <p className="text-muted-foreground">Keine festen Module für diesen Vertragstyp definiert.</p>
              ) : (
                <div className="space-y-3">
                  {currentCompositionsForType.map((composition, index) => {
                    const module = getModuleByKey(composition.module_key);
                    return (
                      <div key={composition.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{module?.name || module?.title_de || composition.module_key}</div>
                            <div className="text-sm text-muted-foreground">Kategorie: {module?.category || 'general'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => updateCompositionOrder(composition.id, 'up')} disabled={index === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => updateCompositionOrder(composition.id, 'down')} disabled={index === currentCompositionsForType.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => removeModuleFromComposition(composition.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}