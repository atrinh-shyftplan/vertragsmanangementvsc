import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText, ArrowLeft, Save, X } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';

interface SelectedModule {
  moduleKey: string;
  order: number;
}

interface NewContractEditorProps {
  onClose?: () => void;
}

export default function NewContractEditor({ onClose }: NewContractEditorProps) {
  const { contractTypes, contractModules, contractCompositions, globalVariables } = useAdminData();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showDetails, setShowDetails] = useState(false);

  const handleTypeSelect = (typeKey: string) => {
    setSelectedType(typeKey);
    
    // Reset modules and variables when type changes
    setSelectedModules([]);
    setVariableValues({});
    
    // Get compositions for this type and set as selected modules
    const compositions = contractCompositions
      .filter(comp => comp.contract_type_key === typeKey)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const modules = compositions.map(comp => ({
      moduleKey: comp.module_key,
      order: comp.sort_order
    }));
    
    setSelectedModules(modules);
    setShowDetails(true); // Show details immediately after type selection
    
    console.log('Selected type:', typeKey);
    console.log('Available compositions:', compositions);
    console.log('Selected modules:', modules);
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
    
    return processedContent;
  };

  const renderPreview = () => {
    if (selectedModules.length === 0) {
      return '<p class="text-gray-500">Keine Module ausgewählt</p>';
    }

    let preview = '';
    
    selectedModules
      .sort((a, b) => a.order - b.order)
      .forEach((selectedModule) => {
        const module = contractModules.find(m => m.key === selectedModule.moduleKey);
        if (module) {
          const moduleVariables = Array.isArray(module.variables) 
            ? module.variables 
            : (module.variables ? JSON.parse(module.variables as string) : []) || [];
          
          // Check if content exists (not empty or just whitespace)
          const hasGermanContent = (module.content_de || '').trim().length > 0;
          const hasEnglishContent = (module.content_en || '').trim().length > 0;
          
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
            
            // German column
            preview += `<div class="pr-6 space-y-4">`;
            if (!isHeaderModule) {
              preview += `<h3 class="text-lg font-bold text-gray-800 mb-4">${module.title_de}</h3>`;
            }
            preview += `<div class="text-sm leading-relaxed">${processContent(module.content_de, moduleVariables)}</div>`;
            preview += `</div>`;
            
            // Gray vertical divider line
            if (!isHeaderModule) {
              preview += `<div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2"></div>`;
            }
            
            // English column
            preview += `<div class="pl-6 space-y-4">`;
            if (!isHeaderModule) {
              preview += `<h3 class="text-lg font-bold text-gray-800 mb-4">${module.title_en || module.title_de}</h3>`;
            }
            preview += `<div class="text-sm leading-relaxed">${processContent(module.content_en, moduleVariables)}</div>`;
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
            preview += `</div>`; // Close centering wrapper
          }
          preview += `</div>`;
        }
      });
    
    return preview || '<p class="text-gray-500">Keine Inhalte verfügbar</p>';
  };

  const saveContract = async () => {
    try {
      // For now, just show success message since we don't have a contracts table yet
      toast.success('Vertrag erfolgreich gespeichert');
      
      // Reset form
      setSelectedType('');
      setShowDetails(false);
      setSelectedModules([]);
      setVariableValues({});
      
      // Close modal if callback provided
      onClose?.();
      
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Fehler beim Speichern des Vertrags');
    }
  };

  if (!selectedType || !showDetails) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Neuer Vertrag erstellen</h2>
            <p className="text-muted-foreground mb-6">Wählen Sie einen Vertragstyp aus</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contractTypes.map((type) => (
            <Card 
              key={type.key} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTypeSelect(type.key)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {type.name_de}
                </CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vertrag bearbeiten</h2>
          <p className="text-muted-foreground">
            Typ: {contractTypes.find(t => t.key === selectedType)?.name_de}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedType('');
              setShowDetails(false);
              setSelectedModules([]);
              setVariableValues({});
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <Button onClick={saveContract}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Schließen
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Fields - smaller width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Contract Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Vertragsdaten</CardTitle>
              <CardDescription>
                Grundlegende Informationen zum Vertrag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={variableValues.title || ''}
                  onChange={(e) => setVariableValues(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  placeholder="Vertragstitel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Kunde</Label>
                <Input
                  id="client"
                  value={variableValues.client || ''}
                  onChange={(e) => setVariableValues(prev => ({
                    ...prev,
                    client: e.target.value
                  }))}
                  placeholder="Kundenname"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Startdatum</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={variableValues.start_date || ''}
                    onChange={(e) => setVariableValues(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Enddatum</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={variableValues.end_date || ''}
                    onChange={(e) => setVariableValues(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Vertragswert (€)</Label>
                <Input
                  id="value"
                  type="number"
                  value={variableValues.value || ''}
                  onChange={(e) => setVariableValues(prev => ({
                    ...prev,
                    value: e.target.value
                  }))}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Global Variables */}
          {globalVariables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Globale Variablen</CardTitle>
                <CardDescription>
                  Diese Variablen werden in allen Modulen verwendet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {globalVariables.map((variable) => (
                  <div key={variable.key} className="space-y-2">
                    <Label htmlFor={variable.key}>
                      {variable.name_de || variable.key}
                      {variable.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={variable.key}
                      type="text"
                      value={variableValues[variable.key] || ''}
                      onChange={(e) => setVariableValues(prev => ({
                        ...prev,
                        [variable.key]: e.target.value
                      }))}
                      placeholder={variable.default_value}
                      required={variable.is_required}
                    />
                    {variable.description && (
                      <p className="text-sm text-muted-foreground">{variable.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Module-specific Variables */}
          {selectedModules.map((selectedModule) => {
            const module = contractModules.find(m => m.key === selectedModule.moduleKey);
            const moduleVariables = Array.isArray(module?.variables) 
              ? module.variables 
              : (module?.variables ? JSON.parse(module.variables as string) : []) || [];
            
            if (moduleVariables.length === 0) return null;
            
            return (
              <Card key={selectedModule.moduleKey}>
                <CardHeader>
                  <CardTitle>{module?.title_de}</CardTitle>
                  <CardDescription>
                    Modul-spezifische Variablen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {moduleVariables.map((variable: any) => {
                    const varName = variable.name || variable.key;
                    const varLabel = variable.label || variable.name_de || variable.name || variable.key;
                    const placeholder = variable.placeholder || variable.description || '';
                    if (!varName) return null;
                    return (
                      <div key={varName} className="space-y-2">
                        <Label htmlFor={`${selectedModule.moduleKey}_${varName}`}>
                          {varLabel}
                          {variable.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {variable.type === 'textarea' ? (
                          <Textarea
                            id={`${selectedModule.moduleKey}_${varName}`}
                            value={variableValues[varName] || ''}
                            onChange={(e) => setVariableValues(prev => ({
                              ...prev,
                              [varName]: e.target.value
                            }))}
                            placeholder={placeholder}
                            required={variable.required}
                          />
                        ) : variable.type === 'select' ? (
                          <Select 
                            value={variableValues[varName] || ''} 
                            onValueChange={(value) => setVariableValues(prev => ({
                              ...prev,
                              [varName]: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={placeholder || "Auswählen..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.options?.map((option: string) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`${selectedModule.moduleKey}_${varName}`}
                            type={variable.type || 'text'}
                            value={variableValues[varName] || ''}
                            onChange={(e) => setVariableValues(prev => ({
                              ...prev,
                              [varName]: e.target.value
                            }))}
                            placeholder={placeholder}
                            required={variable.required}
                          />
                        )}
                        {variable.description && (
                          <p className="text-sm text-muted-foreground">{variable.description}</p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Preview Panel - larger width */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live-Vorschau</CardTitle>
              <CardDescription>
                Vorschau des generierten Vertrags - Variable Felder sind gelb markiert
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    /* FORCE BLACK BULLETS AND TEXT IN PREVIEW */
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
                    /* Force all content to be black */
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
                  ${renderPreview()}
                  ` 
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}