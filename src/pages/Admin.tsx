import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAdminData } from '@/hooks/useAdminData';
import { ContractTypeModal } from '@/components/admin/ContractTypeModal';
import { ContractModuleModal } from '@/components/admin/ContractModuleModal';
import { ContractCategoryModal } from '@/components/admin/ContractCategoryModal';
import { GlobalVariableModal } from '@/components/admin/GlobalVariableModal';
import { ContractCompositionManager } from '@/components/admin/ContractCompositionManager';
import { TemplateBuilder } from '@/components/admin/TemplateBuilder';
import { ProductTagManager } from '@/components/admin/ProductTagManager';
import { ContractBuilder } from '@/components/admin/ContractBuilder';
import { Plus, Edit2, Trash2, Copy, Settings, Database, FileText, Blocks, Variable, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Admin() {
  const {
    contractTypes,
    contractModules, 
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vertragstypen
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Blocks className="h-4 w-4" />
            Module
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Variablen
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Vertrags-Builder
          </TabsTrigger>
          <TabsTrigger value="composition" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Template-Editor
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Product-Tags
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
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{module.title_de}</h3>
                          <Badge 
                            variant="outline" 
                            style={{ backgroundColor: category?.color + '20', borderColor: category?.color }}
                          >
                            {category?.name_de || module.category}
                          </Badge>
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

        {/* Kategorien */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Modul Tags</CardTitle>
                <CardDescription>
                  Verwalten Sie die Tags für Vertragsmodule. Tags helfen bei der Organisation und Strukturierung Ihrer Vertragsbausteine.
                </CardDescription>
              </div>
              <Button onClick={() => {
                setSelectedContractCategory(null);
                setContractCategoryModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Tag
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {contractCategories
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((category) => {
                    const moduleCount = contractModules.filter(m => m.category === category.key).length;
                    return (
                      <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full border-2" 
                              style={{ backgroundColor: category.color, borderColor: category.color }}
                            />
                            <h3 className="font-medium">{category.name_de}</h3>
                            <Badge variant="outline">{moduleCount} Module</Badge>
                            {!category.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">Key: {category.key}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                          {category.name_en && (
                            <p className="text-xs text-muted-foreground">EN: {category.name_en}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditContractCategory(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={moduleCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tag löschen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sind Sie sicher, dass Sie den Tag "{category.name_de}" löschen möchten?
                                  {moduleCount > 0 && (
                                    <span className="block mt-2 text-destructive">
                                      Dieser Tag kann nicht gelöscht werden, da er noch {moduleCount} Module enthält.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                {moduleCount === 0 && (
                                  <AlertDialogAction onClick={() => deleteContractCategory(category.id)}>
                                    Löschen
                                  </AlertDialogAction>
                                )}
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

        {/* Vertrags-Builder */}
        <TabsContent value="builder" className="space-y-6">
          <ContractBuilder
            contractTypes={contractTypes}
            contractModules={contractModules}
            contractCompositions={contractCompositions}
            globalVariables={globalVariables}
            onUpdate={fetchData}
          />
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
        availableProductTags={(() => {
          const stored = localStorage.getItem('productTags');
          return stored ? JSON.parse(stored) : ['core', 'shyftplanner', 'shyftskills'];
        })()}
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

      {/* Product-Tags Tab hinzufügen */}
      {activeTab === 'products' && (
        <ProductTagManager 
          productTags={(() => {
            const stored = localStorage.getItem('productTags');
            const storedTags = stored ? JSON.parse(stored) : [];
            // Merge with existing tags from modules
            const existingProductTags = Array.from(new Set(
              contractModules.flatMap(module => module.product_tags || [])
            ));
            const allTags = Array.from(new Set([...storedTags, ...existingProductTags]));
            // Ensure system tags are always present
            const systemTags = ['core', 'shyftplanner', 'shyftskills'];
            systemTags.forEach(tag => {
              if (!allTags.includes(tag)) {
                allTags.push(tag);
              }
            });
            return allTags.sort();
          })()}
          onProductTagsChange={(newTags: string[]) => {
            localStorage.setItem('productTags', JSON.stringify(newTags));
          }}
        />
      )}
    </div>
  );
}