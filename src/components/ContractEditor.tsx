import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Contract } from '@/lib/mockData';
import { Calendar, User, Euro, ArrowUp, ArrowDown, X, Plus, Minus } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { Textarea } from '@/components/ui/textarea';

interface ContractEditorProps {
  contract?: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
}

export function ContractEditor({ contract, isOpen, onClose, onSave }: ContractEditorProps) {
  const { contractTypes, contractModules, globalVariables } = useAdminData();
  const [step, setStep] = useState<'type' | 'modules' | 'details'>('type');
  const [formData, setFormData] = useState<Contract>({
    id: '',
    title: '',
    client: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'draft',
    progress: 0,
    assignedTo: '',
    description: '',
    tags: [],
    globalVariables: {},
    templateVariables: {},
    contractType: undefined,
    lastModified: new Date().toISOString()
  });

  const [selectedModules, setSelectedModules] = useState<Array<{
    moduleKey: string;
    sortOrder: number;
    numberingStyle: string;
  }>>([]);

  useEffect(() => {
    if (contract) {
      setFormData({ ...contract });
      setStep('details');
      // Load selected modules if they exist
      if (contract.contractType) {
        // Load modules for this contract type - simplified for now
        setSelectedModules([
          { moduleKey: 'preamble', sortOrder: 1, numberingStyle: 'none' },
          { moduleKey: 'object_of_agreement', sortOrder: 2, numberingStyle: 'numbered' },
          { moduleKey: 'conditions', sortOrder: 3, numberingStyle: 'numbered' }
        ]);
      }
    } else {
      // Reset form for new contract
      setFormData({
        id: '',
        title: '',
        client: '',
        startDate: '',
        endDate: '',
        value: 0,
        status: 'draft',
        progress: 0,
        assignedTo: '',
        description: '',
        tags: [],
        globalVariables: {},
        templateVariables: {},
        contractType: undefined,
        lastModified: new Date().toISOString()
      });
      setSelectedModules([]);
      setStep('type');
    }
  }, [contract, isOpen]);

  const handleSave = () => {
    const contractToSave = {
      ...formData,
      id: formData.id || `contract-${Date.now()}`,
      selectedModules
    };
    onSave(contractToSave);
    onClose();
  };

  const handleContractTypeSelect = (typeKey: string) => {
    setFormData({ ...formData, contractType: typeKey as any });
    setStep('modules');
  };

  const toggleModule = (moduleKey: string) => {
    setSelectedModules(prev => {
      const exists = prev.find(m => m.moduleKey === moduleKey);
      if (exists) {
        return prev.filter(m => m.moduleKey !== moduleKey);
      } else {
        return [...prev, {
          moduleKey,
          sortOrder: prev.length + 1,
          numberingStyle: 'numbered'
        }];
      }
    });
  };

  const updateModuleOrder = (moduleKey: string, direction: 'up' | 'down') => {
    setSelectedModules(prev => {
      const module = prev.find(m => m.moduleKey === moduleKey);
      if (!module) return prev;
      
      const newOrder = direction === 'up' ? module.sortOrder - 1 : module.sortOrder + 1;
      if (newOrder < 1 || newOrder > prev.length) return prev;
      
      return prev.map(m => {
        if (m.moduleKey === moduleKey) return { ...m, sortOrder: newOrder };
        if (m.sortOrder === newOrder) return { ...m, sortOrder: module.sortOrder };
        return m;
      }).sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  const updateModuleNumbering = (moduleKey: string, style: string) => {
    setSelectedModules(prev =>
      prev.map(m => m.moduleKey === moduleKey ? { ...m, numberingStyle: style } : m)
    );
  };

  const renderModulePreview = (moduleKey: string, module: any) => {
    if (!module) return null;
    
    const selectedModule = selectedModules.find(m => m.moduleKey === moduleKey);
    const numberingStyle = selectedModule?.numberingStyle || 'none';
    const sortOrder = selectedModule?.sortOrder || 1;
    
    const getNumberPrefix = () => {
      switch (numberingStyle) {
        case 'numbered': return `${sortOrder}.`;
        case 'parentheses': return `(${sortOrder})`;
        case 'decimal': return `${sortOrder}.1`;
        case 'bullets': return '•';
        default: return '';
      }
    };
    
    return (
      <Card key={moduleKey} className="mb-4">
        <CardContent className="p-4">
          {/* Two-column German-English layout */}
          <div className="grid grid-cols-2 gap-6 relative">
            {/* German column */}
            <div className="pr-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                {getNumberPrefix() && <span className="text-primary">{getNumberPrefix()}</span>}
                {module.title_de}
              </h4>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {module.content_de?.substring(0, 200)}...
              </div>
            </div>
            
            {/* Separator line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
            
            {/* English column */}
            <div className="pl-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                {getNumberPrefix() && <span className="text-primary">{getNumberPrefix()}</span>}
                {module.title_en}
              </h4>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {module.content_en?.substring(0, 200)}...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}
            {!contract && (
              <div className="flex gap-2 mt-2">
                <Badge variant={step === 'type' ? 'default' : 'secondary'}>1. Typ</Badge>
                <Badge variant={step === 'modules' ? 'default' : 'secondary'}>2. Bausteine</Badge>
                <Badge variant={step === 'details' ? 'default' : 'secondary'}>3. Details</Badge>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Contract Type Selection */}
          {step === 'type' && !contract && (
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold">Vertragstyp auswählen</h3>
              <div className="grid gap-3">
                {contractTypes
                  .filter(type => type.key && type.key.trim() !== '')
                  .map((type) => (
                  <Card 
                    key={type.key} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleContractTypeSelect(type.key)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{type.name_de}</h4>
                      {type.name_en && (
                        <p className="text-sm text-muted-foreground">{type.name_en}</p>
                      )}
                      {type.description && (
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Module Selection */}
          {step === 'modules' && !contract && (
            <div className="space-y-4 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Bausteine auswählen und Formatierung festlegen</h3>
                <Button variant="outline" onClick={() => setStep('details')}>
                  Weiter zu Details
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Available Modules */}
                <div>
                  <h4 className="font-medium mb-3">Verfügbare Bausteine</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {contractModules
                      .filter(module => module.key && module.key.trim() !== '')
                      .map((module) => (
                      <div 
                        key={module.key} 
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedModules.find(m => m.moduleKey === module.key) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleModule(module.key)}
                      >
                        <div className="font-medium text-sm">{module.title_de}</div>
                        <div className="text-xs text-muted-foreground">{module.category}</div>
                        {module.title_en && (
                          <div className="text-xs text-muted-foreground italic">{module.title_en}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Modules */}
                <div>
                  <h4 className="font-medium mb-3">Ausgewählte Bausteine</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedModules
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((selectedModule) => {
                        const module = contractModules.find(m => m.key === selectedModule.moduleKey);
                        return (
                          <div key={selectedModule.moduleKey} className="p-3 border rounded">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-sm">{module?.title_de}</div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateModuleOrder(selectedModule.moduleKey, 'up')}
                                  disabled={selectedModule.sortOrder === 1}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateModuleOrder(selectedModule.moduleKey, 'down')}
                                  disabled={selectedModule.sortOrder === selectedModules.length}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleModule(selectedModule.moduleKey)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Nummerierungsstil</Label>
                              <Select
                                value={selectedModule.numberingStyle}
                                onValueChange={(style) => updateModuleNumbering(selectedModule.moduleKey, style)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Keine Nummerierung</SelectItem>
                                  <SelectItem value="numbered">1. 2. 3. (Nummern)</SelectItem>
                                  <SelectItem value="parentheses">(1) (2) (3) (Klammern)</SelectItem>
                                  <SelectItem value="decimal">1.1 1.2 1.3 (Dezimal)</SelectItem>
                                  <SelectItem value="bullets">• • • (Aufzählung)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </div>

              {/* Preview */}
              {selectedModules.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Vorschau (Deutsch - Englisch)</h4>
                  <div className="border rounded p-4 max-h-60 overflow-y-auto bg-background">
                    {selectedModules
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((selectedModule) => {
                        const module = contractModules.find(m => m.key === selectedModule.moduleKey);
                        return renderModulePreview(selectedModule.moduleKey, module);
                      })
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contract Details - Left/Right Layout */}
          {step === 'details' && (
            <div className="grid grid-cols-2 gap-6 h-[65vh]">
              {/* Left Side - Input Fields */}
              <div className="space-y-4 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold">Vertragsdaten eingeben</h3>
                
                {/* Basic Contract Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Grunddaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-xs">Titel</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client" className="text-xs">Kunde</Label>
                      <Input
                        id="client"
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-xs">Startdatum</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-xs">Enddatum</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value" className="text-xs">Vertragswert (€)</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Global Variables */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Globale Variablen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {globalVariables.slice(0, 8).map((variable) => (
                      <div key={variable.key} className="space-y-2">
                        <Label htmlFor={variable.key} className="text-xs">{variable.name_de}</Label>
                        <Input
                          id={variable.key}
                          type={variable.key.includes('date') ? 'date' : variable.key.includes('email') ? 'email' : 'text'}
                          value={formData.globalVariables?.[variable.key] || variable.default_value || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            globalVariables: {
                              ...formData.globalVariables,
                              [variable.key]: e.target.value
                            }
                          })}
                          placeholder={variable.description || ''}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Module-specific variables */}
                {selectedModules.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Baustein-spezifische Variablen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedModules.map((selectedModule) => {
                        const module = contractModules.find(m => m.key === selectedModule.moduleKey);
                        const moduleVariables = Array.isArray(module?.variables) 
                          ? module.variables 
                          : (module?.variables ? JSON.parse(module.variables as string) : []) || [];
                        
                        if (moduleVariables.length === 0) return null;
                        
                        return (
                          <div key={selectedModule.moduleKey} className="space-y-3 p-3 border rounded bg-muted/20">
                            <h5 className="font-medium text-xs text-muted-foreground">{module?.title_de}</h5>
                            {moduleVariables.map((variable: any) => (
                              <div key={variable.id} className="space-y-2">
                                <Label htmlFor={variable.id} className="text-xs">{variable.label}</Label>
                                <Input
                                  id={variable.id}
                                  type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : variable.type === 'currency' ? 'number' : 'text'}
                                  value={formData.templateVariables?.[variable.id] || variable.value || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    templateVariables: {
                                      ...formData.templateVariables,
                                      [variable.id]: e.target.value
                                    }
                                  })}
                                  className="h-8"
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Side - Live Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 border-b">
                  <h3 className="font-semibold text-sm">Live-Vorschau</h3>
                </div>
                <div className="p-4 overflow-y-auto h-full bg-background">
                  {/* Contract Header */}
                  <div className="mb-6 p-4 bg-muted/30 rounded">
                    <h4 className="font-semibold text-lg">{formData.title || 'Vertragstitel'}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                      <div>
                        <p><strong>Kunde:</strong> {formData.client || formData.globalVariables?.firma || 'Kundenname'}</p>
                        <p><strong>Angebots-Nr.:</strong> {formData.globalVariables?.angebot_nr || 'Q-2025-xxxx'}</p>
                        <p><strong>Datum:</strong> {formData.globalVariables?.datum || new Date().toISOString().split('T')[0]}</p>
                      </div>
                      <div>
                        <p><strong>Laufzeit:</strong> {formData.startDate || 'TT.MM.JJJJ'} - {formData.endDate || 'TT.MM.JJJJ'}</p>
                        <p><strong>Wert:</strong> {formData.value ? `€${formData.value.toLocaleString()}` : 'Vertragswert'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Two-column German-English layout */}
                  <div className="space-y-6">
                    {selectedModules
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((selectedModule) => {
                        const module = contractModules.find(m => m.key === selectedModule.moduleKey);
                        if (!module) return null;
                        
                        const processContent = (content: string) => {
                          let processed = content;
                          // Replace global variables
                          Object.entries(formData.globalVariables || {}).forEach(([key, value]) => {
                            processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
                          });
                          // Replace template variables
                          Object.entries(formData.templateVariables || {}).forEach(([key, value]) => {
                            processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
                          });
                          return processed;
                        };

                        const getNumberPrefix = () => {
                          switch (selectedModule.numberingStyle) {
                            case 'numbered': return `${selectedModule.sortOrder}.`;
                            case 'parentheses': return `(${selectedModule.sortOrder})`;
                            case 'decimal': return `${selectedModule.sortOrder}.1`;
                            case 'bullets': return '•';
                            default: return '';
                          }
                        };
                        
                        return (
                          <div key={selectedModule.moduleKey} className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 gap-0 relative">
                              {/* German column */}
                              <div className="p-4 pr-2">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                                  {getNumberPrefix() && <span className="text-primary">{getNumberPrefix()}</span>}
                                  {module.title_de}
                                </h4>
                                <div 
                                  className="text-sm leading-relaxed prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: processContent(module.content_de || '') }}
                                />
                              </div>
                              
                              {/* Separator line */}
                              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
                              
                              {/* English column */}
                              <div className="p-4 pl-2">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                                  {getNumberPrefix() && <span className="text-primary">{getNumberPrefix()}</span>}
                                  {module.title_en}
                                </h4>
                                <div 
                                  className="text-sm leading-relaxed prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: processContent(module.content_en || '') }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step !== 'type' && !contract && (
            <Button variant="outline" onClick={() => {
              if (step === 'details') setStep('modules');
              else if (step === 'modules') setStep('type');
            }}>
              Zurück
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={step !== 'details' || !formData.title || !formData.client}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}