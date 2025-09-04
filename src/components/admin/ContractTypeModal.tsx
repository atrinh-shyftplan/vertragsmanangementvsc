import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractTypeInsert = Database['public']['Tables']['contract_types']['Insert'];

interface ContractTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContractTypeInsert) => void;
  contractType?: ContractType | null;
}

export function ContractTypeModal({ open, onOpenChange, onSave, contractType }: ContractTypeModalProps) {
  const [formData, setFormData] = useState<ContractTypeInsert>({
    key: '',
    name_de: '',
    name_en: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (contractType) {
      setFormData({
        key: contractType.key,
        name_de: contractType.name_de,
        name_en: contractType.name_en || '',
        description: contractType.description || '',
        is_active: contractType.is_active
      });
    } else {
      setFormData({
        key: '',
        name_de: '',
        name_en: '',
        description: '',
        is_active: true
      });
    }
  }, [contractType, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {contractType ? 'Vertragstyp bearbeiten' : 'Neuen Vertragstyp erstellen'}
          </DialogTitle>
          <DialogDescription>
            Erstellen oder bearbeiten Sie einen Vertragstyp für das System.
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
              placeholder="z.B. employment"
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
              placeholder="Arbeitsvertrag"
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
              placeholder="Employment Contract"
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
              placeholder="Beschreibung des Vertragstyps..."
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