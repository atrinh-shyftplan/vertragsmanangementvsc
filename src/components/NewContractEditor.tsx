import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FileText, ArrowLeft, Save, X, PanelLeftClose, PanelRightClose, BookOpen, FileDown, Loader2 } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import type { Attachment, ContractModule, Database, EditableModule } from '@/integrations/supabase/types';
import '@/lib/contract-print-styles.css';

type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type ContractTemplate = Database['public']['Tables']['contract_templates']['Row'];

const getValidationSchema = (
  status: string,
  selectedModules: ContractModule[],
  allAttachments: Attachment[]
) => {
  const isDraft = status === 'draft';

  let schema = yup.object({
    title: yup.string().required('Titel ist ein Pflichtfeld'),
    client: yup.string().required('Kunde ist ein Pflichtfeld'),
    assigned_to_profile_id: yup.string().required('Zuständiger Ansprechpartner ist ein Pflichtfeld'),
    status: yup.string().required('Status ist ein Pflichtfeld'),
    selectedAttachmentIds: yup.array().of(yup.string()).min(1, 'Mindestens ein Produkt muss ausgewählt werden.').test(
      'has-product',
      'Mindestens ein Produkt muss ausgewählt werden.',
      (ids) => {
        if (!ids || ids.length === 0) return false;
        const selected = ids.map(id => allAttachments.find(a => a.id === id)).filter(Boolean);
        return selected.some(a => a!.type === 'produkt');
      }
    ),
  });

  if (!isDraft) {
    const requiredFieldsShape: { [key: string]: yup.AnySchema } = {
      start_date: yup.string().required('Startdatum ist ein Pflichtfeld'),
      end_date: yup.string().required('Enddatum ist ein Pflichtfeld'),
    };

    selectedModules.forEach(module => {
      if (module) {
        const contentVariables = extractVariablesFromContent(module.content || '');
        contentVariables.forEach(variableKey => {
          if (!requiredFieldsShape[variableKey]) {
            requiredFieldsShape[variableKey] = yup.string().required(`Die Variable "${variableKey}" ist ein Pflichtfeld.`);
          }
        });
      }
    });

    schema = schema.concat(yup.object(requiredFieldsShape));
  }

  return schema;
};

interface NewContractEditorProps {
  existingContract?: any;
  onClose?: () => void;
}

const extractVariablesFromContent = (content: string) => {
  if (!content) return [];
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '').trim()) : [];
};

export default function NewContractEditor({ existingContract, onClose }: NewContractEditorProps) {
  const { contractTypes, contractModules, globalVariables, loading: adminDataLoading } = useAdminData();
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [modules, setModules] = useState<EditableModule[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isOutlineSheetOpen, setIsOutlineSheetOpen] = useState(false);
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<ImperativePanelHandle>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);

  const [contractStructure, setContractStructure] = useState<{
    composition: ContractComposition;
    module: ContractModule;
    attachment?: Attachment;
  }[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);

  // Lade-Logik für eine spezifische Vorlage
  useEffect(() => {
    const loadTemplate = async () => {
      // Für dieses Beispiel laden wir eine Vorlage mit einem bekannten Namen.
      // In einer echten Anwendung würde dies dynamisch geschehen (z.B. über eine ID).
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('name', 'Standard-Dienstleistungsvertrag') // Beispiel-Name
        .single();

      if (error) {
        toast.error('Fehler beim Laden der Vertragsvorlage.');
        console.error(error);
        return;
      }

      if (data && data.template_data && Array.isArray(data.template_data)) {
        setTemplate(data);
        // Füge jedem Modul eine client-seitige ID für React hinzu
        const modulesWithIds = (data.template_data as any[]).map(mod => ({ ...mod, id: uuidv4() }));
        setModules(modulesWithIds);
      }
    };
    loadTemplate();
  }, []);

  const handleTypeChange = (typeKey: string) => {
    setVariableValues(prev => ({
      ...prev,
      contract_type_key: typeKey,
    }));
    setShowDetails(true);
  }

  useEffect(() => {
    // NEUE BEDINGUNG: Führe den Code nur aus, wenn der Vertrag existiert UND die Admin-Daten geladen sind.
    if (existingContract && !adminDataLoading) {
      setVariableValues({
        ...existingContract,
        ...existingContract.globalVariables,
        contract_type_key: existingContract.contractType,
      });

      if (existingContract.contract_attachments) {
        setSelectedAttachmentIds(
          existingContract.contract_attachments.map((ca: any) => ca.attachments?.id).filter(Boolean)
        );
      }
      
      setShowDetails(true);
    }
  // NEUE ABHÄNGIGKEIT: Der Hook wird nun erneut ausgeführt, wenn sich der Ladezustand ändert.
  }, [existingContract, adminDataLoading]);

  useEffect(() => {
    // Finde den aktuell ausgewählten Benutzer in der Liste aller Benutzer.
    const selectedUser = users.find(user => user.id === variableValues.assigned_to_profile_id);

    // Wenn ein Benutzer ausgewählt wurde, aktualisiere die Ansprechpartner-Variablen.
    if (selectedUser) {
      setVariableValues(prevData => {
        // Prüfe, ob die Daten sich tatsächlich geändert haben, um Endlosschleifen zu vermeiden.
        if (prevData.ansprechpartner_name !== selectedUser.display_name ||
            prevData.ansprechpartner_email !== selectedUser.email ||
            prevData.ansprechpartner_telefon !== selectedUser.phone_number) {
          
          return {
            ...prevData,
            ansprechpartner_name: selectedUser.display_name,
            ansprechpartner_email: selectedUser.email,
            ansprechpartner_telefon: selectedUser.phone_number,
          };
        }
        return prevData;
      });
    }
  }, [variableValues.assigned_to_profile_id, users]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.from('profiles').select('*').order('display_name');
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadData();
  }, []);

  const selectedTypeKey = variableValues.contract_type_key;

  // Effect to load contract structure and initialize form data
  useEffect(() => {
    const loadStructureAndInit = async () => {
      if (!selectedTypeKey || contractTypes.length === 0 || contractModules.length === 0) {
        return;
      }

      setIsLoadingStructure(true);
      const type = contractTypes.find(t => t.key === selectedTypeKey);
      if (!type) return;

      const { supabase } = await import('@/integrations/supabase/client');

      const { data: compositionsData, error: compositionsError } = await supabase
        .from('contract_compositions')
        .select('*')
        .eq('contract_type_key', type.key)
        .order('sort_order');

      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .eq('contract_type_id', type.id);

      if (compositionsError) toast.error('Fehler beim Laden der Vertragsstruktur.');
      if (attachmentsError) toast.error('Fehler beim Laden der Anhänge.');

      const attachmentsMap = new Map<string, Attachment>();
      if (attachmentsData) {
        attachmentsData.forEach(att => attachmentsMap.set(att.module_id, att));
      }

      const fullStructure = (compositionsData || []).map(comp => {
        const module = contractModules.find(m => m.key === comp.module_key);
        if (!module) return null;
        const attachment = attachmentsMap.get(module.id);
        return { composition: comp, module, attachment: attachment || undefined };
      }).filter(Boolean) as typeof contractStructure;
      setContractStructure(fullStructure);

      if (existingContract && existingContract.contract_type_id === type.id) {
        // Editing: Set values from existing contract
        setVariableValues({
          ...existingContract.variables,
          ...existingContract,
          contract_type_key: type.key,
        });
        setSelectedAttachmentIds(existingContract.contract_attachments.map((ca: any) => ca.attachment_id));
      } else if (!existingContract) {
        // New contract: Set default attachments
        const fixedAttachmentIds = fullStructure
          .filter(item => item.attachment?.type === 'fest')
          .map(item => item.attachment!.id);
        setSelectedAttachmentIds(fixedAttachmentIds);
      }
      setIsLoadingStructure(false);
    };

    loadStructureAndInit();
  }, [selectedTypeKey, contractTypes, contractModules, existingContract]);

  useEffect(() => {
    if (previewRef.current && showDetails) {
      const headings = previewRef.current.querySelectorAll('.german-content h3');
      const newOutline = Array.from(headings).map((h, index) => {
        const id = `heading-outline-${index}`;
        h.id = id;
        return {
          id,
          text: h.textContent || `Abschnitt ${index + 1}`,
          level: parseInt(h.tagName.substring(1), 10)
        };
      });
      if (JSON.stringify(newOutline) !== JSON.stringify(outline)) {
        setOutline(newOutline);
      }
    }
  }, [variableValues, contractStructure, selectedAttachmentIds, showDetails, outline]);

  // Extrahiere alle einzigartigen Variablen aus den geladenen Modulen
  const uniqueVariables = useMemo(() => {
    const allVarKeys = new Set<string>();
    const modulesToScan = contractStructure
      .filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id))
      .map(item => item.module);

    modulesToScan.forEach(module => {
      const content = module.content || '';
      const regex = /{{\s*(\w+)\s*}}/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        allVarKeys.add(match[1]);
      }
    });

    // Definiere Schlüssel, die bereits in den "Vertragsdaten" bearbeitet werden und hier nicht mehr erscheinen sollen.
    const excludedKeys = [
      'title', 
      'client', 
      'gueltig_bis', 
      'gueltig_bis_formatted', 
      'ansprechpartner_name', 
      'ansprechpartner_email', 
      'ansprechpartner_telefon'
    ];

    // Mappe die gefundenen Schlüssel zu Objekten mit Schlüssel und dem deutschen Anzeigenamen.
    return Array.from(allVarKeys).filter(key => !excludedKeys.includes(key)).map(key => {
      const variable = globalVariables.find(v => v.key === key);
      return { key, name: variable?.name_de || key }; // Fallback auf den Schlüssel, falls kein Name gefunden wird.
    });
  }, [contractStructure, selectedAttachmentIds, globalVariables]);

  const allAvailableAttachments = useMemo(() => {
    return contractStructure.map(cs => cs.attachment).filter(Boolean) as Attachment[];
  }, [contractStructure]);

  useEffect(() => {
    const selectedModulesForValidation = contractStructure
      .filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id))
      .map(item => item.module);
    const schema = getValidationSchema(variableValues.status || 'draft', selectedModulesForValidation, allAvailableAttachments);
    setRequiredFields(Object.keys(schema.describe().fields));
  }, [variableValues.status, contractStructure, selectedAttachmentIds, allAvailableAttachments]);

  // Hilfsfunktion, um Variablen im Content zu ersetzen
  const renderContent = (content: string) => {
    let processedContent = content;
    for (const key in variableValues) {
      const value = variableValues[key] || '';
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    }
    return processedContent;
  };

  const generatePreview = () => {
    let preview = '';
    const modulesToRender = contractStructure.filter(item => {
      if (!item.attachment) return true;
      return selectedAttachmentIds.includes(item.attachment.id);
    });
    
    // Separate regular modules from annexes and count annexes for proper numbering
    const regularModules = [];
    const annexModules = [];
    
    modulesToRender.forEach((item) => {
      if (item.module.category === 'anhang') {
        annexModules.push(item.module);
      } else {
        regularModules.push(item.module);
      }
    });
    
    regularModules.forEach((module) => {
      preview += renderSimpleModule(module, false, 0);
    });
    annexModules.forEach((module, index) => {
      const annexNumber = index + 1;
      preview += renderSimpleModule(module, true, annexNumber);
    });
    
    return preview || '<p class="text-gray-500">Keine Inhalte verfügbar</p>';
  };

  const renderSimpleModule = (module: ContractModule, isAnnex: boolean, annexNumber: number) => {
    const title = module.title_de; // Wir verwenden hier nur den deutschen Titel für die Vorschau
    const hasContent = module.content && module.content.trim() !== '';
    const isHeaderModule = module.key === 'Header Sales';

    if (!isHeaderModule && !title && !hasContent) {
      return '';
    }

    let moduleHtml = '';

    if (isHeaderModule) {
      moduleHtml += `<div class="mb-8 not-prose flex justify-center">`;
      moduleHtml += `<div class="header-content" style="text-align: center; margin: 0 auto; max-width: 800px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: white;">`; // Stile beibehalten
    } else {
      moduleHtml += `<div class="mb-8">`;
    }

    // Einheitliches Rendering
    moduleHtml += `<div class="german-content">`; // Beibehaltung der Klasse für Gliederungs-Parsing
    if (!isHeaderModule && title) {
      const displayTitle = isAnnex ? `Anhang ${annexNumber}: ${title}` : title;
      moduleHtml += `<h3>${displayTitle}</h3>`;
    }
    if (hasContent) {
      moduleHtml += `<div>${renderContent(module.content!)}</div>`;
    }
    moduleHtml += `</div>`;

    if (isHeaderModule) {
      moduleHtml += `</div>`;
    }
    moduleHtml += `</div>`;
    
    return moduleHtml;
  };

  const togglePanel = () => {
    const panel = panelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const saveContract = async () => {
    const selectedModulesForValidation = contractStructure
      .filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id))
      .map(item => item.module);

    const validationSchema = getValidationSchema(variableValues.status || 'draft', selectedModulesForValidation, allAvailableAttachments);

    try {
      await validationSchema.validate(
        { ...variableValues, selectedAttachmentIds: selectedAttachmentIds },
        { abortEarly: false }
      );
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Bitte füllen Sie alle Pflichtfelder aus:</p>
            <ol className="list-decimal list-inside text-sm pl-4">
              {err.inner.map(e => <li key={e.path}>{e.message}</li>)}
            </ol>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error('Ein unerwarteter Validierungsfehler ist aufgetreten.');
      }
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const contractData = {
        title: variableValues.title,
        client: variableValues.client,
        status: (variableValues.status || 'draft'),
        contract_type_id:contractTypes.find(t => t.key === selectedTypeKey)?.id || null,
        assigned_to_profile_id: variableValues.assigned_to_profile_id || null,
        variables: {
          ...variableValues,
          ...Object.fromEntries(globalVariables.map(gv => [gv.key, variableValues[gv.key] || '']))}
      };

      let contractId = existingContract?.id;

      if (contractId) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', contractId);
        if (updateError) throw updateError;
        
        // 2. Alte Modul-Verknüpfungen löschen
        await supabase.from('contract_attachments').delete().eq('contract_id', contractId);
      } else {
        // INSERT
        const { data: newContract, error: insertError } = await supabase
          .from('contracts')
          .insert(contractData)
          .select('id')
          .single();
        if (insertError) throw insertError;
        if (!newContract) throw new Error('Contract creation failed, no contract returned.');
        contractId = newContract.id;
      }

      // Re-insert attachments for both cases
      if (selectedAttachmentIds.length > 0) {
        const attachmentsData = selectedAttachmentIds.map(attachmentId => ({
          contract_id: contractId!,
          attachment_id: attachmentId,
        }));
        const { error: attachmentsError } = await supabase
          .from('contract_attachments')
          .insert(attachmentsData);
        if (attachmentsError) throw attachmentsError;
      }

      toast.success(`Vertrag erfolgreich ${existingContract ? 'aktualisiert' : 'gespeichert'}!`);

      onClose?.();
      
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Fehler beim Speichern des Vertrags');
    }
  };

  const handleExportPdf = async () => {
    setIsLoading(true);

    // 1. Bereite den sauberen HTML-Inhalt vor, ohne die gelben Markierungen.
    // Wir nehmen den gesamten Preview-Inhalt und bereinigen ihn.
    const previewHtml = generatePreview();
    const cleanHtml = previewHtml.replace(/<span class="bg-yellow-200 px-1 rounded">/g, '').replace(/<\/span>/g, '');
    const filename = `${variableValues.title || 'vertrag'}.pdf`;

    try {
      // 2. Rufe die neue asynchrone Supabase Function auf, um den PDF-Generierungsjob zu starten.
      const { error } = await supabase.functions.invoke('request-pdf-generation', {
        body: JSON.stringify({
          html_content: cleanHtml,
          filename: filename
        }),
      });

      if (error) throw error;

      // 3. Bei Erfolg: Informiere den Benutzer und schließe den Dialog.
      // Der Download-Teil wird entfernt, da der Prozess jetzt asynchron ist.
      toast.success("PDF-Generierung gestartet. Sie werden benachrichtigt, sobald der Download bereitsteht.");
      setIsPdfDialogOpen(false);

    } catch (error) {
      // 1. Gib das *gesamte* Fehlerobjekt in der Konsole aus.
      // Das ist der wichtigste Schritt für die Fehlersuche.
      console.error('Fehler beim Starten des PDF-Generierungsjobs:', error);

      // 2. Extrahiere die Nachricht sicher, falls das Fehlerobjekt kein Standard-Error ist.
      const errorMessage = (error instanceof Error) ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';

      // 3. Zeige dem Benutzer eine saubere und verständliche Nachricht an.
      toast.error(`Fehler beim Starten der PDF-Generierung: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showDetails && !existingContract) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Neuer Vertrag erstellen</h2>
            <p className="text-muted-foreground mb-6">Wählen Sie einen Vertragstyp aus</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contractTypes.map((type) => (
            <Card 
              key={type.key} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTypeChange(type.key)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {type.name_de}
                </CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isLoadingStructure || (existingContract && contractStructure.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4 text-muted-foreground">Lade Vertragseditor...</p>
      </div>
    );
  }

  function setSelectedUser(arg0: any) {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-black">Vertrag erstellen</h2>
          <p className="text-sm text-muted-foreground">
            Typ: {contractTypes.find(t => t.key === selectedTypeKey)?.name_de}
          </p>
        </div>
        <div className="flex-grow"></div>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePanel}
        >
          {isPanelVisible ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setVariableValues(prev => ({ ...prev, contract_type_key: '' }));
              setShowDetails(false);
              setVariableValues({});
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <Button variant="outline" onClick={() => setIsOutlineSheetOpen(true)}>
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
                setPdfFilename(`${variableValues.title || 'Vertrag'}.pdf`);
                setIsPdfDialogOpen(true);
            }}
          >
            <FileDown className="h-4 w-4" />
          </Button>
          <Button onClick={saveContract} style={{ backgroundColor: '#8C5AF5', color: 'white' }}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Schließen
            </Button>
          )}
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-grow overflow-hidden">
        {/* Input Fields - smaller width */}
        <ResizablePanel
          ref={panelRef}
          collapsible
          onCollapse={() => setIsPanelVisible(false)}
          onExpand={() => setIsPanelVisible(true)}
          defaultSize={33}
          minSize={20}
          className="relative bg-background"
        >
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6">
              {/* Basic Contract Fields with better structure */}
              <Card style={{ borderRadius: 0, border: 'none', backgroundColor: '#F6F8FF', borderTop: '4px solid #77A0F6' }}>
                <CardHeader>
                  <CardTitle>Vertragsdaten</CardTitle>
                  <CardDescription>
                    Grundlegende Vertragsinformationen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" style={{ color: 'black' }}>Titel {requiredFields.includes('title') && <span className="text-destructive">*</span>}</Label>
                        <Input
                          id="title"
                          value={variableValues.title || ''}
                          onChange={(e) => setVariableValues(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                          placeholder="Vertragstitel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client" style={{ color: 'black' }}>Name des Unternehmens {requiredFields.includes('client') && <span className="text-destructive">*</span>}</Label>
                        <Input
                          id="client"
                          value={variableValues.client || ''}
                          onChange={(e) => setVariableValues(prev => ({
                            ...prev,
                            client: e.target.value
                          }))}
                          placeholder="Name des Kunden"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gueltig_bis" style={{ color: 'black' }}>Angebot gültig bis {requiredFields.includes('gueltig_bis') && <span className="text-destructive">*</span>}</Label>
                        <Input
                          id="gueltig_bis"
                          type="date"
                          value={variableValues.gueltig_bis || ''}
                         onChange={(e) => {
                            const dateValue = e.target.value;                            
                            const formattedDate = dateValue ? 
                              new Date(dateValue).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric'
                              }) : '';
                            
                            setVariableValues(prev => ({
                              ...prev,
                              gueltig_bis: dateValue,
                              gueltig_bis_formatted: formattedDate
                            }));
                          }}
                          placeholder="Gültigkeitsdatum"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="assigned_to_profile_id" style={{ color: 'black' }}>Zuständiger Ansprechpartner {requiredFields.includes('assigned_to_profile_id') && <span className="text-destructive">*</span>}</Label>
                        <Select
                          value={variableValues.assigned_to_profile_id || ''}
                         onValueChange={(value) => {
                            setVariableValues(prev => ({
                              ...prev,
                              assigned_to_profile_id: value,
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ansprechpartner auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.display_name || user.email || 'Unbekannter Benutzer'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" style={{ color: 'black' }}>Status {requiredFields.includes('status') && <span className="text-destructive">*</span>}</Label>
                        <Select 
                          value={variableValues.status || 'draft'} 
                          onValueChange={(value) => setVariableValues(prev => ({
                            ...prev,
                            status: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Entwurf</SelectItem>
                            <SelectItem value="ready_for_review">Zur Prüfung</SelectItem>
                            <SelectItem value="active">Aktiv</SelectItem>
                            <SelectItem value="archived">Archiviert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: 0, border: 'none', backgroundColor: '#F6F8FF', borderTop: '4px solid #8C5AF5' }}>
                <CardHeader>
                  <CardTitle>Vertragsbestandteile</CardTitle>
                  <CardDescription>
                    Stellen Sie die Komponenten des Vertrags zusammen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm mb-2" style={{ color: 'black' }}>Feste Bestandteile</h4>
                    <div className="space-y-2">
                      {contractStructure.filter(item => item.attachment?.type === 'fest').map(item => (
                        <div key={item.attachment!.id} className="flex items-center space-x-2 opacity-70">
                          <Checkbox
                            id={`attachment-${item.attachment!.id}`}
                            checked={true}
                            disabled={true}
                          />
                          <Label htmlFor={`attachment-${item.attachment!.id}`} className="cursor-not-allowed" style={{ color: 'black' }}>
                            {item.module.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2" style={{ color: 'black' }}>Produkte (mindestens eines auswählen) {requiredFields.includes('selectedAttachmentIds') && <span className="text-destructive">*</span>}</h4>
                    <div className="space-y-2">
                      {contractStructure.filter(item => item.attachment?.type === 'produkt').map(item => (
                        <div key={item.attachment!.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`attachment-${item.attachment!.id}`}
                            checked={selectedAttachmentIds.includes(item.attachment!.id)}
                            onCheckedChange={(checked) => {
                              setSelectedAttachmentIds(prev => 
                                checked 
                                  ? [...prev, item.attachment!.id] 
                                  : prev.filter(id => id !== item.attachment!.id)
                              );
                            }}
                          />
                          <Label htmlFor={`attachment-${item.attachment!.id}`} style={{ color: 'black' }}>
                            {item.module.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2" style={{ color: 'black' }}>Optional</h4>
                    <div className="space-y-2">
                      {contractStructure.filter(item => item.attachment?.type === 'zusatz').map(item => (
                        <div key={item.attachment!.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`attachment-${item.attachment!.id}`}
                            checked={selectedAttachmentIds.includes(item.attachment!.id)}
                            onCheckedChange={(checked) => {
                              setSelectedAttachmentIds(prev => 
                                checked 
                                  ? [...prev, item.attachment!.id] 
                                  : prev.filter(id => id !== item.attachment!.id)
                              );
                            }}
                          />
                          <Label htmlFor={`attachment-${item.attachment!.id}`} style={{ color: 'black' }}>
                            {item.module.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: 0, border: 'none', backgroundColor: '#F6F8FF', borderTop: '4px solid #FF8EB7' }}>
                <CardHeader>
                  <CardTitle>Variablen</CardTitle>
                  <CardDescription>Füllen Sie die Platzhalter für den Vertrag aus.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uniqueVariables.map(variable => (
                    <div key={variable.key} className="space-y-2">
                      <Label htmlFor={`var-${variable.key}`} style={{ color: 'black' }}>{variable.name}</Label>
                      <Input
                        id={`var-${variable.key}`}
                        value={variableValues[variable.key] || ''}
                        onChange={(e) => setVariableValues(prev => ({ ...prev, [variable.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={67}>
          <main className="flex-1 h-full bg-muted/40 flex justify-center">
            <ScrollArea className="h-full w-full" style={{ backgroundColor: 'white' }}>
              <div className="w-full max-w-4xl mx-auto my-6">
                <Card className="shadow-lg" style={{ borderRadius: 0, border: 'none' }}>
                  <CardHeader>
                    <CardTitle style={{ color: 'black' }}>Live-Vorschau</CardTitle>
                    <CardDescription>
                      Vorschau des generierten Vertrags - Variable Felder sind gelb markiert
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div 
                      ref={previewRef}
                      id="contract-viewer-for-export"
                      className="a4-preview-frame contract-preview shadow-inner overflow-y-auto h-[70vh]"
                      style={{ lineHeight: '1.6' }} // fontFamily wird jetzt von CSS gesteuert
                      dangerouslySetInnerHTML={{ 
                        __html: generatePreview() // Nur noch die reine HTML-Vorschau
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>PDF exportieren</AlertDialogTitle>
            <AlertDialogDescription>
              Geben Sie einen Dateinamen für den PDF-Export ein.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="pdf-filename">Dateiname</Label>
            <p className="text-sm font-medium p-2 bg-muted rounded-md mt-1">{variableValues.title || 'vertrag'}.pdf</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleExportPdf} disabled={isLoading} style={{ backgroundColor: '#8C5AF5', color: 'white' }}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportiere...</> : 'Exportieren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isOutlineSheetOpen} onOpenChange={setIsOutlineSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Gliederung</SheetTitle>
            <SheetDescription>
              Klicken Sie auf einen Abschnitt, um dorthin zu springen.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <ul className="py-4">
              {outline.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setIsOutlineSheetOpen(false);
                    }}
                    className="block p-2 text-sm hover:bg-accent rounded"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}