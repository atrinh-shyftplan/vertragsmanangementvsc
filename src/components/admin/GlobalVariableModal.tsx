import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];
type GlobalVariableInsert = Database['public']['Tables']['global_variables']['Insert'];

interface GlobalVariableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GlobalVariableInsert) => void;
  globalVariable?: GlobalVariable | null;
}

export function GlobalVariableModal({ open, onOpenChange, onSave, globalVariable }: GlobalVariableModalProps) {
  const [formData, setFormData] = useState<GlobalVariableInsert>({
    key: '',
    name_de: '',
    name_en: '',
    description: '',
    default_value: '',
    is_required: false,
    is_active: true,
    category: 'general'
  });

  useEffect(() => {
    if (globalVariable) {
      setFormData({
        key: globalVariable.key,
        name_de: globalVariable.name_de,
        name_en: globalVariable.name_en || '',
        description: globalVariable.description || '',
        default_value: globalVariable.default_value || '',
        is_required: globalVariable.is_required,
        is_active: globalVariable.is_active,
        category: globalVariable.category || 'general'
      });
    } else {
      setFormData({
        key: '',
        name_de: '',
        name_en: '',
        description: '',
        default_value: '',
        is_required: false,
        is_active: true,
        category: 'general'
      });
    }
  }, [globalVariable, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {globalVariable ? 'Variable bearbeiten' : 'Neue Variable erstellen'}
          </DialogTitle>
          <DialogDescription>
            Erstellen oder bearbeiten Sie eine globale Variable für das System.
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
              placeholder="z.B. company_name"
            />
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
              placeholder="Firmenname"
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
              placeholder="Company Name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategorie
            </Label>
            <Select
              value={formData.category || 'general'}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Allgemein</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="vertragskonditionen">Vertragskonditionen</SelectItem>
              </SelectContent>
            </Select>
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
              placeholder="Beschreibung der Variable..."
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="default_value" className="text-right">
              Standardwert
            </Label>
            <Input
              id="default_value"
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              className="col-span-3"
              placeholder="Standardwert..."
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is_required" className="text-right">
              Erforderlich
            </Label>
            <Switch
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
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