import { useState, useEffect } from 'react';
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

interface ContractModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContractModuleInsert) => void;
  contractModule?: ContractModule | null;
  contractCategories: ContractCategory[];
  globalVariables?: Array<{key: string; name_de: string; description?: string}>;
  availableProductTags?: string[];
}

type ContractCategory = Database['public']['Tables']['contract_categories']['Row'];

export function ContractModuleModal({ open, onOpenChange, onSave, contractModule, contractCategories, globalVariables = [], availableProductTags = ['core', 'shyftplanner', 'shyftskills'] }: ContractModuleModalProps) {
  const [formData, setFormData] = useState<ContractModuleInsert>({
    key: '',
    title_de: '',
    title_en: '',
    content_de: '',
    content_en: '',
    category: 'general',
    is_active: true,
    sort_order: 0,
    product_tags: ['core']
  });

  useEffect(() => {
    if (contractModule) {
      setFormData({
        key: contractModule.key,
        title_de: contractModule.title_de,
        title_en: contractModule.title_en || '',
        content_de: contractModule.content_de,
        content_en: contractModule.content_en || '',
        category: contractModule.category || 'general',
        is_active: contractModule.is_active,
        sort_order: contractModule.sort_order || 0,
        product_tags: contractModule.product_tags || ['core']
      });
    } else {
      setFormData({
        key: '',
        title_de: '',
        title_en: '',
        content_de: '',
        content_en: '',
        category: 'general',
        is_active: true,
        sort_order: 0,
        product_tags: ['core']
      });
    }
  }, [contractModule, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contractModule ? 'Modul bearbeiten' : 'Neues Modul erstellen'}
          </DialogTitle>
          <DialogDescription>
            Erstellen oder bearbeiten Sie ein Vertragsmodul für das System.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="key" className="text-right">
              Schlüssel
            </Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="col-span-3"
              placeholder="z.B. data_protection"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title_de" className="text-right">
              Titel (DE)
            </Label>
            <Input
              id="title_de"
              value={formData.title_de}
              onChange={(e) => setFormData({ ...formData, title_de: e.target.value })}
              className="col-span-3"
              placeholder="Datenschutz"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title_en" className="text-right">
              Titel (EN)
            </Label>
            <Input
              id="title_en"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              className="col-span-3"
              placeholder="Data Protection"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content_de" className="text-right pt-2">
              Inhalt (DE)
            </Label>
            <div className="col-span-3">
              <RichTextEditor
                content={formData.content_de}
                onChange={(content) => setFormData({ ...formData, content_de: content })}
                placeholder="Deutscher Modulinhalt..."
                className="min-h-[400px]"
                globalVariables={globalVariables}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content_en" className="text-right pt-2">
              Inhalt (EN)
            </Label>
            <div className="col-span-3">
              <RichTextEditor
                content={formData.content_en}
                onChange={(content) => setFormData({ ...formData, content_en: content })}
                placeholder="English module content..."
                className="min-h-[400px]"
                globalVariables={globalVariables}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Tag
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="col-span-3">
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
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sort_order" className="text-right">
              Sortierung
            </Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Produkt-Tags
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Wählen Sie die Produkte aus, für die dieses Modul relevant ist:
              </div>
              {availableProductTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${tag}`}
                    checked={formData.product_tags?.includes(tag) || false}
                    onCheckedChange={(checked) => {
                      const currentTags = formData.product_tags || [];
                      if (checked) {
                        setFormData({ 
                          ...formData, 
                          product_tags: [...currentTags.filter(t => t !== tag), tag] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          product_tags: currentTags.filter(t => t !== tag) 
                        });
                      }
                    }}
                  />
                  <Label htmlFor={`product-${tag}`} className="text-sm">
                    {tag === 'core' ? 'Immer enthalten (Core)' : tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is_active" className="text-right">
              Aktiv
            </Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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