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
    
    // Replace global variables with highlighted spans
    globalVariables.forEach((variable) => {
      const variableName = variable.key;
      const value = variableValues[variableName] || variableName;
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 border-2 border-yellow-400 px-1 rounded">${value}</span>`);
    });
    
    // Replace module-specific variables with highlighted spans
    moduleVariables.forEach((variable) => {
      const variableName = (variable.name || variable.key);
      if (!variableName) return;
      const value = variableValues[variableName] || variableName;
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 border-2 border-yellow-400 px-1 rounded">${value}</span>`);
    });
    
    // Process numbered paragraphs for synchronization
    processedContent = processedContent.replace(/^(\d+(?:\.\d+)*\.?)\s+(.+)/gm, (match, number, text) => {
      return `<div class="sync-paragraph"><span class="sync-number">${number}</span><span class="sync-text">${text}</span></div>`;
    });
    
    return processedContent;
  };

  // Safe JSON parse function to handle empty strings, arrays, and invalid JSON
  const safeJsonParse = (jsonValue: any): any[] => {
    if (!jsonValue) return [];
    if (Array.isArray(jsonValue)) return jsonValue;
    if (typeof jsonValue !== 'string') return [];
    if (jsonValue.trim() === '') return [];
    try {
      const parsed = JSON.parse(jsonValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonValue, error);
      return [];
    }
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
            <div className="space-y-8">
              {getSelectedModulesInOrder().length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Keine Module ausgewählt
                </div>
              ) : (
              <div 
                className="max-w-none whitespace-pre-wrap bg-white p-6 rounded-lg h-[70vh] overflow-y-auto border border-gray-200 shadow-inner contract-preview"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1.6',
                  fontFamily: 'Arial, sans-serif'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: `
                  <style>
                    .header-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 10px 0;
                    }
                    .header-content table td {
                      padding: 8px 12px;
                      vertical-align: top;
                      border: 1px solid #e5e7eb;
                    }
                    .header-content table td:first-child {
                      font-weight: 600;
                      background-color: #f9fafb;
                      width: 40%;
                    }
                    .header-content .company-logo {
                      font-size: 24px;
                      font-weight: bold;
                      color: #1f2937;
                      margin-bottom: 30px;
                    }
                    .header-content .offer-info-block {
                      margin: 25px 0;
                      padding: 15px;
                      background-color: white;
                      border: 1px solid #d1d5db;
                      border-radius: 6px;
                    }
                    .header-content .convenience-block {
                      margin: 25px 0;
                      padding: 15px;
                      background-color: white;
                      border: 1px solid #d1d5db;
                      border-radius: 6px;
                      border-style: dashed;
                    }
                    .header-content .company-section {
                      margin: 30px 0;
                      padding: 20px;
                      background-color: white;
                      border: 1px solid #e5e7eb;
                      border-radius: 8px;
                    }
                    .header-content .company-divider {
                      margin: 40px 0;
                      height: 2px;
                      background-color: #e5e7eb;
                      border-radius: 1px;
                    }
                    .header-content .info-line {
                      display: flex;
                      justify-content: space-between;
                      margin: 8px 0;
                      padding: 6px 10px;
                      background-color: #f8fafc;
                      border-radius: 4px;
                      border-left: 4px solid #3b82f6;
                    }
                    .header-content .info-label {
                      font-weight: 600;
                      color: #374151;
                      min-width: 120px;
                    }
                    .header-content .info-value {
                      color: #1f2937;
                    }
                    .header-content p {
                      margin: 8px 0;
                      line-height: 1.5;
                    }
                    .header-content strong {
                      font-weight: 600;
                    }
                    .header-content .between-text {
                      margin: 30px 0 20px 0;
                      font-size: 14px;
                      color: #6b7280;
                      font-style: italic;
                    }
                    /* Synchronization styles for numbered content */
                    .content-sync-container {
                      display: flex;
                      align-items: stretch;
                    }
                    .content-sync-item {
                      flex: 1;
                      display: flex;
                      flex-direction: column;
                    }
                    .content-sync-item p,
                    .content-sync-item div {
                      margin: 4px 0;
                      line-height: 1.6;
                    }
                    /* Special handling for numbered paragraphs */
                    .sync-paragraph {
                      display: flex;
                      align-items: flex-start;
                      margin: 8px 0;
                      min-height: 1.5em;
                    }
                    .sync-number {
                      font-weight: 600;
                      margin-right: 8px;
                      min-width: 30px;
                      flex-shrink: 0;
                    }
                    .sync-text {
                      flex: 1;
                      line-height: 1.6;
                    }
                    /* List styling for contract preview - FORCE BLACK BULLETS */
                    .contract-preview ul {
                      list-style-type: disc !important;
                      padding-left: 1.5rem !important;
                      margin: 0.5rem 0 !important;
                      color: #000000 !important;
                    }
                    .contract-preview ul li {
                      color: #000000 !important;
                      margin: 0.25rem 0 !important;
                    }
                    .contract-preview ul li::marker {
                      color: #000000 !important;
                      content: "●" !important;
                    }
                    .contract-preview ol {
                      padding-left: 1.5rem !important;
                      margin: 0.5rem 0 !important;
                      color: #000000 !important;
                    }
                    .contract-preview ol li {
                      color: #000000 !important;
                      margin: 0.25rem 0 !important;
                    }
                    .contract-preview p {
                      color: #000000 !important;
                      margin: 0.5rem 0 !important;
                    }
                    /* Force all text content to be black in preview */
                    .contract-preview * {
                      color: #000000 !important;
                    }
                    /* Override any white or transparent colors */
                    .contract-preview li::before {
                      color: #000000 !important;
                    }
                    /* Specific override for list markers */
                    .contract-preview ul > li::marker,
                    .contract-preview ol > li::marker {
                      color: #000000 !important;
                      font-weight: bold !important;
                    }
                  </style>
                  ${(() => {
                    let preview = '';
                    
                     getSelectedModulesInOrder().forEach((module) => {
                       const moduleVariables = safeJsonParse(module.variables);
                      
                      // Check if content exists for each language
                      const hasGermanContent = module.content_de && module.content_de.trim().length > 0;
                      const hasEnglishContent = module.content_en && module.content_en.trim().length > 0;
                      
                      // Special handling for Header Sales module - center it and override prose styles
                      const isHeaderModule = module.key === 'Header Sales';
                      
                      if (isHeaderModule) {
                        preview += `<div class="mb-8 not-prose flex justify-center">`;
                        preview += `<div class="header-content" style="text-align: center; margin: 0 auto; max-width: 800px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: white;">`;
                      } else {
                        preview += `<div class="mb-8">`;
                      }
                      
                      // Case 1: Both German and English content - two-column layout
                      if (hasGermanContent && hasEnglishContent) {
                        preview += `<div class="grid grid-cols-2 gap-0 relative">`;
                        
                        // German column with aligned baseline
                        preview += `<div class="pr-6" style="display: flex; flex-direction: column;">`;
                        if (!isHeaderModule) {
                          preview += `<h3 class="text-lg font-bold text-gray-800 mb-4" style="min-height: 2em; display: flex; align-items: baseline;">${module.title_de}</h3>`;
                        }
                        preview += `<div class="text-sm leading-relaxed" style="flex: 1;">${processContent(module.content_de, moduleVariables)}</div>`;
                        preview += `</div>`;
                        
                        // Gray vertical divider line
                        if (!isHeaderModule) {
                          preview += `<div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2"></div>`;
                        }
                        
                        // English column with aligned baseline
                        preview += `<div class="pl-6" style="display: flex; flex-direction: column;">`;
                        if (!isHeaderModule) {
                          preview += `<h3 class="text-lg font-bold text-gray-800 mb-4" style="min-height: 2em; display: flex; align-items: baseline;">${module.title_en || module.title_de}</h3>`;
                        }
                        preview += `<div class="text-sm leading-relaxed" style="flex: 1;">${processContent(module.content_en, moduleVariables)}</div>`;
                        preview += `</div>`;
                        
                        preview += `</div>`;
                      }
                      // Case 2: Only German content - single-column layout
                      else if (hasGermanContent && !hasEnglishContent) {
                        preview += `<div class="space-y-4">`;
                        if (!isHeaderModule) {
                          preview += `<h3 class="text-lg font-bold text-gray-800 mb-4">${module.title_de}</h3>`;
                        }
                        preview += `<div class="text-sm leading-relaxed">${processContent(module.content_de, moduleVariables)}</div>`;
                        preview += `</div>`;
                      }
                      // Case 3: Only English content - single-column layout
                      else if (!hasGermanContent && hasEnglishContent) {
                        preview += `<div class="space-y-4">`;
                        if (!isHeaderModule) {
                          preview += `<h3 class="text-lg font-bold text-gray-800 mb-4">${module.title_en || module.title_de}</h3>`;
                        }
                        preview += `<div class="text-sm leading-relaxed">${processContent(module.content_en, moduleVariables)}</div>`;
                        preview += `</div>`;
                      }
                      
                      if (isHeaderModule) {
                        preview += `</div>`;
                      }
                      
                      preview += `</div>`;
                    });
                    
                    return preview;
                  })()}
                  ` 
                }}
              />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}