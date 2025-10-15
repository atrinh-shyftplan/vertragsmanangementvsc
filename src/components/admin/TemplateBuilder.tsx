import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { EditableModule } from '@/integrations/supabase/types';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export function TemplateBuilder() {
  const [templateTitle, setTemplateTitle] = useState('');
  const [modules, setModules] = useState<EditableModule[]>([]);
  const { toast } = useToast();

  const addModule = () => {
    setModules([...modules, { id: uuidv4(), title: '', content: '' }]);
  };

  const updateModule = (id: string, field: 'title' | 'content', value: string) => {
    setModules(modules.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const removeModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie einen Titel für die Vorlage ein.', variant: 'destructive' });
      return;
    }

    // Remove temporary frontend 'id' before saving to the database
    const modulesToSave = modules.map(({ id, ...rest }) => rest);

    const { error } = await supabase
      .from('contract_templates')
      .insert({
        name: templateTitle,
        // Korrekter Spaltenname ist 'template_data'
        template_data: modulesToSave,
        // You might need a contract_type_key or other fields here
        // For now, we focus on the modules
        contract_type_key: 'default_template' // Placeholder
      });

    if (error) {
      console.error('Error saving template:', error);
      toast({ title: 'Fehler', description: 'Vorlage konnte nicht gespeichert werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Die Vorlage wurde erfolgreich gespeichert.' });
      setTemplateTitle('');
      setModules([]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vorlagen-Builder</CardTitle>
          <CardDescription>
            Erstellen Sie eine neue Vertragsvorlage aus einzelnen Modulen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-8">
            <Label htmlFor="template-title">Titel der Vorlage</Label>
            <Input
              id="template-title"
              placeholder="z.B. Standard-Dienstleistungsvertrag"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            {modules.map((module, index) => (
              <Card key={module.id} className="relative pt-8">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => removeModule(module.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`module-title-${module.id}`}>Modul-Titel #{index + 1}</Label>
                    <Input
                      id={`module-title-${module.id}`}
                      placeholder="z.B. §1 Geltungsbereich"
                      value={module.title}
                      onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`module-content-${module.id}`}>Modul-Inhalt</Label>
                    <RichTextEditor
                      value={module.content}
                      onChange={(value) => updateModule(module.id, 'content', value)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={addModule}>
              <Plus className="h-4 w-4 mr-2" />
              Modul hinzufügen
            </Button>
            <Button onClick={handleSaveTemplate} disabled={modules.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Vorlage speichern
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}