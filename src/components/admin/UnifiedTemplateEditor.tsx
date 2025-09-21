import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Eye, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { Database, Attachment, ContractModule, CompositionWithModuleAndAttachment } from '@/integrations/supabase/types';

// Combined type for the editor list
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];

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

  const selectedContractType = contractTypes.find(t => t.key === selectedContractTypeKey);

  // Fetch attachments when contract type changes
  useEffect(() => {
    if (selectedContractType) {
      const fetchCompositions = async (typeId: string) => {
        setLoading(true);
        setError(null);
        try {
          // Schritt 1: Hole die geordnete Liste der Module für diesen Vertragstyp
          const { data: compositionsData, error: compositionsError } = await supabase
            .from('contract_compositions')
            .select('*, contract_modules(*)')
            .eq('contract_type_id', typeId)
            .order('sort_order');

          if (compositionsError) throw compositionsError;

          // Schritt 2: Hole alle zugehörigen Anhänge für diesen Vertragstyp
          const { data: attachmentsData, error: attachmentsError } = await supabase
            .from('attachments')
            .select('*')
            .eq('contract_type_id', typeId);

          if (attachmentsError) throw attachmentsError;

          // Schritt 3: Verknüpfe die Daten im Code
          const attachmentsMap = new Map(
            attachmentsData.map((att) => [att.module_id, att])
          );

          const combinedData = compositionsData.map((comp) => ({
            ...comp,
            attachments: attachmentsMap.get(comp.module_id) || null,
          }));

          setCompositions(combinedData as CompositionWithModuleAndAttachment[]);
        } catch (err) {
          console.error('Fehler beim Laden der Vertragsstruktur:', err);
          setError('Vertragsstruktur konnte nicht geladen werden.');
        } finally {
          setLoading(false);
        }
      };
      fetchCompositions(selectedContractType.id);
    } else {
      setCompositions([]);
    }
  }, [selectedContractType]);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= compositions.length) return;

    const reorderedCompositions = [...compositions];
    [reorderedCompositions[index], reorderedCompositions[newIndex]] = [reorderedCompositions[newIndex], reorderedCompositions[index]];

    const updates = reorderedCompositions.map((item, idx) => ({
      id: item.id,
      sort_order: idx,
    }));

    try {
      const { error } = await supabase.from('contract_compositions').upsert(updates);
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Reihenfolge aktualisiert.' });
      fetchData(); // Refetch all admin data to update the list
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Fehler', description: 'Reihenfolge konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const handleAttachmentTypeChange = async (moduleId: string, newType: 'fest' | 'produkt' | 'zusatz' | 'none') => {
    if (!selectedContractType) return;

    const composition = compositions.find(c => c.module_id === moduleId);
    if (!composition || !composition.contract_modules) return;

    const module = composition.contract_modules;
    const existingAttachment = composition.attachments;

    if (newType === 'none') {
      if (existingAttachment) {
        const { error } = await supabase.from('attachments').delete().eq('id', existingAttachment.id);
        if (error) {
          toast({ title: 'Fehler', description: 'Anhang konnte nicht entfernt werden.', variant: 'destructive' });
        } else {
          toast({ title: 'Erfolg', description: 'Anhang-Eigenschaft entfernt.' });
          if (selectedContractType) fetchData();
        }
      }
    } else {
      const dataToSave = {
        id: existingAttachment?.id,
        contract_type_id: selectedContractType.id,
        module_id: moduleId,
        name: module.name,
        type: newType,
        sort_order: existingAttachment?.sort_order ?? 999,
      };
      const { error } = await supabase.from('attachments').upsert(dataToSave, { onConflict: 'id' });
      if (error) {
        toast({ title: 'Fehler', description: 'Anhang-Typ konnte nicht gespeichert werden.', variant: 'destructive' });
      } else {
        toast({ title: 'Erfolg', description: 'Anhang-Typ gespeichert.' });
        if (selectedContractType) fetchData();
      }
    }
  };

  const handleAddModules = async () => {
    if (!selectedContractTypeKey || modulesToAdd.length === 0) {
      setAddModuleOpen(false);
      return;
    }

    const currentCompositions = compositions;
    let nextSortOrder = currentCompositions.length > 0 ? Math.max(...currentCompositions.map(c => c.sort_order || 0)) + 1 : 0;

    const newCompositions = modulesToAdd.map((moduleKey, index) => {
      const module = contractModules.find(m => m.key === moduleKey);
      if (!module || !selectedContractType) return null;
      return {
        contract_type_id: selectedContractType.id,
        module_id: module.id,
        sort_order: nextSortOrder + index,
        contract_type_key: selectedContractType.key, // Beibehaltung für Kompatibilität, falls noch benötigt
        module_key: module.key, // Beibehaltung für Kompatibilität, falls noch benötigt
      };
    }).filter(Boolean);

    try {
      const { error } = await supabase.from('contract_compositions').insert(newCompositions);
      if (error) throw error;
      toast({ title: 'Erfolg', description: `${newCompositions.length} Modul(e) hinzugefügt.` });
      fetchData();
    } catch (error) {
      console.error('Error adding modules:', error);
      toast({ title: 'Fehler', description: 'Module konnten nicht hinzugefügt werden.', variant: 'destructive' });
    } finally {
      setModulesToAdd([]);
      setAddModuleOpen(false);
    }
  };

  const removeModuleFromComposition = async (compositionId: string) => {
    try {
      const { error } = await supabase.from('contract_compositions').delete().eq('id', compositionId);
      if (error) throw error;
      toast({ title: 'Erfolg', description: 'Modul wurde aus der Struktur entfernt.' });
      fetchData();
    } catch (error) {
      console.error('Error removing module from composition:', error);
      toast({ title: 'Fehler', description: 'Modul konnte nicht entfernt werden.', variant: 'destructive' });
    }
  };

  const availableModulesToAdd = useMemo(() => {
    return contractModules.filter(m => !compositions.some(c => c.contract_modules?.key === m.key));
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

        {selectedContractTypeKey && (loading || adminDataLoading) && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
        }
        {error && <p className="text-destructive text-center py-4">{error}</p>}

        {selectedContractTypeKey && !loading && !adminDataLoading && (
          <div className="space-y-3">
            {compositions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Keine Module für diesen Vertragstyp konfiguriert.</p>
            ) : (
              compositions.map((composition, index) => (
                <div key={composition.id} className="flex items-center justify-between p-3 border rounded-lg gap-4">
                  <div className="flex items-center space-x-3 flex-grow">
                    <Badge variant="outline" className="text-lg">{index + 1}</Badge>
                    <div>
                      <div className="font-medium">{composition.contract_modules?.name || composition.contract_modules?.title_de || 'Unbekanntes Modul'}</div>
                      <div className="text-sm text-muted-foreground">Kategorie: {composition.contract_modules?.category || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {composition.contract_modules?.category === 'anhaenge' && (
                      <Select
                        value={composition.attachments?.type || 'none'}
                        onValueChange={(value) => handleAttachmentTypeChange(composition.module_id, value as any)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Anhang-Typ..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein Anhang</SelectItem>
                          <SelectItem value="fest">Fester Bestandteil</SelectItem>
                          <SelectItem value="produkt">Produkt</SelectItem>
                          <SelectItem value="zusatz">Zusatzleistung</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ChevronUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleMove(index, 'down')} disabled={index === compositions.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => removeModuleFromComposition(composition.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
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
              {availableModulesToAdd.map(module => (
                <div key={module.key} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent">
                  <Checkbox id={`add-module-${module.key}`} checked={modulesToAdd.includes(module.key)} onCheckedChange={(checked) => setModulesToAdd(prev => checked ? [...prev, module.key] : prev.filter(k => k !== module.key))} />
                  <Label htmlFor={`add-module-${module.key}`} className="font-normal flex-1 cursor-pointer">{module.name || module.title_de}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModuleOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAddModules} disabled={modulesToAdd.length === 0}>Hinzufügen</Button>
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