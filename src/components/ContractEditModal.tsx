import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract, contractTemplate } from '@/lib/mockData';
import { X } from 'lucide-react';

interface ContractEditModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
}

export function ContractEditModal({ contract, isOpen, onClose, onSave }: ContractEditModalProps) {
  const [formData, setFormData] = React.useState<Contract | null>(null);
  const [newTag, setNewTag] = React.useState('');

  React.useEffect(() => {
    if (contract) {
      setFormData({ ...contract });
    }
  }, [contract]);

  if (!formData) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const updateGlobalVariable = (id: string, value: string | number) => {
    setFormData({
      ...formData,
      globalVariables: {
        ...formData.globalVariables,
        [id]: value
      }
    });
  };

  const updateTemplateVariable = (id: string, value: string | number) => {
    setFormData({
      ...formData,
      templateVariables: {
        ...formData.templateVariables,
        [id]: value
      }
    });
  };

  const renderVariableInput = (variable: any, value: any, onChange: (id: string, value: string | number) => void) => {
    const inputValue = value ?? variable.value ?? '';
    
    switch (variable.type) {
      case 'date':
        return (
          <Input
            type="date"
            value={inputValue}
            onChange={(e) => onChange(variable.id, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => onChange(variable.id, Number(e.target.value))}
          />
        );
      case 'currency':
        return (
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => onChange(variable.id, Number(e.target.value))}
            placeholder="€"
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={inputValue}
            onChange={(e) => onChange(variable.id, e.target.value)}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => onChange(variable.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vertrag bearbeiten</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Grunddaten</TabsTrigger>
            {formData.contractType && (
              <>
                <TabsTrigger value="global">Kundendaten</TabsTrigger>
                <TabsTrigger value="template">Vertragskonditionen</TabsTrigger>
              </>
            )}
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

            <div className="space-y-2">
              <Label>Vertragstyp</Label>
              <Select 
                value={formData.contractType || 'none'} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  contractType: value === 'none' ? undefined : value as 'ep_standard' | 'ep_rollout'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vertragstyp wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Template</SelectItem>
                  {Object.entries(contractTemplate.contractTypes)
                    .filter(([key]) => key && key.trim() !== '')
                    .map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Neuen Tag hinzufügen"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Hinzufügen
                </Button>
              </div>
            </div>
          </TabsContent>

          {formData.contractType && (
            <TabsContent value="global" className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kundendaten</CardTitle>
                  <CardDescription>
                    Globale Variablen für den Vertragstemplate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contractTemplate.globalVariables.map((variable) => (
                    <div key={variable.id} className="space-y-2">
                      <Label htmlFor={variable.id}>{variable.label}</Label>
                      {renderVariableInput(
                        variable, 
                        formData.globalVariables?.[variable.id],
                        updateGlobalVariable
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {formData.contractType && (
            <TabsContent value="template" className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vertragskonditionen</CardTitle>
                  <CardDescription>
                    Spezifische Variablen für {contractTemplate.contractTypes[formData.contractType]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.contractType === 'ep_standard' && contractTemplate.modules.conditions_ep_standard?.variables?.map((variable: any) => (
                    <div key={variable.id} className="space-y-2">
                      <Label htmlFor={variable.id}>{variable.label}</Label>
                      {renderVariableInput(
                        variable, 
                        formData.templateVariables?.[variable.id],
                        updateTemplateVariable
                      )}
                    </div>
                  ))}

                  {formData.contractType === 'ep_rollout' && (
                    <>
                      <h3 className="text-lg font-semibold">POC Phase</h3>
                      {contractTemplate.modules.conditions_ep_rollout_poc?.variables?.map((variable: any) => (
                        <div key={variable.id} className="space-y-2">
                          <Label htmlFor={variable.id}>{variable.label}</Label>
                          {renderVariableInput(
                            variable, 
                            formData.templateVariables?.[variable.id],
                            updateTemplateVariable
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="gueltig_bis">Angebot gültig bis</Label>
                    {renderVariableInput(
                      { id: 'gueltig_bis', type: 'date', value: '2025-09-30' },
                      formData.templateVariables?.['gueltig_bis'],
                      updateTemplateVariable
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}