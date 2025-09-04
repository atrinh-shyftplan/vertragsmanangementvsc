import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Move3D } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];

interface ContractCompositionManagerProps {
  contractTypes: ContractType[];
  contractModules: ContractModule[];
  contractCompositions: ContractComposition[];
  onUpdate: () => void;
}

export function ContractCompositionManager({ 
  contractTypes, 
  contractModules, 
  contractCompositions, 
  onUpdate 
}: ContractCompositionManagerProps) {
  const [selectedContractType, setSelectedContractType] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const { toast } = useToast();

  const addModuleToContract = async () => {
    if (!selectedContractType || !selectedModule) {
      toast({
        title: 'Fehler',
        description: 'Bitte Vertragstyp und Modul auswählen.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_compositions')
        .insert([{
          contract_type_key: selectedContractType,
          module_key: selectedModule,
          sort_order: sortOrder
        }]);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Modul wurde zum Vertragstyp hinzugefügt.'
      });

      setSelectedModule('');
      setSortOrder(0);
      onUpdate();
    } catch (error) {
      console.error('Error adding module to contract:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht hinzugefügt werden.',
        variant: 'destructive'
      });
    }
  };

  const removeModuleFromContract = async (compositionId: string) => {
    try {
      const { error } = await supabase
        .from('contract_compositions')
        .delete()
        .eq('id', compositionId);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Modul wurde vom Vertragstyp entfernt.'
      });

      onUpdate();
    } catch (error) {
      console.error('Error removing module from contract:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht entfernt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateSortOrder = async (compositionId: string, newSortOrder: number) => {
    try {
      const { error } = await supabase
        .from('contract_compositions')
        .update({ sort_order: newSortOrder })
        .eq('id', compositionId);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  };

  const getCompositionsForType = (typeKey: string) => {
    return contractCompositions
      .filter(c => c.contract_type_key === typeKey)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  const getModuleByKey = (key: string) => {
    return contractModules.find(m => m.key === key);
  };

  const getContractTypeByKey = (key: string) => {
    return contractTypes.find(t => t.key === key);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vertragszusammensetzung verwalten</CardTitle>
          <CardDescription>
            Definieren Sie, welche Module zu welchem Vertragstyp gehören und in welcher Reihenfolge sie erscheinen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Vertragstyp</Label>
              <Select value={selectedContractType} onValueChange={setSelectedContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Vertragstyp wählen" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map(type => (
                    <SelectItem key={type.key} value={type.key}>
                      {type.name_de}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Modul</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Modul wählen" />
                </SelectTrigger>
                <SelectContent>
                  {contractModules.map(module => (
                    <SelectItem key={module.key} value={module.key}>
                      {module.title_de}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reihenfolge</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={addModuleToContract} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {contractTypes.map(contractType => {
        const compositions = getCompositionsForType(contractType.key);
        
        return (
          <Card key={contractType.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {contractType.name_de}
                <Badge variant="secondary">
                  {compositions.length} Module
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {compositions.length === 0 ? (
                <p className="text-muted-foreground">
                  Keine Module für diesen Vertragstyp definiert.
                </p>
              ) : (
                <div className="space-y-3">
                  {compositions.map((composition, index) => {
                    const module = getModuleByKey(composition.module_key);
                    
                    return (
                      <div key={composition.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Move3D className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={composition.sort_order || 0}
                              onChange={(e) => updateSortOrder(composition.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{module?.title_de || composition.module_key}</div>
                            <div className="text-sm text-muted-foreground">
                              Kategorie: {module?.category || 'general'}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeModuleFromContract(composition.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}