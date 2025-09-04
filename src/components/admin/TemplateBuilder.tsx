import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, Save, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

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
  const [selectedContractType, setSelectedContractType] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const getCompositionsForType = (typeKey: string) => {
    return contractCompositions
      .filter(c => c.contract_type_key === typeKey && c.is_active)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  const getModuleByKey = (key: string) => {
    return contractModules.find(m => m.key === key);
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

    const compositions = getCompositionsForType(selectedContractType);
    const contractType = contractTypes.find(t => t.key === selectedContractType);

    return (
      <div className="space-y-6">
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
                <h3 className="text-lg font-semibold">{module.title_de}</h3>
                <Badge variant="outline">{module.category}</Badge>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                {processedContent}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVariableInputs = () => {
    if (!selectedContractType) return null;

    const compositions = getCompositionsForType(selectedContractType);
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
      const compositions = getCompositionsForType(selectedContractType);
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

    const compositions = getCompositionsForType(selectedContractType);
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

          {selectedContractType && renderVariableInputs()}

          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="is-default">Als Standard-Template markieren</Label>
          </div>

          <div className="flex space-x-2 mt-6">
            <Button onClick={saveTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Template speichern
            </Button>
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Bearbeiten' : 'Vorschau'}
            </Button>
            <Button variant="outline" onClick={exportTemplate} disabled={!selectedContractType}>
              <Download className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewMode && selectedContractType && (
        <Card>
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