import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAdminData } from '@/hooks/useAdminData';
import { ContractTypeModal } from '@/components/admin/ContractTypeModal';
import { ContractModuleModal } from '@/components/admin/ContractModuleModal';
import { GlobalVariableModal } from '@/components/admin/GlobalVariableModal';
import { ContractCompositionManager } from '@/components/admin/ContractCompositionManager';
import { TemplateBuilder } from '@/components/admin/TemplateBuilder';
import { Plus, Edit2, Trash2, Settings, Database, FileText, Blocks, Variable, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Admin() {
  const {
    contractTypes,
    contractModules, 
    globalVariables,
    contractCompositions,
    contractTemplates,
    loading,
    fetchData,
    importTemplateData,
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

  const [contractTypeModalOpen, setContractTypeModalOpen] = useState(false);
  const [contractModuleModalOpen, setContractModuleModalOpen] = useState(false);
  const [globalVariableModalOpen, setGlobalVariableModalOpen] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState(null);
  const [selectedContractModule, setSelectedContractModule] = useState(null);
  const [selectedGlobalVariable, setSelectedGlobalVariable] = useState(null);

  const handleEditContractType = (contractType: any) => {
    setSelectedContractType(contractType);
    setContractTypeModalOpen(true);
  };

  const handleEditContractModule = (contractModule: any) => {
    setSelectedContractModule(contractModule);
    setContractModuleModalOpen(true);
  };

  const handleEditGlobalVariable = (globalVariable: any) => {
    setSelectedGlobalVariable(globalVariable);
    setGlobalVariableModalOpen(true);
  };

  const closeModals = () => {
    setContractTypeModalOpen(false);
    setContractModuleModalOpen(false);
    setGlobalVariableModalOpen(false);
    setSelectedContractType(null);
    setSelectedContractModule(null);
    setSelectedGlobalVariable(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Admin-Daten...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
              <p className="text-muted-foreground">
                Verwalten Sie Vertragstypen, Module, Variablen und Templates.
              </p>
            </div>
            <Button onClick={importTemplateData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Template-Daten importieren
            </Button>
          </div>
        </div>

        <Tabs defaultValue="types" className="space-y-6">
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
            <TabsTrigger value="composition" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Zusammensetzung
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Template Builder
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
                  {contractModules.map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{module.title_de}</h3>
                          <Badge variant="outline">{module.category}</Badge>
                          {!module.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">Key: {module.key}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {module.content_de.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditContractModule(module)}
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
                  ))}
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

          {/* Vertragszusammensetzung */}
          <TabsContent value="composition" className="space-y-6">
            <ContractCompositionManager
              contractTypes={contractTypes}
              contractModules={contractModules}
              contractCompositions={contractCompositions}
              onUpdate={fetchData}
            />
          </TabsContent>

          {/* Template Builder */}
          <TabsContent value="builder" className="space-y-6">
            <TemplateBuilder
              contractTypes={contractTypes}
              contractModules={contractModules}
              contractCompositions={contractCompositions}
              globalVariables={globalVariables}
              onUpdate={fetchData}
            />
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
    </Layout>
  );
}