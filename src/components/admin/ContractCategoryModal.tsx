import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Database } from '@/integrations/supabase/types';

type ContractCategory = Database['public']['Tables']['contract_categories']['Row'];
type ContractCategoryInsert = Database['public']['Tables']['contract_categories']['Insert'];

interface ContractCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContractCategoryInsert) => void;
  contractCategory?: ContractCategory | null;
}

export function ContractCategoryModal({ open, onOpenChange, onSave, contractCategory }: ContractCategoryModalProps) {
  const [formData, setFormData] = useState<ContractCategoryInsert>({
    key: '',
    name_de: '',
    name_en: '',
    description: '',
    color: '#6b7280',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    if (contractCategory) {
      setFormData({
        key: contractCategory.key,
        name_de: contractCategory.name_de,
        name_en: contractCategory.name_en || '',
        description: contractCategory.description || '',
        color: contractCategory.color || '#6b7280',
        sort_order: contractCategory.sort_order || 0,
        is_active: contractCategory.is_active
      });
    } else {
      setFormData({
        key: '',
        name_de: '',
        name_en: '',
        description: '',
        color: '#6b7280',
        sort_order: 0,
        is_active: true
      });
    }
  }, [contractCategory, open]);

  const handleSave = () => {
    if (!formData.name_de.trim()) {
      return; // Basic validation
    }
    
    // Auto-generate key from name if not provided or if creating new category
    const finalKey = formData.key.trim() || 
      formData.name_de.toLowerCase()
        .replace(/[^a-z0-9äöüß\s]/gi, '')
        .replace(/[äöüß]/g, (char) => {
          const map: { [key: string]: string } = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
          return map[char] || char;
        })
        .replace(/\s+/g, '_');
    
    onSave({ ...formData, key: finalKey });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {contractCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen'}
          </DialogTitle>
          <DialogDescription>
            Erstellen oder bearbeiten Sie eine Kategorie für Vertragsmodule.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="key" className="text-right">
              Schlüssel (optional)
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="Wird automatisch generiert"
                disabled={!!contractCategory} // Prevent editing key for existing categories
              />
              {!contractCategory && (
                <p className="text-xs text-muted-foreground">
                  Leer lassen für automatische Generierung aus dem Namen
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name_de" className="text-right">
              Name (DE)
            </Label>
            <Input
              id="name_de"
              value={formData.name_de}
              onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
              className="col-span-3"
              placeholder="Datenschutz"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name_en" className="text-right">
              Name (EN)
            </Label>
            <Input
              id="name_en"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              className="col-span-3"
              placeholder="Data Protection"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Beschreibung
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
              placeholder="Beschreibung der Kategorie..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Farbe
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1"
                placeholder="#6b7280"
              />
            </div>
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
              min={0}
            />
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