import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, Save, Download, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];

interface TemplateBuilderProps {
  contractTypes: ContractType[];
  contractModules: ContractModule[];
  getModuleByKey: (key: string) => ContractModule | undefined;
  contractCompositions: ContractComposition[];
  globalVariables: GlobalVariable[];
  onUpdate: () => void;
}

export function TemplateBuilder({ 
  contractTypes, 
  contractModules,
  getModuleByKey,
  contractCompositions,
  globalVariables,
  onUpdate 
}: TemplateBuilderProps) {
  const [selectedContractType, setSelectedContractType] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentCompositions, setCurrentCompositions] = useState<ContractComposition[]>([]);
  const { toast } = useToast();

  const getCompositionsForType = (typeKey: string) => {
    return contractCompositions
      .filter(c => c.contract_type_key === typeKey && c.is_active)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  // Load compositions when contract type changes
  React.useEffect(() => {
    if (selectedContractType) {
      const compositions = getCompositionsForType(selectedContractType);
      setCurrentCompositions(compositions);
    } else {
      setCurrentCompositions([]);
    }
  }, [selectedContractType, contractCompositions]);

  const updateCompositionOrder = async (compositionId: string, direction: 'up' | 'down') => {
    const currentIndex = currentCompositions.findIndex(c => c.id === compositionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === currentCompositions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newCompositions = [...currentCompositions];
    [newCompositions[currentIndex], newCompositions[newIndex]] = 
    [newCompositions[newIndex], newCompositions[currentIndex]];

    // Update sort_order for both items
    newCompositions[currentIndex].sort_order = currentIndex;
    newCompositions[newIndex].sort_order = newIndex;

    setCurrentCompositions(newCompositions);

    try {
      // Update both compositions in database
      const { error } = await supabase
        .from('contract_compositions')
        .upsert([
          { 
            id: newCompositions[currentIndex].id,
            sort_order: currentIndex,
            contract_type_key: newCompositions[currentIndex].contract_type_key,
            module_key: newCompositions[currentIndex].module_key
          },
          { 
            id: newCompositions[newIndex].id,
            sort_order: newIndex,
            contract_type_key: newCompositions[newIndex].contract_type_key,
            module_key: newCompositions[newIndex].module_key
          }
        ]);

      if (error) throw error;

      onUpdate(); // Refresh data
    } catch (error) {
      console.error('Error updating composition order:', error);
      toast({
        title: 'Fehler',
        description: 'Reihenfolge konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
      // Revert local state
      setCurrentCompositions(getCompositionsForType(selectedContractType));
    }
  };

  const processContent = (content: string, moduleVariables: any[] = []) => {
    let processedContent = content;
    
    // Replace global variables
    globalVariables.forEach(variable => {
      const value = variableValues[variable.key] || variable.default_value || '';
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    // Replace module-specific variables
    moduleVariables.forEach((variable: any) => {
      const value = variableValues[variable.id] || variable.value || '';
      const regex = new RegExp(`{{${variable.id}}}`, 'g');
      processedContent = processedContent.replace(regex, value.toString());
    });

    return processedContent;
  };

  const renderTemplate = () => {
    if (!selectedContractType) return null;

    const compositions = currentCompositions;
    const contractType = contractTypes.find(t => t.key === selectedContractType);

    return (
      <ScrollArea className="h-full">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold">{contractType?.name_de}</h2>
          <p className="text-muted-foreground">Template Vorschau</p>
        </div>

        {compositions.map((composition) => {
          const module = getModuleByKey(composition.module_key);
          if (!module || !module.is_active) return null;

          const moduleVariables = module.variables ? JSON.parse(module.variables as string) : [];
          const processedContent = processContent(module.content_de, moduleVariables);

          return (
            <div key={composition.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{module.name || module.title_de}</h3>
                <Badge variant="outline">{module.category}</Badge>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                {processedContent}
              </div>
            </div>
          );
        })}
      </ScrollArea>
    );
  };

  const renderVariableInputs = () => {
    if (!selectedContractType) return null;

    const compositions = currentCompositions;
    const allVariables = [...globalVariables];
    
    // Collect module-specific variables
    compositions.forEach(composition => {
      const module = getModuleByKey(composition.module_key);
      if (module?.variables) {
        const moduleVariables = JSON.parse(module.variables as string);
        moduleVariables.forEach((variable: any) => {
          allVariables.push({
            key: variable.id,
            name_de: variable.label,
            default_value: variable.value?.toString() || '',
            is_required: false
          } as GlobalVariable);
        });
      }
    });

    return (
      <div className="space-y-4">
        <h4 className="font-medium">Template-Variablen</h4>
        {allVariables.map(variable => (
          <div key={variable.key} className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{variable.name_de}</Label>
            <Input
              className="col-span-3"
              value={variableValues[variable.key] || ''}
              onChange={(e) => setVariableValues(prev => ({
                ...prev,
                [variable.key]: e.target.value
              }))}
              placeholder={variable.default_value || ''}
            />
          </div>
        ))}
      </div>
    );
  };

  const saveTemplate = async () => {
    if (!selectedContractType || !templateName) {
      toast({
        title: 'Fehler',
        description: 'Bitte Vertragstyp und Template-Name eingeben.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const compositions = currentCompositions;
      const templateData = {
        contractType: selectedContractType,
        modules: compositions.map(comp => ({
          moduleKey: comp.module_key,
          sortOrder: comp.sort_order
        })),
        variables: variableValues,
        generatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contract_templates')
        .insert([{
          name: templateName,
          contract_type_key: selectedContractType,
          template_data: templateData,
          is_default: isDefault
        }]);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Template wurde gespeichert.'
      });

      setTemplateName('');
      setIsDefault(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Fehler',
        description: 'Template konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const exportTemplate = () => {
    if (!selectedContractType) return;

    const compositions = currentCompositions;
    let exportContent = '';

    compositions.forEach(composition => {
      const module = getModuleByKey(composition.module_key);
      if (module) {
        const moduleVariables = module.variables ? JSON.parse(module.variables as string) : [];
        const processedContent = processContent(module.content_de, moduleVariables);
        exportContent += `${module.title_de}\n\n${processedContent}\n\n---\n\n`;
      }
    });

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName || 'vertrag'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Builder</CardTitle>
          <CardDescription>
            Erstellen Sie Templates aus den konfigurierten Modulen und Variablen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
              <Label>Vertragstyp</Label>
              <Select value={selectedContractType} 
                      onValueChange={(value) => {
                        setSelectedContractType(value);
                      }}>
                <SelectTrigger>
                   <SelectValue placeholder="Vertragstyp wählen" >
                    {contractTypes.find(type => type.key === selectedContractType)?.name_de ||
                      "Vertragstyp wählen"}
                  </SelectValue>

                </SelectTrigger>
                <SelectContent>
                  {contractTypes.filter(type => type.key && type.key.trim() !== '').map(type => (
                    <SelectItem key={type.key} value={type.key}>
                      {type.name_de}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template Name eingeben"
              />
            </div>

        
          </div>
        </CardContent>
           <CardFooter className="flex justify-between items-center">
               {/* Buttons */}
              <div className="flex items-center space-x-2">
                 <Button variant="outline" onClick={() => setPreviewMode(!previewMode)} className="hover-scale">
                    <Eye className="h-4 w-4 mr-2" />
                       {previewMode ? 'Bearbeiten' : 'Vorschau'}
                 </Button>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="px-4 hover:bg-accent hover:text-accent-foreground" >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={exportTemplate} disabled={!selectedContractType}>
                         <Download className="h-4 w-4 mr-2" />
                            Exportieren
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsOutlineOpen(true)}>
                         <FileText className="h-4 w-4 mr-2" />
                            Gliederung anzeigen
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>
              <Button onClick={saveTemplate} className="hover-scale"><Save className="h-4 w-4 mr-2" />Template speichern</Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Order Management */}
      {selectedContractType && (
        <Card>
          <CardHeader>
            <CardTitle>Modul-Reihenfolge verwalten</CardTitle>
            <CardDescription>
              Verwenden Sie die Pfeile, um die Reihenfolge der Module zu ändern.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentCompositions.map((composition, index) => {
                const module = getModuleByKey(composition.module_key);
                if (!module) return null;
                
                return (
                  <div key={composition.id} className="flex items-center justify-between p-3 border rounded animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{module.name || module.title_de}</div>
                        <div className="text-sm text-muted-foreground">{module.category}</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCompositionOrder(composition.id, 'up')}
                        disabled={index === 0}
                        className="hover-scale"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCompositionOrder(composition.id, 'down')}
                        disabled={index === currentCompositions.length - 1}
                        className="hover-scale"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {currentCompositions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Keine Module für diesen Vertragstyp konfiguriert
                </div>
              )}
            </div>
          </CardContent>
        </Card>
)}

      {selectedContractType && (
        <Card>
       <CardContent className="pt-6">
          {renderVariableInputs()}
        </CardContent>
      </Card>
      )}

        <Sheet open={isOutlineOpen} onOpenChange={setIsOutlineOpen}>
             <SheetContent className="sm:max-w-[400px]">
               <SheetHeader>
                 <SheetTitle>Gliederung</SheetTitle>
                 <SheetDescription>
                   Automatisch generierte Gliederung des Dokuments.
                 </SheetDescription>
               </SheetHeader>
               <CardContent>
                {currentCompositions.map((composition) => {
                  const module = getModuleByKey(composition.module_key);
                    if (!module) return null;
                return(
                    <div className="space-y-3">
                    {module.name}
                    </div>
                    )})}
               </CardContent>
             </SheetContent>
        </Card>
      )}

      {previewMode && selectedContractType && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Template Vorschau
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderTemplate()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}