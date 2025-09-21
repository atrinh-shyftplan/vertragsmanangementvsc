import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { Database, AttachmentWithModule } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];

interface TemplateBuilderProps {
  contractTypes: ContractType[];
  contractModules: ContractModule[];
  contractCompositions: ContractComposition[];
  globalVariables: GlobalVariable[];
  onUpdate: () => void;
}

export function TemplateBuilder({ 
  contractTypes, 
  contractModules,
  contractCompositions,
  globalVariables,
  onUpdate 
}: TemplateBuilderProps) {
  const [selectedContractTypeKey, setSelectedContractTypeKey] = useState('');
  const [attachmentsForType, setAttachmentsForType] = useState<Pick<AttachmentWithModule, 'id' | 'module_id'>[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddModuleOpen, setAddModuleOpen] = useState(false);
  const [modulesToAdd, setModulesToAdd] = useState<string[]>([]);
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

  const handleAddModules = async () => {
    if (!selectedContractTypeKey || modulesToAdd.length === 0) {
      setAddModuleOpen(false);
      return;
    }

    const currentCompositions = getCompositionsForType(selectedContractTypeKey);
    let nextSortOrder = currentCompositions.length > 0 ? Math.max(...currentCompositions.map(c => c.sort_order || 0)) + 1 : 0;

    const newCompositions = modulesToAdd.map((moduleKey, index) => ({
      contract_type_key: selectedContractTypeKey,
      module_key: moduleKey,
      sort_order: nextSortOrder + index,
    }));

    try {
      const { error } = await supabase.from('contract_compositions').insert(newCompositions);
      if (error) throw error;
      toast({ title: 'Erfolg', description: `${newCompositions.length} Modul(e) hinzugefügt.` });
      onUpdate();
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

  const processPreviewContent = (content: string) => {
    if (!content) return '';
    let processedContent = content;
    globalVariables.forEach(variable => {
      const value = `[${variable.name_de}]`;
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    });
    return processedContent;
  };

  const renderFullPreview = () => {
    if (!selectedContractTypeKey) return '';

    const compositions = getCompositionsForType(selectedContractTypeKey);
    if (compositions.length === 0) return '<p class="text-center text-muted-foreground">Keine Module für diesen Vertragstyp konfiguriert.</p>';

    return compositions.map(composition => {
      const module = getModuleByKey(composition.module_key);
      if (!module) return `<div class="py-4 my-2 border-b border-dashed border-destructive text-destructive"><em>Modul mit Key "${composition.module_key}" nicht gefunden.</em></div>`;

      const germanContent = processPreviewContent(module.content_de);
      const englishContent = processPreviewContent(module.content_en || '');

      let moduleHtml = `<div class="py-4 my-2 border-b">`;
      if (germanContent && englishContent) {
        moduleHtml += `<div class="grid grid-cols-2 gap-6">`;
        moduleHtml += `<div><h3 class="font-bold mb-2">${module.title_de}</h3><div>${germanContent}</div></div>`;
        moduleHtml += `<div><h3 class="font-bold mb-2">${module.title_en || module.title_de}</h3><div>${englishContent}</div></div>`;
        moduleHtml += `</div>`;
      } else {
        moduleHtml += `<h3 class="font-bold mb-2">${module.title_de || module.title_en}</h3>`;
        moduleHtml += `<div>${germanContent || englishContent}</div>`;
      }
      moduleHtml += `</div>`;
      return moduleHtml;
    }).join('');
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-end">
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!selectedContractTypeKey}>
                <Eye className="h-4 w-4 mr-2" /> Vollständige Vorschau
              </Button>
              <Button variant="outline" onClick={() => setAddModuleOpen(true)} disabled={!selectedContractTypeKey || loadingAttachments}>
                <Plus className="h-4 w-4 mr-2" /> Modul hinzufügen
              </Button>
            </div>
          </div>

          {selectedContractTypeKey && (
            <>
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

      <Dialog open={isAddModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Module zur Struktur hinzufügen</DialogTitle>
            <DialogDescription>
              Wählen Sie die Module aus, die Sie zur festen Vertragsstruktur hinzufügen möchten.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 border rounded-md">
            <div className="p-4 space-y-2">
              {availableModules
                .filter(m => !currentCompositionsForType.some(c => c.module_key === m.key))
                .map(module => (
                  <div key={module.key} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent">
                    <Checkbox
                      id={`add-module-${module.key}`}
                      checked={modulesToAdd.includes(module.key)}
                      onCheckedChange={(checked) => {
                        setModulesToAdd(prev =>
                          checked
                            ? [...prev, module.key]
                            : prev.filter(k => k !== module.key)
                        );
                      }}
                    />
                    <Label htmlFor={`add-module-${module.key}`} className="font-normal flex-1 cursor-pointer">
                      {module.name || module.title_de}
                    </Label>
                  </div>
                ))
              }
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
    </div>
  );
}