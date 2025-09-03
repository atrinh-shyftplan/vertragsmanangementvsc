import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, FileText, Info, Clock, Building2 } from 'lucide-react';
import { Contract } from '@/lib/mockData';
import templateDataRaw from '@/lib/template.json';

// Type the template data properly
const templateData = templateDataRaw as any;

interface ContractEditorProps {
  contract?: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
}

export function ContractEditor({ contract, isOpen, onClose, onSave }: ContractEditorProps) {
  const [selectedContractType, setSelectedContractType] = useState('ep_standard');
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Initialize form values
  const initializeFormValues = () => {
    const allVars = new Set();
    templateData.global_variables.forEach(v => allVars.add(v));
    Object.values(templateData.modules).forEach((module: any) => {
      if (module.variables) {
        module.variables.forEach(v => allVars.add(v));
      }
    });

    const initialValues: Record<string, any> = {};
    Array.from(allVars).forEach((variable: any) => {
      initialValues[variable.id] = variable.value !== undefined ? variable.value : '';
    });
    setFormValues(initialValues);
  };

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        setSelectedContractType(contract.contractType || 'ep_standard');
        setFormValues(contract.globalVariables || {});
      } else {
        setSelectedContractType('ep_standard');
        initializeFormValues();
      }
    }
  }, [contract, isOpen]);

  // Get active modules based on contract type using assembly configuration
  const getActiveModules = () => {
    const modules = [];
    
    // Get the assembly configuration for the selected contract type
    const assembly = templateData.assembly && templateData.assembly[selectedContractType];
    if (!assembly || !assembly.modules) {
      return modules;
    }
    
    // Load modules in the order defined by assembly
    assembly.modules.forEach((moduleKey: string) => {
      if (templateData.modules[moduleKey]) {
        modules.push({ 
          id: moduleKey, 
          ...templateData.modules[moduleKey] 
        });
      }
    });
    
    return modules;
  };

  const activeModules = getActiveModules();
  const activeConfiguratorVariables = activeModules.filter(m => m.variables && m.variables.length > 0);

  // Variable interpolation
  const interpolateContent = (content: string, lang: string = 'de') => {
    if (!content) return '';
    let processedContent = content;
    
    for (const key in formValues) {
      let displayValue = formValues[key];
      const varDefinition = findVariableDefinition(key);

      if (varDefinition) {
        if (varDefinition.type === 'currency' && displayValue) {
          displayValue = formatCurrency(displayValue, lang);
        } else if (varDefinition.type === 'date' && displayValue) {
          displayValue = formatDate(displayValue);
        }
      }
      
      processedContent = processedContent.replace(new RegExp(`{{${key}}}`, 'g'), displayValue || '');
    }
    
    return processedContent;
  };

  const findVariableDefinition = (id: string) => {
    let variable = templateData.global_variables.find(v => v.id === id);
    if (variable) return variable;
    for (const moduleKey in templateData.modules) {
      const module = templateData.modules[moduleKey];
      variable = (module.variables || []).find(v => v.id === id);
      if (variable) return variable;
    }
    return null;
  };

  const formatCurrency = (value: number, lang: string = 'de'): string => {
    const locale = lang === 'de' ? 'de-DE' : 'en-US';
    const num = Number(value);
    if (isNaN(num)) return value?.toString() || '';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleSave = () => {
    const contractToSave: Contract = {
      id: contract?.id || `contract_${Date.now()}`,
      title: formValues.firma ? `${templateData.contractTypes[selectedContractType]} - ${formValues.firma}` : templateData.contractTypes[selectedContractType],
      client: formValues.firma || '',
      status: 'draft',
      value: formValues.std_basispreis || formValues.poc_pauschale || 0,
      startDate: formValues.std_vertragsbeginn || formValues.poc_beginn || new Date().toISOString().split('T')[0],
      endDate: '',
      assignedTo: 'Max Mustermann',
      description: `${templateData.contractTypes[selectedContractType]} Vertrag`,
      tags: [],
      lastModified: new Date().toISOString(),
      progress: 10,
      contractType: selectedContractType as "ep_standard" | "ep_rollout",
      templateVariables: formValues,
      globalVariables: formValues
    };
    onSave(contractToSave);
    onClose();
  };

  const generatePreviewContent = () => {
    return (
      <div className="space-y-6 text-sm">
        {/* Header */}
        <div className="flex justify-end mb-8">
          <div className="flex items-center">
            <img src="/src/assets/shyftplan-logo.svg" alt="shyftplan" className="h-8" />
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-3 gap-6 pb-4 border-b text-xs">
          <div>
            <p><strong>Angebot Nr.:</strong> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.angebot_nr}</span></p>
            <p className="mt-1"><strong>Datum:</strong> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formatDate(formValues.datum)}</span></p>
            <p className="mt-1"><strong>USt-ID / VAT ID:</strong> DE288650176</p>
          </div>
          <div className="text-xs">
            <p><strong>Ansprechpartner shyftplan</strong></p>
            <p className="text-muted-foreground">Max Mustermann</p>
            <p className="text-muted-foreground">xxx@shyftplan.com</p>
            <p className="text-muted-foreground">+49 xxx</p>
          </div>
          <div className="text-xs">
            <p><strong>Bankverbindung</strong></p>
            <p className="text-muted-foreground">Berliner Sparkasse<br/>IBAN: DE41 1005 0000 0190 5628 97<br/>BIC: BELADEBEXXX</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-center mb-6 text-foreground">
          Dienstleistungsvertrag / Service Contract
        </h1>

        {/* Parties */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-2">zwischen / between</p>
            <div className="font-semibold text-foreground">
              <p>shyftplan GmbH</p>
              <p>Ritterstr. 26</p>
              <p>10969 Berlin</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              - nachfolgend "shyftplan" bezeichnet / hereinafter referred to as "shyftplan" -
            </p>
          </div>
          
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-2">und / and</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground w-32 inline-block text-xs">Firma / Company:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.firma}</span></p>
              <p><span className="text-muted-foreground w-32 inline-block text-xs">Ansprechpartner / Contact:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.ansprechpartner}</span></p>
              <p><span className="text-muted-foreground w-32 inline-block text-xs">Straße, Nr. / Street:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.strasse_nr}</span></p>
              <p><span className="text-muted-foreground w-32 inline-block text-xs">PLZ, Stadt / ZIP, City:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.plz_stadt}</span></p>
              <p><span className="text-muted-foreground w-32 inline-block text-xs">Rechnungs-E-Mail / Invoice Email:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.rechnungs_email}</span></p>
              <p><span className="text-muted-foreground w-32 inline-block text-xs">USt-ID / VAT ID:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.ust_id}</span></p>
              
              {(formValues.invoice_strasse_nr || formValues.invoice_plz_stadt) && (
                <div className="pt-3 border-t border-border mt-3">
                  <h4 className="text-xs font-semibold mb-2 text-foreground">Rechnungsadresse / Invoice address (falls abweichend / if different)</h4>
                  <p><span className="text-muted-foreground w-32 inline-block text-xs">Straße, Nr. / Street:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.invoice_strasse_nr}</span></p>
                  <p><span className="text-muted-foreground w-32 inline-block text-xs">PLZ, Stadt / ZIP, City:</span> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30">{formValues.invoice_plz_stadt}</span></p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              - nachfolgend „Kunde" bezeichnet / hereinafter referred to as "customer" -
            </p>
          </div>
        </div>

        {/* Convenience Translation */}
        <div className="text-center text-xs border border-dashed border-muted-foreground/30 p-3 rounded bg-muted/20">
          <p><strong className="text-foreground">Convenience Translation</strong></p>
          <p className="text-muted-foreground">Only the German version of the contract (left bracket) is legally binding. The English version (right bracket) is solely provided for the convenience of shyftplan's English speaking customers.</p>
        </div>

        {/* Dynamic Modules */}
        <div className="relative pb-4 border-b-2 border-foreground">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
          {activeModules.map((mod) => (
            <div key={mod.id} className="mb-6">
              <div className="grid grid-cols-2 gap-6 mb-2">
                <div className="pr-3">
                  {mod.title_de && <h3 className="text-sm font-bold text-foreground mb-2">{mod.title_de}</h3>}
                </div>
                <div className="pl-3">
                  {mod.title_en && <h3 className="text-sm font-bold text-foreground mb-2">{mod.title_en}</h3>}
                </div>
              </div>
              
              {/* Content paragraphs */}
              {(mod.paragraphs_de || mod.paragraphs_en) && (
                <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
                  <div className="pr-3 space-y-3">
                    {mod.paragraphs_de && mod.paragraphs_de.map((para: any, index: number) => (
                      <div key={index}>
                        {para.number && <span className="font-semibold">({para.number}) </span>}
                        <span className="text-muted-foreground">{interpolateContent(para.text, 'de')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pl-3 space-y-3">
                    {mod.paragraphs_en && mod.paragraphs_en.map((para: any, index: number) => (
                      <div key={index}>
                        {para.number && <span className="font-semibold">({para.number}) </span>}
                        <span className="text-muted-foreground">{interpolateContent(para.text, 'en')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Simple content */}
              {(mod.content_de || mod.content_en) && (
                <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
                  <div className="pr-3">
                    {mod.content_de && <div className="text-muted-foreground whitespace-pre-line">{interpolateContent(mod.content_de, 'de')}</div>}
                  </div>
                  <div className="pl-3">
                    {mod.content_en && <div className="text-muted-foreground whitespace-pre-line">{interpolateContent(mod.content_en, 'en')}</div>}
                  </div>
                </div>
              )}

              {/* Variables Display */}
              {mod.variables && mod.variables.length > 0 && (
                <div className="grid grid-cols-2 gap-6 text-sm mt-4 p-4 bg-muted/30 rounded-lg">
                  <div className="pr-3 space-y-1">
                    {mod.variables.map((variable: any) => {
                      const value = formValues[variable.id] || variable.value;
                      let displayValue = value;
                      if (variable.type === 'currency') displayValue = formatCurrency(value);
                      if (variable.type === 'date') displayValue = formatDate(value);
                      return (
                        <p key={variable.id} className="text-foreground">
                          <strong>{variable.label}:</strong> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30 ml-1">{displayValue}</span>
                        </p>
                      );
                    })}
                  </div>
                  <div className="pl-3 space-y-1">
                    {mod.variables.map((variable: any) => {
                      const value = formValues[variable.id] || variable.value;
                      let displayValue = value;
                      if (variable.type === 'currency') displayValue = formatCurrency(value, 'en');
                      if (variable.type === 'date') displayValue = formatDate(value);
                      return (
                        <p key={variable.id} className="text-foreground">
                          <strong>{variable.label}:</strong> <span className="bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm border border-warning/30 ml-1">{displayValue}</span>
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 bg-card border border-border rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-card to-muted/30">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {contract ? 'Vertrag bearbeiten' : 'Vertrags-Konfigurator'}
            </h2>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="border-border hover:bg-muted">
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="flex-1 flex overflow-hidden bg-background">
          {/* Left Panel - Configurator */}
          <div className="w-[480px] flex-shrink-0 border-r border-border bg-gradient-to-b from-card to-muted/20">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Contract Type Selection */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Building2 className="w-5 h-5 text-primary" />
                      Vertragstyp wählen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div>
                      <Label className="text-muted-foreground text-sm font-medium">Typ des Vertrags</Label>
                      <select 
                        value={selectedContractType}
                        onChange={(e) => setSelectedContractType(e.target.value)}
                        className="w-full h-10 px-3 mt-2 rounded-md border border-input bg-muted/50 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                      >
                        {Object.entries(templateData.contractTypes).map(([key, name]) => (
                          <option key={key} value={key}>{String(name)}</option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Global Variables */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Info className="w-5 h-5 text-primary" />
                      Allgemeine Informationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      {templateData.global_variables.map((variable) => (
                        <div key={variable.id}>
                          <Label className="text-muted-foreground text-sm font-medium">{variable.label}</Label>
                           <Input
                             type={variable.type}
                             value={formValues[variable.id] || ''}
                             onChange={(e) => setFormValues(prev => ({ ...prev, [variable.id]: e.target.value }))}
                             className="mt-1 bg-card border-input focus:border-primary focus:bg-card transition-all text-foreground placeholder:text-muted-foreground"
                           />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contract Conditions */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Clock className="w-5 h-5 text-primary" />
                      Vertragskonditionen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {activeConfiguratorVariables.length > 0 ? (
                      <div className="space-y-6">
                        {activeConfiguratorVariables.map((module) => (
                          <div key={module.id}>
                            
                            <div className="grid grid-cols-2 gap-4">
                              {module.variables.map((variable: any) => (
                                <div key={variable.id}>
                                  <Label className="text-muted-foreground text-sm font-medium">{variable.label}</Label>
                                   <Input
                                     type={variable.type}
                                     step={variable.type === 'currency' ? '0.01' : undefined}
                                     value={formValues[variable.id] || variable.value || ''}
                                     onChange={(e) => setFormValues(prev => ({ 
                                       ...prev, 
                                       [variable.id]: variable.type === 'number' || variable.type === 'currency' 
                                         ? Number(e.target.value) || 0 
                                         : e.target.value 
                                     }))}
                                     className="mt-1 bg-card border-input focus:border-primary focus:bg-card transition-all text-foreground placeholder:text-muted-foreground"
                                   />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        Für diesen Vertragstyp sind keine spezifischen Konditionen zu konfigurieren.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
          
          {/* Right Panel - Preview */}
          <div className="flex-1 bg-muted/20">
            <ScrollArea className="h-full">
              <div className="p-8">
                <Card className="shadow-lg border-border max-w-4xl mx-auto bg-card">
                  <CardContent className="p-8">
                    {generatePreviewContent()}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}