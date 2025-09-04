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
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye,
  FileText,
  Database,
  Blocks,
  Palette
} from 'lucide-react';
import templateData from '@/lib/template.json';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingModule, setEditingModule] = useState<string | null>(null);

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
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Änderungen speichern
        </Button>
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
          <TabsTrigger value="formatting" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Formatierung
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
                  {Object.entries(templateData.contractTypes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Badge variant="secondary">{key}</Badge>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Neuen Typ hinzufügen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Globale Variablen
                </CardTitle>
                <CardDescription>
                  Variablen für alle Verträge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {templateData.global_variables.length} Variablen definiert
                </div>
                <Button variant="outline" size="sm" className="w-full">
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
                  {Object.keys(templateData.modules).length} Module verfügbar
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Module bearbeiten
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Letzte Änderungen</CardTitle>
              <CardDescription>
                Übersicht der kürzlich vorgenommenen Änderungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Formatierung: Paragraph-Struktur verbessert</p>
                    <p className="text-sm text-muted-foreground">Heute, 14:30</p>
                  </div>
                  <Badge>Ausstehend</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Neues Modul: "Datenschutz" hinzugefügt</p>
                    <p className="text-sm text-muted-foreground">Gestern, 16:45</p>
                  </div>
                  <Badge variant="secondary">Gespeichert</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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
              {Object.entries(templateData.contractTypes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{value}</p>
                    <p className="text-sm text-muted-foreground">Key: {key}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button className="w-full">
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
                    {Object.entries(templateData.modules).map(([key, module]) => (
                      <div 
                        key={key}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          editingModule === key ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => setEditingModule(key)}
                      >
                        <p className="font-medium text-sm">{(module as any).title_de || key}</p>
                        <p className="text-xs text-muted-foreground">{key}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Modul Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {editingModule ? `Modul bearbeiten: ${editingModule}` : 'Modul auswählen'}
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
                            value={(templateData.modules as any)[editingModule]?.title_de || ''} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="title_en">Titel (Englisch)</Label>
                          <Input 
                            id="title_en" 
                            value={(templateData.modules as any)[editingModule]?.title_en || ''} 
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label>Inhalt (Deutsch)</Label>
                        <Textarea 
                          className="min-h-[200px]"
                          value={(templateData.modules as any)[editingModule]?.content_de || ''}
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>Inhalt (Englisch)</Label>
                        <Textarea 
                          className="min-h-[200px]"
                          value={(templateData.modules as any)[editingModule]?.content_en || ''}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button>
                          <Save className="mr-2 h-4 w-4" />
                          Speichern
                        </Button>
                        <Button variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          Vorschau
                        </Button>
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

        {/* Formatierung */}
        <TabsContent value="formatting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formatierungsregeln</CardTitle>
              <CardDescription>
                Verbessern Sie die Struktur und Formatierung der Templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Paragraph-Struktur</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">§ Nummerierung konsistent</span>
                      <Badge variant="destructive">Fehlerhaft</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Absätze (1), (2), (3) einheitlich</span>
                      <Badge variant="destructive">Fehlerhaft</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Unterabsätze (a), (b), (c)</span>
                      <Badge variant="secondary">Teilweise</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sprach-Konsistenz</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Deutsche Inhalte vollständig</span>
                      <Badge variant="secondary">Gut</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Englische Übersetzungen</span>
                      <Badge variant="destructive">Unvollständig</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Variable Platzhalter</span>
                      <Badge variant="secondary">Konsistent</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Automatische Korrekturen</h3>
                <div className="space-y-4">
                  <Button className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Paragraph-Nummerierung standardisieren
                  </Button>
                  <Button className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Einheitliche Absatz-Struktur anwenden
                  </Button>
                  <Button className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Fehlende Übersetzungen kennzeichnen
                  </Button>
                  <Button className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Variable Konsistenz prüfen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}