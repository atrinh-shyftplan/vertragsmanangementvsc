import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';
import type { Database } from '@/integrations/supabase/types';

type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractModuleInsert = Database['public']['Tables']['contract_modules']['Insert'];
type ContractCategory = Database['public']['Tables']['contract_categories']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];

interface ContractModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContractModuleInsert) => void;
  onUpdate?: (data: Partial<ContractModule>) => void;
  contractModule?: ContractModule | null;
  contractCategories: ContractCategory[];
  globalVariables?: GlobalVariable[];
}

export function ContractModuleModal({ open, onOpenChange, onSave, onUpdate, contractModule, contractCategories, globalVariables = [] }: ContractModuleModalProps) {
  const [formData, setFormData] = useState<ContractModuleInsert>({
    key: '',
    name: '',
    title_de: '',
    title_en: '',
    content: '',
    category: 'general',
    is_active: true,
    sort_order: 0,
    variables: null
  });

  const generateKey = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9\s]/gi, '')
      .trim()
      .replace(/\s+/g, '_');
  }, []);

  useEffect(() => {
    if (contractModule) {
      setFormData({
        key: contractModule.key,
        name: contractModule.name || contractModule.title_de || '',
        title_de: contractModule.title_de,
        title_en: contractModule.title_en || '',
        content: contractModule.content || '',
        category: contractModule.category || 'general',
        is_active: contractModule.is_active,
        sort_order: contractModule.sort_order || 0,
        variables: contractModule.variables
      });
    } else {
      setFormData({
        key: '',
        name: '',
        title_de: '',
        title_en: '',
        content: '',
        category: 'general',
        is_active: true,
        sort_order: 0,
        variables: null
      });
    }
  }, [contractModule, open]);

  useEffect(() => {
    // Auto-generate key from name for new modules only
    if (!contractModule && formData.name) {
      const newKey = generateKey(formData.name);
      // Directly update formData to avoid triggering onUpdate in handleChange
      setFormData(prev => ({ ...prev, key: newKey }));
    }
  }, [formData.name, contractModule, generateKey]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const handleChange = (field: keyof ContractModuleInsert, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    if (onUpdate && contractModule) {
      onUpdate({ id: contractModule.id, ...newFormData });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contractModule ? 'Modul bearbeiten' : 'Neues Modul erstellen'}
          </DialogTitle>
          <DialogDescription>
            Erstellen oder bearbeiten Sie ein Vertragsmodul für das System.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4" style={{maxWidth: 'none'}}>
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name des Moduls
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="col-span-5"
              placeholder="z.B. Datenschutz"
            />
          </div>

          {/* Hidden key field to keep it in form state */}
          <div className="hidden">
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="key" className="text-right">
                Schlüssel
              </Label>
              <Input
                id="key"
                value={formData.key}
                readOnly
                className="col-span-5"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="title_de" className="text-right">
              Titel (DE)
            </Label>
            <Input
              id="title_de"
              value={formData.title_de}
              onChange={(e) => handleChange('title_de', e.target.value)}
              className="col-span-5"
              placeholder="Datenschutz"
            />
          </div>
          
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="title_en" className="text-right">
              Titel (EN)
            </Label>
            <Input
              id="title_en"
              value={formData.title_en}
              onChange={(e) => handleChange('title_en', e.target.value)}
              className="col-span-5"
              placeholder="Data Protection"
            />
          </div>
          
          <div className="grid grid-cols-1 items-start gap-2">
            <Label htmlFor="content" className="">
              Inhalt
            </Label>
            <div className="p-8 border rounded-lg bg-white shadow-inner">
              <RichTextEditor
                content={formData.content || ''}
                onChange={(content) => handleChange('content', content)}
                placeholder="Modulinhalt hier einfügen. Für zweisprachige Module bitte eine 2-spaltige Tabelle verwenden."
                className="min-h-[400px]"
                globalVariables={globalVariables.map(v => ({ ...v, category: v.category || 'general' }))}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tipp: Für zweisprachige Inhalte (DE/EN) bitte das Tabellen-Icon oben im Editor verwenden, um eine 2-spaltige Tabelle einzufügen.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Tag
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger className="col-span-5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contractCategories.filter(cat => cat.is_active).map(category => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.name_de}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="sort_order" className="text-right">
              Sortierung
            </Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
              className="col-span-5"
            />
          </div>
          
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="is_active" className="text-right">
              Aktiv
            </Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}