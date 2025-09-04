import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye,
  FileText,
  HardDrive,
  Blocks,
  Palette,
  Loader2
} from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { ContractTypeModal } from '@/components/admin/ContractTypeModal';
import { ContractModuleModal } from '@/components/admin/ContractModuleModal';
import { GlobalVariableModal } from '@/components/admin/GlobalVariableModal';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];  
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingModule, setEditingModule] = useState<ContractModule | null>(null);
  
  // Modal states
  const [contractTypeModalOpen, setContractTypeModalOpen] = useState(false);
  const [contractModuleModalOpen, setContractModuleModalOpen] = useState(false);
  const [globalVariableModalOpen, setGlobalVariableModalOpen] = useState(false);
  
  // Edit states
  const [editingContractType, setEditingContractType] = useState<ContractType | null>(null);
  const [editingContractModule, setEditingContractModule] = useState<ContractModule | null>(null);
  const [editingGlobalVariable, setEditingGlobalVariable] = useState<GlobalVariable | null>(null);

  const {
    contractTypes,
    contractModules,
    globalVariables,
    loading,
    createContractType,
    updateContractType,
    deleteContractType,
    createContractModule,
    updateContractModule,
    deleteContractModule,
    createGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable
  } = useAdminData();

  // Handlers for contract types
  const handleCreateContractType = () => {
    setEditingContractType(null);
    setContractTypeModalOpen(true);
  };

  const handleEditContractType = (contractType: ContractType) => {
    setEditingContractType(contractType);
    setContractTypeModalOpen(true);
  };

  const handleSaveContractType = (data: any) => {
    if (editingContractType) {
      updateContractType(editingContractType.id, data);
    } else {
      createContractType(data);
    }
  };

  // Handlers for contract modules
  const handleCreateContractModule = () => {
    setEditingContractModule(null);
    setContractModuleModalOpen(true);
  };

  const handleEditContractModule = (contractModule: ContractModule) => {
    setEditingContractModule(contractModule);
    setContractModuleModalOpen(true);
  };

  const handleSaveContractModule = (data: any) => {
    if (editingContractModule) {
      updateContractModule(editingContractModule.id, data);
    } else {
      createContractModule(data);
    }
  };

  // Handlers for global variables
  const handleCreateGlobalVariable = () => {
    setEditingGlobalVariable(null);
    setGlobalVariableModalOpen(true);
  };

  const handleEditGlobalVariable = (globalVariable: GlobalVariable) => {
    setEditingGlobalVariable(globalVariable);
    setGlobalVariableModalOpen(true);
  };

  const handleSaveGlobalVariable = (data: any) => {
    if (editingGlobalVariable) {
      updateGlobalVariable(editingGlobalVariable.id, data);
    } else {
      createGlobalVariable(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Lade Admin-Daten...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">
            Verwaltung der Vertragsbausteine und Template-Konfiguration
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="contract-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vertragstypen
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Blocks className="h-4 w-4" />
            Bausteine
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Variablen
          </TabsTrigger>
        </TabsList>

        {/* Übersicht */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Vertragstypen
                </CardTitle>
                <CardDescription>
                  Verfügbare Vertragstypen verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contractTypes.slice(0, 3).map((type) => (
                    <div key={type.id} className="flex items-center justify-between">
                      <Badge variant="secondary">{type.key}</Badge>
                      <span className="text-sm text-muted-foreground">{type.name_de}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  {contractTypes.length} Typen verfügbar
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={handleCreateContractType}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Neuen Typ hinzufügen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Globale Variablen
                </CardTitle>
                <CardDescription>
                  Variablen für alle Verträge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {globalVariables.length} Variablen definiert
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleCreateGlobalVariable}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Variablen bearbeiten
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Blocks className="h-5 w-5" />
                  Module/Bausteine
                </CardTitle>
                <CardDescription>
                  Vertragsbausteine verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {contractModules.length} Module verfügbar
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleCreateContractModule}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Module bearbeiten
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vertragstypen */}
        <TabsContent value="contract-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vertragstypen verwalten</CardTitle>
              <CardDescription>
                Erstelle und bearbeite verfügbare Vertragstypen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{type.name_de}</p>
                    <p className="text-sm text-muted-foreground">Key: {type.key}</p>
                    {type.description && (
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditContractType(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Vertragstyp löschen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sind Sie sicher, dass Sie den Vertragstyp "{type.name_de}" löschen möchten?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteContractType(type.id)}>
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              
              <Button className="w-full" onClick={handleCreateContractType}>
                <Plus className="mr-2 h-4 w-4" />
                Neuen Vertragstyp hinzufügen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module/Bausteine */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Module Liste */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Verfügbare Module</CardTitle>
                <CardDescription>
                  Klicken Sie auf ein Modul zum Bearbeiten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {contractModules.map((module) => (
                      <div 
                        key={module.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          editingModule?.id === module.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => setEditingModule(module)}
                      >
                        <p className="font-medium text-sm">{module.title_de}</p>
                        <p className="text-xs text-muted-foreground">{module.key}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {module.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleCreateContractModule}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Neues Modul
                </Button>
              </CardContent>
            </Card>

            {/* Modul Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {editingModule ? `Modul: ${editingModule.title_de}` : 'Modul auswählen'}
                </CardTitle>
                <CardDescription>
                  {editingModule ? 'Bearbeiten Sie den Inhalt und die Struktur des Moduls' : 'Wählen Sie ein Modul aus der Liste aus'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingModule ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title_de">Titel (Deutsch)</Label>
                          <Input 
                            id="title_de" 
                            value={editingModule.title_de || ''} 
                            readOnly
                          />
                        </div>
                        <div>
                          <Label htmlFor="title_en">Titel (Englisch)</Label>
                          <Input 
                            id="title_en" 
                            value={editingModule.title_en || ''} 
                            readOnly
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label>Inhalt (Deutsch)</Label>
                        <Textarea 
                          className="min-h-[200px]"
                          value={editingModule.content_de || ''}
                          readOnly
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>Inhalt (Englisch)</Label>
                        <Textarea 
                          className="min-h-[200px]"
                          value={editingModule.content_en || ''}
                          readOnly
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleEditContractModule(editingModule)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Modul löschen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sind Sie sicher, dass Sie das Modul "{editingModule.title_de}" löschen möchten?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                deleteContractModule(editingModule.id);
                                setEditingModule(null);
                              }}>
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <Settings className="h-12 w-12 mx-auto mb-4" />
                      <p>Wählen Sie ein Modul aus der Liste aus, um es zu bearbeiten</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Globale Variablen */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Globale Variablen verwalten</CardTitle>
              <CardDescription>
                Erstelle und bearbeite globale Variablen für alle Verträge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {globalVariables.map((variable) => (
                <div key={variable.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{variable.name_de}</p>
                      {variable.is_required && (
                        <Badge variant="destructive" className="text-xs">Erforderlich</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Key: {variable.key}</p>
                    {variable.description && (
                      <p className="text-xs text-muted-foreground">{variable.description}</p>
                    )}
                    {variable.default_value && (
                      <p className="text-xs text-muted-foreground">Standard: {variable.default_value}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditGlobalVariable(variable)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Variable löschen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sind Sie sicher, dass Sie die Variable "{variable.name_de}" löschen möchten?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGlobalVariable(variable.id)}>
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              
              <Button className="w-full" onClick={handleCreateGlobalVariable}>
                <Plus className="mr-2 h-4 w-4" />
                Neue Variable hinzufügen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ContractTypeModal
        open={contractTypeModalOpen}
        onOpenChange={setContractTypeModalOpen}
        onSave={handleSaveContractType}
        contractType={editingContractType}
      />

      <ContractModuleModal
        open={contractModuleModalOpen}
        onOpenChange={setContractModuleModalOpen}
        onSave={handleSaveContractModule}
        contractModule={editingContractModule}
      />

      <GlobalVariableModal
        open={globalVariableModalOpen}
        onOpenChange={setGlobalVariableModalOpen}
        onSave={handleSaveGlobalVariable}
        globalVariable={editingGlobalVariable}
      />
    </div>
  );
}