import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Copy,
  CheckSquare,
  Square
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VariableInputRenderer } from './VariableInputRenderer';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];

interface SelectedModule {
  moduleKey: string;
  sortOrder: number;
  isSelected: boolean;
}

interface ContractBuilderProps {
  contractTypes: ContractType[];
  contractModules: ContractModule[];
  contractCompositions: ContractComposition[];
  globalVariables: GlobalVariable[];
  onUpdate: () => void;
}

export function ContractBuilder({ 
  contractTypes, 
  contractModules, 
  contractCompositions,
  globalVariables,
  onUpdate 
}: ContractBuilderProps) {
  const [selectedContractType, setSelectedContractType] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Group modules by category
  const modulesByCategory = contractModules.reduce((acc, module) => {
    const category = module.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, ContractModule[]>);

  // Load existing composition when contract type changes
  useEffect(() => {
    if (selectedContractType) {
      const existingCompositions = contractCompositions
        .filter(c => c.contract_type_key === selectedContractType)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      setSelectedModules(
        contractModules.map(module => ({
          moduleKey: module.key,
          sortOrder: existingCompositions.find(c => c.module_key === module.key)?.sort_order || 999,
          isSelected: existingCompositions.some(c => c.module_key === module.key)
        }))
      );
    } else {
      setSelectedModules(
        contractModules.map(module => ({
          moduleKey: module.key,
          sortOrder: 999,
          isSelected: false
        }))
      );
    }
  }, [selectedContractType, contractModules, contractCompositions]);

  const toggleModule = (moduleKey: string) => {
    setSelectedModules(prev => 
      prev.map(sm => 
        sm.moduleKey === moduleKey 
          ? { ...sm, isSelected: !sm.isSelected }
          : sm
      )
    );
  };

  const updateModuleOrder = (moduleKey: string, direction: 'up' | 'down') => {
    setSelectedModules(prev => {
      const selectedOnly = prev.filter(sm => sm.isSelected).sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = selectedOnly.findIndex(sm => sm.moduleKey === moduleKey);
      
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === selectedOnly.length - 1)
      ) {
        return prev;
      }
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const updated = [...selectedOnly];
      [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
      
      return prev.map(sm => {
        const updatedModule = updated.find(u => u.moduleKey === sm.moduleKey);
        return updatedModule 
          ? { ...sm, sortOrder: updated.indexOf(updatedModule) }
          : sm;
      });
    });
  };

  const getModuleByKey = (key: string) => {
    return contractModules.find(m => m.key === key);
  };

  const getSelectedModulesInOrder = () => {
    return selectedModules
      .filter(sm => sm.isSelected)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(sm => getModuleByKey(sm.moduleKey))
      .filter(Boolean) as ContractModule[];
  };

  const processContent = (content: string, moduleVariables: any[] = []) => {
    let processedContent = content;
    
    // Replace global variables
    globalVariables.forEach(variable => {
      const value = variableValues[variable.key] || variable.default_value || `[${variable.name_de}]`;
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    // Replace module-specific variables
    moduleVariables.forEach((variable: any) => {
      const value = variableValues[variable.id] || variable.value || `[${variable.label}]`;
      const regex = new RegExp(`{{${variable.id}}}`, 'g');
      processedContent = processedContent.replace(regex, value.toString());
    });

    return processedContent;
  };

  const saveConfiguration = async () => {
    if (!selectedContractType || !templateName) {
      toast({
        title: 'Fehler',
        description: 'Bitte Vertragstyp und Template-Name eingeben.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Delete existing compositions for this contract type
      await supabase
        .from('contract_compositions')
        .delete()
        .eq('contract_type_key', selectedContractType);

      // Insert new compositions
      const compositionsToInsert = selectedModules
        .filter(sm => sm.isSelected)
        .map(sm => ({
          contract_type_key: selectedContractType,
          module_key: sm.moduleKey,
          sort_order: sm.sortOrder
        }));

      if (compositionsToInsert.length > 0) {
        const { error } = await supabase
          .from('contract_compositions')
          .insert(compositionsToInsert);

        if (error) throw error;
      }

      // Save as template
      const templateData = {
        contractType: selectedContractType,
        selectedModules: selectedModules
          .filter(sm => sm.isSelected)
          .map(sm => ({
            moduleKey: sm.moduleKey,
            sortOrder: sm.sortOrder,
            isSelected: sm.isSelected
          })),
        variables: variableValues,
        generatedAt: new Date().toISOString()
      };

      await supabase
        .from('contract_templates')
        .insert({
          name: templateName,
          contract_type_key: selectedContractType,
          template_data: templateData as any
        });

      toast({
        title: 'Erfolg',
        description: 'Vertragskonfiguration wurde gespeichert.'
      });

      onUpdate();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Fehler',
        description: 'Konfiguration konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const selectAllInCategory = (category: string) => {
    const categoryModules = modulesByCategory[category] || [];
    const allSelected = categoryModules.every(module => 
      selectedModules.find(sm => sm.moduleKey === module.key)?.isSelected
    );

    setSelectedModules(prev => 
      prev.map(sm => {
        const isInCategory = categoryModules.some(cm => cm.key === sm.moduleKey);
        return isInCategory 
          ? { ...sm, isSelected: !allSelected }
          : sm;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Vertrags-Builder</CardTitle>
          <CardDescription>
            Wählen Sie Bausteine aus und definieren Sie die Reihenfolge für Ihren Vertrag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vertragstyp</Label>
              <Select value={selectedContractType} onValueChange={setSelectedContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Vertragstyp wählen" />
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
      </Card>

      {/* Debug Info */}
      {selectedContractType && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">
              <div>Vertragstyp: {selectedContractType}</div>
              <div>Ausgewählte Module: {getSelectedModulesInOrder().length}</div>
              <div className="mt-2">
                Module: {getSelectedModulesInOrder().map(m => m.key).join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedContractType && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Bausteine auswählen
                <Badge variant="secondary">
                  {selectedModules.filter(sm => sm.isSelected).length} ausgewählt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {Object.entries(modulesByCategory).map(([category, modules]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{category}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllInCategory(category)}
                        >
                          Alle {modules.every(m => selectedModules.find(sm => sm.moduleKey === m.key)?.isSelected) ? 'ab' : ''}wählen
                        </Button>
                      </div>
                      
                      {modules.map(module => {
                        const selectedModule = selectedModules.find(sm => sm.moduleKey === module.key);
                        return (
                          <div key={module.key} className="flex items-center space-x-3 p-2 border rounded">
                            <Checkbox
                              checked={selectedModule?.isSelected || false}
                              onCheckedChange={() => toggleModule(module.key)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{module.title_de}</div>
                              <div 
                                className="text-sm text-muted-foreground line-clamp-2"
                                dangerouslySetInnerHTML={{ 
                                  __html: module.content_de.substring(0, 100) + '...' 
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Selected Modules & Order */}
          <Card>
            <CardHeader>
              <CardTitle>Reihenfolge festlegen</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {getSelectedModulesInOrder().map((module, index) => (
                    <div key={module.key} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{module.title_de}</div>
                          <div className="text-sm text-muted-foreground">
                            {module.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateModuleOrder(module.key, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateModuleOrder(module.key, 'down')}
                          disabled={index === getSelectedModulesInOrder().length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleModule(module.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {getSelectedModulesInOrder().length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Keine Bausteine ausgewählt
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      {selectedContractType && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Bearbeitung' : 'Vorschau'}
              </Button>
              
              <div className="space-x-2">
                <Button onClick={saveConfiguration}>
                  <Save className="h-4 w-4 mr-2" />
                  Konfiguration speichern
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && selectedContractType && (
        <Card>
          <CardHeader>
            <CardTitle>Template-Vorschau</CardTitle>
            <CardDescription>
              Ausgewählte Module in der konfigurierten Reihenfolge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Contract Modules */}
              {getSelectedModulesInOrder().map((module, index) => {
                const moduleVariables = module.variables ? JSON.parse(module.variables as string) : [];
                
                return (
                  <div key={module.key} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <h3 className="text-lg font-semibold">{module.title_de}</h3>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: module.content_de }}
                    />
                    {moduleVariables.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Verfügbare Variablen: {moduleVariables.map((v: any) => v.name || v.id).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {getSelectedModulesInOrder().length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Keine Module ausgewählt
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}