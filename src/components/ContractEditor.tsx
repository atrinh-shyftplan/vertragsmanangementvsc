import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';
import { Contract, contractTemplate } from '@/lib/mockData';

interface ContractEditorProps {
  contract?: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
}

export function ContractEditor({ contract, isOpen, onClose, onSave }: ContractEditorProps) {
  const [formData, setFormData] = useState<Contract>({
    id: '',
    title: '',
    client: '',
    status: 'draft',
    value: 0,
    startDate: '',
    endDate: '',
    assignedTo: '',
    description: '',
    tags: [],
    lastModified: new Date().toISOString(),
    progress: 0,
    contractType: 'ep_standard',
    globalVariables: {},
    templateVariables: {}
  });

  useEffect(() => {
    if (contract) {
      setFormData(contract);
    } else {
      // Reset for new contract
      const newContract: Contract = {
        id: Date.now().toString(),
        title: '',
        client: '',
        status: 'draft',
        value: 0,
        startDate: '',
        endDate: '',
        assignedTo: '',
        description: '',
        tags: [],
        lastModified: new Date().toISOString(),
        progress: 0,
        contractType: 'ep_standard',
        globalVariables: {},
        templateVariables: {}
      };
      
      // Initialize with default values from template
      const defaultGlobalVars: Record<string, any> = {};
      contractTemplate.globalVariables.forEach(variable => {
        defaultGlobalVars[variable.id] = variable.value;
      });
      
      const defaultTemplateVars: Record<string, any> = {};
      const moduleKey = `conditions_${newContract.contractType}`;
      if (contractTemplate.modules[moduleKey]) {
        contractTemplate.modules[moduleKey].variables.forEach((variable: any) => {
          defaultTemplateVars[variable.id] = variable.value;
        });
      }
      
      newContract.globalVariables = defaultGlobalVars;
      newContract.templateVariables = defaultTemplateVars;
      setFormData(newContract);
    }
  }, [contract, isOpen]);

  const handleSave = () => {
    const updatedContract = {
      ...formData,
      lastModified: new Date().toISOString()
    };
    onSave(updatedContract);
    onClose();
  };

  const updateGlobalVariable = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      globalVariables: {
        ...prev.globalVariables,
        [key]: value
      }
    }));
  };

  const updateTemplateVariable = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      templateVariables: {
        ...prev.templateVariables,
        [key]: value
      }
    }));
  };

  const renderVariableInput = (variable: any, value: any, onChange: (value: any) => void) => {
    switch (variable.type) {
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        );
      case 'currency':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="Betrag in EUR"
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="name@example.com"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const generatePreviewContent = () => {
    const contractTypeName = contractTemplate.contractTypes[formData.contractType || 'ep_standard'];
    
    return `
VERTRAGSANGEBOT

${contractTypeName}

Angebot Nr.: ${formData.globalVariables?.angebot_nr || ''}
Datum: ${formatDate(formData.globalVariables?.datum || '')}

Kunde:
${formData.globalVariables?.firma || ''}
${formData.globalVariables?.ansprechpartner || ''}
${formData.globalVariables?.strasse_nr || ''}
${formData.globalVariables?.plz_stadt || ''}

${formData.contractType === 'ep_standard' ? `
(3) Vertragskonditionen

Vertragsbeginn: ${formatDate(formData.templateVariables?.std_vertragsbeginn || '')}
Vertragslaufzeit: ${formData.templateVariables?.std_vertragslaufzeit || ''} Jahre
Anzahl User-Lizenzen: ${formData.templateVariables?.std_lizenzen || ''}
Jährlicher Basispreis: ${formatCurrency(formData.templateVariables?.std_basispreis || 0)}
Preis pro zusätzlicher Lizenz p.a.: ${formatCurrency(formData.templateVariables?.std_zusatzlizenz || 0)}
` : ''}

Gesamtwert: ${formatCurrency(formData.value || 0)}

§4 Sonstige Vereinbarungen
Angebot gültig bis: ${formatDate(formData.templateVariables?.gueltig_bis || '')}
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 bg-background border rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {contract ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}
          </h2>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>
            <Button variant="outline" onClick={onClose} size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-1/2 border-r">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Grunddaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titel</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Vertragsbezeichnung"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contractType">Vertragstyp</Label>
                      <Select 
                        value={formData.contractType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(contractTemplate.contractTypes).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="value">Gesamtwert</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Global Variables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kundendaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contractTemplate.globalVariables.map((variable) => (
                      <div key={variable.id}>
                        <Label htmlFor={variable.id}>{variable.label}</Label>
                        {renderVariableInput(
                          variable,
                          formData.globalVariables?.[variable.id],
                          (value) => updateGlobalVariable(variable.id, value)
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Template Variables */}
                {formData.contractType && contractTemplate.modules[`conditions_${formData.contractType}`] && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {contractTemplate.modules[`conditions_${formData.contractType}`].title_de}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {contractTemplate.modules[`conditions_${formData.contractType}`].variables.map((variable: any) => (
                        <div key={variable.id}>
                          <Label htmlFor={variable.id}>{variable.label}</Label>
                          {renderVariableInput(
                            variable,
                            formData.templateVariables?.[variable.id],
                            (value) => updateTemplateVariable(variable.id, value)
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2">
            <ScrollArea className="h-full">
              <div className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vorschau</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {generatePreviewContent()}
                      </pre>
                    </div>
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