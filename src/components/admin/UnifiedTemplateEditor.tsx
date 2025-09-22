import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, Eye, BookOpen, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { Database, Attachment, ContractModule, CompositionWithModuleAndAttachment, ContractComposition } from '@/integrations/supabase/types';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ContractType = Database['public']['Tables']['contract_types']['Row'];

function SortableCompositionItem({ composition, onRemove }: { composition: CompositionWithModuleAndAttachment, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: composition.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="font-semibold text-slate-900">{composition.contract_modules?.name}</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => onRemove(composition.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function UnifiedTemplateEditor() {
  const { contractTypes, contractModules, contractCompositions, globalVariables, loading: adminDataLoading, fetchData } = useAdminData();
  const [selectedContractTypeKey, setSelectedContractTypeKey] = useState<string>('');
  const [compositions, setCompositions] = useState<CompositionWithModuleAndAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModuleOpen, setAddModuleOpen] = useState(false);
  const [modulesToAdd, setModulesToAdd] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor));

  const attachmentConfigurations = useMemo(
    () => compositions.filter(c => c.contract_modules?.category?.toLowerCase() === 'anhang'),
  [compositions]
  );

  const selectedContractType = contractTypes.find(t => t.key === selectedContractTypeKey);

  const fetchCompositions = async (contractType: ContractType) => {
    console.log("SPION: fetchCompositions gestartet für typeKey:", contractType.key);
    setLoading(true);
    setError(null);
    try {
      // Schritt 1: Lade die Struktur (das "Skelett") und verknüpfe es direkt mit den Modul-Details.
      const { data: compositionsData, error: compositionsError } = await supabase
        .from('contract_compositions')
        .select(`*, contract_modules(*)`)
        .eq('contract_type_key', contractType.key) // Hier wird korrekterweise der contract_type_key verwendet
        .order('sort_order');

      if (compositionsError) throw compositionsError;
      console.log("SPION: Compositions mit Modul-Daten (JOIN):", compositionsData);
      
      // Schritt 2: Lade die Konfigurationen für die Anhänge
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .eq('contract_type_id', contractType.id); // Hier wird korrekterweise die contract_type_id verwendet
        
      if (attachmentsError) throw attachmentsError;
      console.log("SPION: Relevante attachmentsData geladen:", attachmentsData);

      // Erstelle eine Nachschlage-Map für die Anhänge
      const attachmentsMap = new Map<string, Attachment>();
      if (attachmentsData) {
        for (const att of attachmentsData) {
          if (att.module_id) {
            attachmentsMap.set(att.module_id, att);
          }
        }
      }
      
      // Schritt 3: Kombiniere die Daten. Funktioniert auch, wenn compositionsData leer ist.
      const combinedData = (compositionsData || []).map((comp) => {
        const moduleData = Array.isArray(comp.contract_modules) ? comp.contract_modules[0] : comp.contract_modules;
        
        return {
          ...comp,
          contract_modules: moduleData || null,
          attachments: moduleData ? attachmentsMap.get(moduleData.id) || null : null,
        };
      });
      
      console.log("SPION: Final kombinierte Daten für die UI:", combinedData);
      setCompositions(combinedData as any);

    } catch (err: any) {
      console.error('Fehler beim Laden der Vertragsstruktur:', err);
      setError(`Vertragsstruktur konnte nicht geladen werden: ${err.message}`);
      console.log("SPION: FEHLER!", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedContractType && !adminDataLoading) {
      fetchCompositions(selectedContractType); // Übergebe das ganze Objekt
    } else {
      setCompositions([]);
    }
  }, [selectedContractType, adminDataLoading]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = compositions.findIndex((c) => c.id === active.id);
      const newIndex = compositions.findIndex((c) => c.id === over.id);

      const reorderedCompositions = arrayMove(compositions, oldIndex, newIndex);
      setCompositions(reorderedCompositions);

      // Erstelle einen vollständigen Datensatz für jede Zeile, die aktualisiert wird.
      // Dies gibt Supabase den vollen Kontext und vermeidet Fehler.
      const updates = reorderedCompositions.map((item, index) => ({
        id: item.id,
        sort_order: index,
        contract_type_key: item.contract_type_key,
        module_key: item.module_key,
        contract_type_id: item.contract_type_id,
        // Wichtig: module_id ist hier absichtlich nicht enthalten, da es diese Spalte nicht gibt.
      }));

      // Wir verwenden 'upsert', was eine robuste Methode für Updates ist.
      const { error } = await supabase
        .from('contract_compositions')
        .upsert(updates);

      if (error) {
        console.error("Fehler beim Speichern der Reihenfolge:", error);
        toast({
          title: 'Fehler',
          description: `Die neue Reihenfolge konnte nicht gespeichert werden: ${error.message}`,
          variant: 'destructive',
        });
        
        if (selectedContractType) {
          fetchCompositions(selectedContractType);
        }
      } else {
        toast({ title: 'Erfolg', description: 'Reihenfolge aktualisiert.' });
      }
    }
  };

  const handleAttachmentTypeChange = async (
    moduleKey: string,
    type: 'fest' | 'produkt' | 'zusatz' | 'none'
  ) => {
    if (!selectedContractType) return;

    const module = contractModules.find(m => m.key === moduleKey);
    if (!module) {
      toast({ title: 'Fehler', description: 'Modul nicht gefunden.', variant: 'destructive' });
      return;
    }

    const existingAttachment = compositions.find(c => c.module_key === moduleKey)?.attachments;

    if (type === 'none') {
      // Lösche den Anhang, wenn "Kein Anhang" ausgewählt wird
      if (existingAttachment) {
        const { error } = await supabase.from('attachments').delete().eq('id', existingAttachment.id);
        if (error) toast({ title: 'Fehler beim Löschen', description: error.message, variant: 'destructive' });
      }
    } else {
      // Erstelle oder aktualisiere den Anhang
      const { error } = await supabase.from('attachments').upsert({
        id: existingAttachment?.id,
        contract_type_id: selectedContractType.id,
        module_id: module.id,
        name: module.name,
        type: type,
        sort_order: compositions.findIndex(c => c.module_key === moduleKey)
      });
      if (error) toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    }

    // Lade die Daten neu, um die UI zu aktualisieren
    fetchCompositions(selectedContractType);
    toast({
      title: 'Erfolg',
      description: 'Anhang-Typ wurde gespeichert.',
    });
  };

  const handleAddModules = async (selectedModuleIds: string[]) => {
    if (!selectedContractType) return;

    const newCompositions = selectedModuleIds.map((moduleId, index) => {
      const module = contractModules.find(m => m.id === moduleId);
      if (!module) return null;
      return {
        contract_type_id: selectedContractType.id,
        sort_order: compositions.length + index,
        contract_type_key: selectedContractType.key,
        module_key: module.key,
      };
    }).filter(Boolean) as ContractComposition[];

    const { error } = await supabase
      .from('contract_compositions')
      .insert(newCompositions);

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Module konnten nicht hinzugefügt werden.',
        variant: 'destructive',
      });
      console.error(error);
    } else {
      toast({
        title: 'Erfolg',
        description: 'Module wurden hinzugefügt.',
      });
      // WICHTIG: Lade die Daten neu, um die Ansicht zu aktualisieren
      fetchCompositions(selectedContractType);
    }
    setAddModuleOpen(false);
  };

  const removeModuleFromComposition = async (compositionId: string) => {
    try {
      const { error } = await supabase.from('contract_compositions').delete().eq('id', compositionId);
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Modul wurde aus der Struktur entfernt.' });
      if (selectedContractType) fetchCompositions(selectedContractType);
    } catch (error) {
      console.error('Error removing module from composition:', error);
      toast({ title: 'Fehler', description: 'Modul konnte nicht entfernt werden.', variant: 'destructive' });
    }
  };

  const availableModulesToAdd = useMemo(() => {
    return contractModules.filter(m => !compositions.some(c => c.module_key === m.key));
  }, [contractModules, compositions]);

  const processPreviewContent = (content: string, module: ContractModule | undefined) => {
    if (!content || !module) return '';
    let processedContent = content;

    const allVars = [...globalVariables];
    if (module.variables) {
      try {
        const moduleVars = Array.isArray(module.variables) ? module.variables : JSON.parse(module.variables as string);
        moduleVars.forEach((v: any) => allVars.push({
            key: v.key, name_de: v.name_de,
            category: '',
            created_at: '',
            created_by: '',
            default_value: '',
            description: '',
            id: '',
            is_active: false,
            is_required: false,
            name_en: '',
            updated_at: ''
        }));
      } catch (e) { /* ignore */ }
    }

    allVars.forEach(variable => {
      const value = `[${variable.name_de}]`;
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    });
    return processedContent;
  };

  const renderFullPreview = () => {
    if (!selectedContractTypeKey) return '';
    return compositions.map(({ contract_modules: module }) => {
      if (!module) return `<div class="py-4 my-2 border-b border-dashed border-destructive text-destructive"><em>Modul nicht gefunden.</em></div>`;

      const germanContent = processPreviewContent(module.content_de, module);
      const englishContent = processPreviewContent(module.content_en || '', module);

      let moduleHtml = `<div class="py-4 my-2 border-b">`;
      if (germanContent && englishContent) {
        moduleHtml += `<div class="grid grid-cols-2 gap-6"><div><h3 class="font-bold mb-2">${module.title_de}</h3><div>${germanContent}</div></div><div><h3 class="font-bold mb-2">${module.title_en || module.title_de}</h3><div>${englishContent}</div></div></div>`;
      } else {
        moduleHtml += `<h3 class="font-bold mb-2">${module.title_de || module.title_en}</h3><div>${germanContent || englishContent}</div>`;
      }
      moduleHtml += `</div>`;
      return moduleHtml;
    }).join('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified Template Editor</CardTitle>
        <CardDescription>
          Verwalten Sie die feste Struktur und die wählbaren Anhänge für einen Vertragstyp an einem Ort.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-end">
          <div className="space-y-2">
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!selectedContractTypeKey}>
              <Eye className="h-4 w-4 mr-2" /> Vollständige Vorschau
            </Button>
            <Button variant="default" onClick={() => setAddModuleOpen(true)} disabled={!selectedContractTypeKey}>
              <Plus className="h-4 w-4 mr-2" /> Modul hinzufügen
            </Button>
          </div>
        </div>

        {selectedContractTypeKey && (
          loading ? (
            <p>Lade Vertragsstruktur...</p>
          ) : compositions.length > 0 ? (
            <div className="space-y-8">
              {/* Section 1: Module Order */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Reihenfolge aller Bausteine</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={compositions} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {compositions.map((composition) => (
                        <SortableCompositionItem key={composition.id} composition={composition} onRemove={removeModuleFromComposition} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Section 2: Attachment Configuration */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Konfiguration der wählbaren Anhänge</h3>
                <div className="space-y-2">
                  {attachmentConfigurations.map((composition) => (
                    <div key={composition.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-800">{composition.contract_modules?.name}</span>
                      <Select
                        value={composition.attachments?.type || 'none'}
                        onValueChange={(value) =>
                          handleAttachmentTypeChange(
                            composition.module_key,
                            value as 'fest' | 'produkt' | 'zusatz' | 'none'
                          )
                        }
                      >
                        <SelectTrigger className="w-[240px] bg-white">
                          <SelectValue placeholder="Anhang-Typ festlegen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein Anhang (Standard)</SelectItem>
                          <SelectItem value="fest">Fester Bestandteil</SelectItem>
                          <SelectItem value="produkt">Produkt (wählbar)</SelectItem>
                          <SelectItem value="zusatz">Zusatzleistung (optional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Für diesen Vertragstyp wurden noch keine Module hinzugefügt.</p>
              <Button onClick={() => setAddModuleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Modul hinzufügen
              </Button>
            </div>
          )
        )}
      </CardContent>

      <Dialog open={isAddModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Module zur Struktur hinzufügen</DialogTitle>
            <DialogDescription>Wählen Sie die Module aus, die Sie zur festen Vertragsstruktur hinzufügen möchten.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 border rounded-md">
            <div className="p-4 space-y-2">
              {availableModulesToAdd.map(m => (
                <div key={m.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent">
                  <Checkbox id={`add-module-${m.id}`} checked={modulesToAdd.includes(m.id)} onCheckedChange={(checked) => setModulesToAdd(prev => checked ? [...prev, m.id] : prev.filter(id => id !== m.id))} />
                  <Label htmlFor={`add-module-${m.id}`} className="font-normal flex-1 cursor-pointer">{m.name || m.title_de}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModuleOpen(false)}>Abbrechen</Button>
            <Button onClick={() => handleAddModules(modulesToAdd)} disabled={modulesToAdd.length === 0}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Vollständige Vorschau: {selectedContractType?.name_de}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow border rounded-md">
            <div className="p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderFullPreview() }} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}