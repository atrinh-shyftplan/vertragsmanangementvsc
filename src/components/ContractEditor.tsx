import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-6">
          {/* Step 1: Contract Type Selection */}
          {step === 'type' && !contract && (
            <div className="space-y-4">
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
            <div className="space-y-4">
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

          {/* Step 3: Contract Details */}
          {step === 'details' && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Grunddaten</TabsTrigger>
                <TabsTrigger value="variables">Variablen</TabsTrigger>
                <TabsTrigger value="preview">Vorschau</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Kunde</Label>
                    <Input
                      id="client"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="pending">Ausstehend</SelectItem>
                        <SelectItem value="draft">Entwurf</SelectItem>
                        <SelectItem value="expired">Abgelaufen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Vertragswert (€)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="progress">Fortschritt (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Startdatum</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Enddatum</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Zugewiesen an</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="variables" className="space-y-6 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Globale Variablen</CardTitle>
                    <CardDescription>
                      Definieren Sie Werte für die Variablen, die in den Bausteinen verwendet werden
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {globalVariables
                      .filter(variable => variable.key && variable.key.trim() !== '')
                      .map((variable) => (
                      <div key={variable.key} className="space-y-2">
                        <Label htmlFor={variable.key}>{variable.name_de}</Label>
                        <Input
                          id={variable.key}
                          value={formData.globalVariables?.[variable.key] || variable.default_value || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            globalVariables: {
                              ...formData.globalVariables,
                              [variable.key]: e.target.value
                            }
                          })}
                          placeholder={variable.description || ''}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Vertragsvorschau (Zweisprachig)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{formData.client || 'Kunde'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formData.startDate ? new Date(formData.startDate).toLocaleDateString('de-DE') : 'Startdatum'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{formData.value || 0}€</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {selectedModules.length > 0 ? (
                        <div className="space-y-4">
                          {selectedModules
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((selectedModule) => {
                              const module = contractModules.find(m => m.key === selectedModule.moduleKey);
                              return renderModulePreview(selectedModule.moduleKey, module);
                            })
                          }
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <p>Keine Module ausgewählt</p>
                          <p className="text-sm">Gehen Sie zurück zum Baustein-Schritt</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {!contract && step !== 'type' && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step === 'details' ? 'modules' : 'type')}
                >
                  Zurück
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={!contract && step !== 'details'}>
                Speichern
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}