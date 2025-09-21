import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAdminData } from '@/hooks/useAdminData';
import { ContractTypeModal } from '@/components/admin/ContractTypeModal';
import { ContractModuleModal } from '@/components/admin/ContractModuleModal';
import { ContractCategoryModal } from '@/components/admin/ContractCategoryModal';
import { GlobalVariableModal } from '@/components/admin/GlobalVariableModal';
import { AttachmentManager } from '@/components/admin/AttachmentManager';
import { TemplateBuilder } from '@/components/admin/TemplateBuilder';
import { Plus, Edit2, Trash2, Copy, Settings, Database, FileText, Blocks, Variable, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Admin() {
  const {
    contractTypes,
    contractModules, 
    setContractModules,
    contractCategories,
    globalVariables,
    contractCompositions,
    contractTemplates,
    loading,
    fetchData,
    createContractType,
    updateContractType,
    deleteContractType,
    createContractModule,
    updateContractModule,
    cloneContractModule,
    deleteContractModule,
    createContractCategory,
    updateContractCategory,
    deleteContractCategory,
    createGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable
  } = useAdminData();

  const [contractTypeModalOpen, setContractTypeModalOpen] = useState(false);
  const [contractModuleModalOpen, setContractModuleModalOpen] = useState(false);
  const [contractCategoryModalOpen, setContractCategoryModalOpen] = useState(false);
  const [globalVariableModalOpen, setGlobalVariableModalOpen] = useState(false);
  
  const [selectedContractType, setSelectedContractType] = useState<any>(null);
  const [selectedContractModule, setSelectedContractModule] = useState<any>(null);
  const [selectedContractCategory, setSelectedContractCategory] = useState<any>(null);
  const [selectedGlobalVariable, setSelectedGlobalVariable] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState("types");

  const handleEditContractType = (contractType: any) => {
    setSelectedContractType(contractType);
    setContractTypeModalOpen(true);
  };

  const handleEditContractModule = (contractModule: any) => {
    setSelectedContractModule(contractModule);
    setContractModuleModalOpen(true);
  };

  const handleEditContractCategory = (contractCategory: any) => {
    setSelectedContractCategory(contractCategory);
    setContractCategoryModalOpen(true);
  };

  const handleEditGlobalVariable = (globalVariable: any) => {
    setSelectedGlobalVariable(globalVariable);
    setGlobalVariableModalOpen(true);
  };

  const handleModuleUpdate = (updatedModule: any) => {
    setContractModules(currentModules =>
      currentModules.map(m =>
        m.id === updatedModule.id ? { ...m, ...updatedModule } : m
      )
    );
  };

  const closeModals = () => {
    setContractTypeModalOpen(false);
    setContractModuleModalOpen(false);
    setContractCategoryModalOpen(false);
    setGlobalVariableModalOpen(false);
    setSelectedContractType(null);
    setSelectedContractModule(null);
    setSelectedContractCategory(null);
    setSelectedGlobalVariable(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Admin-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Vertragstypen, Module, Kategorien, Variablen und Templates.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vertragstypen
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Blocks className="h-4 w-4" />
            Module
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Variablen
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Vertragsstruktur
          </TabsTrigger>
          <TabsTrigger value="composition" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Wählbare Anhänge
          </TabsTrigger>
        </TabsList>

        {/* Vertragstypen */}
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vertragstypen</CardTitle>
                <CardDescription>
                  Verwalten Sie die verfügbaren Vertragstypen für das System.
                </CardDescription>
              </div>
              <Button onClick={() => {
                setSelectedContractType(null);
                setContractTypeModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Typ
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {contractTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{type.name_de}</h3>
                      <p className="text-sm text-muted-foreground">Key: {type.key}</p>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContractType(type)}
                      >
                        <Edit2 className="h-4 w-4" />
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
                              Sind Sie sicher, dass Sie "{type.name_de}" löschen möchten?
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vertragsmodule</CardTitle>
                <CardDescription>
                  Verwalten Sie die Bausteine für Ihre Verträge.
                </CardDescription>
              </div>
              <Button onClick={() => {
                setSelectedContractModule(null);
                setContractModuleModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Neues Modul
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {contractModules.map((module) => {
                  const category = contractCategories.find(cat => cat.key === module.category);
                  return (
                    <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{module.name || module.title_de}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {category && (
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: category.color + '20', borderColor: category.color }}
                            >
                              {category.name_de}
                            </Badge>
                          )}
                          {!module.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditContractModule(module)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => cloneContractModule(module.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Modul löschen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sind Sie sicher, dass Sie "{module.title_de}" löschen möchten?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteContractModule(module.id)}>
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variablen */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Globale Variablen</CardTitle>
                <CardDescription>
                  Verwalten Sie globale Variablen für alle Verträge.
                </CardDescription>
              </div>
              <Button onClick={() => {
                setSelectedGlobalVariable(null);
                setGlobalVariableModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Variable
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {globalVariables.map((variable) => (
                  <div key={variable.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{variable.name_de}</h3>
                        {variable.is_required && <Badge variant="destructive">Erforderlich</Badge>}
                        {!variable.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">Key: {variable.key}</p>
                      {variable.description && (
                        <p className="text-sm text-muted-foreground">{variable.description}</p>
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
                        <Edit2 className="h-4 w-4" />
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
                              Sind Sie sicher, dass Sie "{variable.name_de}" löschen möchten?
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vertragsstruktur */}
        <TabsContent value="structure" className="space-y-6">
          <TemplateBuilder
            contractTypes={contractTypes}
            contractModules={contractModules}
            contractCompositions={contractCompositions}
            onUpdate={fetchData}
          />
        </TabsContent>

        {/* Wählbare Anhänge */}
        <TabsContent value="composition" className="space-y-6">
          <AttachmentManager />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ContractTypeModal
        open={contractTypeModalOpen}
        onOpenChange={setContractTypeModalOpen}
        onSave={(data) => {
          if (selectedContractType) {
            updateContractType((selectedContractType as any).id, data);
          } else {
            createContractType(data);
          }
          closeModals();
        }}
        contractType={selectedContractType}
      />

      <ContractModuleModal
        open={contractModuleModalOpen}
        onOpenChange={setContractModuleModalOpen}
        onSave={(data) => {
          if (selectedContractModule) {
            updateContractModule((selectedContractModule as any).id, data);
          } else {
            createContractModule(data);
          }
          closeModals();
        }}
        contractModule={selectedContractModule}
        contractCategories={contractCategories}
        globalVariables={globalVariables}
        onUpdate={handleModuleUpdate}
      />

      <ContractCategoryModal
        open={contractCategoryModalOpen}
        onOpenChange={setContractCategoryModalOpen}
        onSave={(data) => {
          if (selectedContractCategory) {
            updateContractCategory((selectedContractCategory as any).id, data);
          } else {
            createContractCategory(data);
          }
          closeModals();
        }}
        contractCategory={selectedContractCategory}
      />

      <GlobalVariableModal
        open={globalVariableModalOpen}
        onOpenChange={setGlobalVariableModalOpen}
        onSave={(data) => {
          if (selectedGlobalVariable) {
            updateGlobalVariable((selectedGlobalVariable as any).id, data);
          } else {
            createGlobalVariable(data);
          }
          closeModals();
        }}
        globalVariable={selectedGlobalVariable}
      />
    </div>
  );
}