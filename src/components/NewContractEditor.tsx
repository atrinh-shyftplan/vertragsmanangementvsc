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
import { VariableInputRenderer } from '@/components/admin/VariableInputRenderer';
import { Checkbox } from '@/components/ui/checkbox';
import * as yup from 'yup';
import type { Attachment, ContractModule, Database } from '@/integrations/supabase/types';

type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];

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
        const contentVariables = extractVariablesFromContent(module.content_de || '');
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

  const processContent = (content: string, moduleVariables: any[] = []) => {
    let processedContent = content;

    globalVariables.forEach((variable) => {
      const variableName = variable.key;
      const value = variableValues[variableName] || '';
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    });
    
    if (variableValues.gueltig_bis) {
      const displayDate = variableValues.gueltig_bis_formatted || variableValues.gueltig_bis;
      const regex = new RegExp(`{{gueltig_bis}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${displayDate}</span>`);
    }
    
    // Replace module-specific variables with highlighted spans
    (moduleVariables || []).forEach((variable) => {
      const variableName = (variable.name || variable.key);
      if (!variableName) return;
      const value = variableValues[variableName] || '';
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    });
    
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
    let moduleVariables = [];
    try {
      if (module.variables) {
        if (Array.isArray(module.variables)) {
          moduleVariables = module.variables;
        } else if (typeof module.variables === 'string' && module.variables.trim()) {
          const parsed = JSON.parse(module.variables);
          if (Array.isArray(parsed)) {
            moduleVariables = parsed;
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse module variables:', error);
      moduleVariables = [];
    }
    
    const hasGermanContent = (module.content_de || '').trim().length > 0;
    const hasEnglishContent = (module.content_en || '').trim().length > 0;
    const hasGermanTitle = (module.title_de || '').trim().length > 0;
    const hasEnglishTitle = (module.title_en || '').trim().length > 0;

    if (module.key !== 'Header Sales' && !hasGermanTitle && !hasEnglishTitle && !hasGermanContent && !hasEnglishContent) {
      return '';
    }
    const isHeaderModule = module.key === 'Header Sales';
    
    let moduleHtml = '';
    
    if (isHeaderModule) {
      moduleHtml += `<div class="mb-8 not-prose flex justify-center">`;
      moduleHtml += `<div class="header-content" style="text-align: center; margin: 0 auto; max-width: 800px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: white;">`; // Stile beibehalten
    } else {
      moduleHtml += `<div class="mb-8">`;
    }
    // Finale Korrektur: Ein Modul ist nur dann zweisprachig, wenn BEIDE Inhaltsfelder (content_de und content_en)
    // Text enthalten. Titel allein lösen die zweispaltige Ansicht nicht mehr aus.
    const isBilingual = hasGermanContent && hasEnglishContent;

    if (isBilingual) {
      moduleHtml += `<div class="grid grid-cols-2 side-by-side-table">`;
      // German column
      let germanColumn = `<div class="german-content pr-4 border-r border-gray-200">`;
      if (!isHeaderModule && hasGermanTitle) {
        const displayTitleDe = isAnnex ? `Anhang ${annexNumber}: ${module.title_de}` : module.title_de;
        germanColumn += `<h3>${displayTitleDe}</h3>`;
      }
      if (hasGermanContent) {
        germanColumn += `<div>${processContent(module.content_de, moduleVariables)}</div>`;
      }
      germanColumn += `</div>`;
      moduleHtml += germanColumn;
      // English column
      let englishColumn = `<div class="pl-4">`;
      if (!isHeaderModule && hasEnglishTitle) {
        const displayTitleEn = isAnnex ? `Annex ${annexNumber}: ${module.title_en}` : module.title_en;
        englishColumn += `<h3>${displayTitleEn}</h3>`;
      }
      if (hasEnglishContent) {
        englishColumn += `<div>${processContent(module.content_en, moduleVariables)}</div>`;
      }
      englishColumn += `</div>`;
      moduleHtml += englishColumn;
      moduleHtml += `</div>`;
    } else if (hasGermanContent || hasGermanTitle) { // German only
      moduleHtml += `<div class="german-content">`;
      if (!isHeaderModule && hasGermanTitle) {
        const displayTitle = isAnnex ? `Anhang ${annexNumber}: ${module.title_de}` : module.title_de;
        moduleHtml += `<h3>${displayTitle}</h3>`;
      }
      if (hasGermanContent) {
        moduleHtml += `<div>${processContent(module.content_de, moduleVariables)}</div>`;
      }
      moduleHtml += `</div>`;
    } else if (hasEnglishContent || hasEnglishTitle) { // English only
      moduleHtml += `<div>`;
      if (!isHeaderModule && hasEnglishTitle) {
        const displayTitle = isAnnex ? `Annex ${annexNumber}: ${module.title_en}` : module.title_en;
        moduleHtml += `<h3>${displayTitle}</h3>`;
      }
      if (hasEnglishContent) {
        moduleHtml += `<div>${processContent(module.content_en, moduleVariables)}</div>`;
      }
      moduleHtml += `</div>`;
    }
    
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

    // 1. Finde den Container mit dem Vertragsinhalt
    const viewerElement = document.getElementById('contract-viewer-for-export');
    if (!viewerElement) {
      console.error('Export-Container nicht gefunden.');
      setIsLoading(false);
      return;
    }

    // 2. Erstelle eine saubere Kopie des HTMLs
    const cleanHtml = viewerElement.innerHTML
      .replace(/class="variable-highlight"/g, '');

    // 3. Lade unsere speziellen Druck-Styles (als rohen Text)
    const printStyles = await import('../lib/print-styles.css?raw');

    // 4. Bereite das finale HTML-Dokument für den Server vor
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${printStyles.default}</style>
          <style>
            /* Basis-Stile, um ein sauberes Layout zu gewährleisten */
            body { font-family: sans-serif; line-height: 1.6; }
            .prose { max-width: 100%; }
            img { max-width: 100%; height: auto; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid #e2e8f0; padding: 8px; }
          </style>
        </head>
        <body>
          <div class="prose">${cleanHtml}</div>
        </body>
      </html>
    `;

    try {
      // 5. Rufe die Supabase Edge Function auf
      const { data, error } = await supabase.functions.invoke('pdf-export', {
        body: { htmlContent: fullHtml },
      });

      if (error) throw error;

      // 6. Starte den Download der erhaltenen PDF-Datei
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${variableValues.title || 'vertrag'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      toast.error('Fehler beim PDF-Export: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setIsPdfDialogOpen(false);
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
    <div className="flex flex-col h-full bg-muted/30 rounded-lg overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold">Vertrag erstellen</h2>
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
          <Button onClick={saveContract}>
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
              <Card>
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
                        <Label htmlFor="title">Titel {requiredFields.includes('title') && <span className="text-destructive">*</span>}</Label>
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
                        <Label htmlFor="client">Name des Unternehmens {requiredFields.includes('client') && <span className="text-destructive">*</span>}</Label>
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
                        <Label htmlFor="gueltig_bis">Angebot gültig bis {requiredFields.includes('gueltig_bis') && <span className="text-destructive">*</span>}</Label>
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
                        <Label htmlFor="assigned_to_profile_id">Zuständiger Ansprechpartner {requiredFields.includes('assigned_to_profile_id') && <span className="text-destructive">*</span>}</Label>
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
                        <Label htmlFor="status">Status {requiredFields.includes('status') && <span className="text-destructive">*</span>}</Label>
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

              <Card>
                <CardHeader>
                  <CardTitle>Vertragsbestandteile</CardTitle>
                  <CardDescription>
                    Stellen Sie die Komponenten des Vertrags zusammen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Feste Bestandteile</h4>
                    <div className="space-y-2">
                      {contractStructure.filter(item => item.attachment?.type === 'fest').map(item => (
                        <div key={item.attachment!.id} className="flex items-center space-x-2 opacity-70">
                          <Checkbox
                            id={`attachment-${item.attachment!.id}`}
                            checked={true}
                            disabled={true}
                          />
                          <Label htmlFor={`attachment-${item.attachment!.id}`} className="cursor-not-allowed">
                            {item.module.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Produkte (mindestens eines auswählen) {requiredFields.includes('selectedAttachmentIds') && <span className="text-destructive">*</span>}</h4>
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
                          <Label htmlFor={`attachment-${item.attachment!.id}`}>
                            {item.module.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Optional</h4>
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
                          <Label htmlFor={`attachment-${item.attachment!.id}`}>
                            {item.module.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <VariableInputRenderer
                selectedModules={contractStructure
                  .filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id))
                  .map(item => item.module)}
                globalVariables={globalVariables}
                requiredFields={requiredFields}
                variableValues={variableValues}
                onVariableChange={(key, value) => setVariableValues(prev => ({
                  ...prev,
                  [key]: value
                }))}
              />
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={67}>
          <main className="flex-1 h-full bg-muted/40 flex justify-center">
            <ScrollArea className="h-full w-full">
              <div className="w-full max-w-4xl mx-auto my-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Live-Vorschau</CardTitle>
                    <CardDescription>
                      Vorschau des generierten Vertrags - Variable Felder sind gelb markiert
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div 
                      ref={previewRef}
                      id="contract-viewer-for-export"
                      className="prose prose-sm sm:prose-base max-w-none bg-white p-6 rounded-lg h-[70vh] overflow-y-auto border border-gray-200 shadow-inner contract-preview"
                      style={{ lineHeight: '1.6', fontFamily: 'Arial, sans-serif' }}
                      dangerouslySetInnerHTML={{ 
                        __html: `
                        <style>
                          .contract-preview h1 {
                            font-size: 1.5rem !important; /* text-2xl */
                          }
                          .contract-preview h2 {
                            font-size: 1.25rem !important; /* text-xl */
                          }
                          .contract-preview h3 {
                            font-size: 1.125rem !important; /* text-lg */
                            font-weight: 700 !important;
                            color: #1f2937 !important;
                            margin-top: 0 !important;
                            margin-bottom: 0.75rem !important; /* mb-3 */
                          }

                          .contract-preview .side-by-side-table {
                            width: 100%;
                            margin: 1.5rem 0;
                          }
                          .contract-preview .table-content-de,
                          .contract-preview .table-content-en {
                            vertical-align: top;
                          }
                          .contract-preview .table-content-de p,
                          .contract-preview .table-content-en p {
                            margin: 0.75rem 0;
                          }
                          .contract-preview .table-content-de ul,
                          .contract-preview .table-content-en ul {
                            margin: 0.75rem 0;
                            padding-left: 1.5rem;
                            list-style-type: disc;
                          }
                          .contract-preview .table-content-de ol,
                          .contract-preview .table-content-en ol {
                            margin: 0.75rem 0;
                            padding-left: 1.5rem;
                            list-style-type: decimal;
                          }
                          .contract-preview .table-content-de li,
                          .contract-preview .table-content-en li {
                            margin: 0.25rem 0;
                          }
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                          .header-content table td {
                            padding: 8px 12px;
                            vertical-align: top;
                            border: 1px solid #e5e7eb;
                          }
                          .header-content table td:first-child {
                            font-weight: 600;
                            background-color: #f9fafb;
                            width: 40%;
                          }
                          .header-content .company-logo {
                            font-size: 24px;
                            font-weight: bold;
                            color: #1f2937;
                            margin-bottom: 30px;
                          }
                          .header-content .offer-info-block {
                            margin: 25px 0;
                            padding: 15px;
                            background-color: white;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                          }
                          .header-content .convenience-block {
                            margin: 25px 0;
                            padding: 15px;
                            background-color: white;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            border-style: dashed;
                          }
                          .header-content .company-section {
                            margin: 30px 0;
                            padding: 20px;
                            background-color: white;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                          }
                          .header-content .company-divider {
                            margin: 40px 0;
                            height: 2px;
                            background-color: #e5e7eb;
                            border-radius: 1px;
                          }
                          .header-content .info-line {
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            padding: 6px 10px;
                            background-color: #f8fafc;
                            border-radius: 4px;
                            border-left: 4px solid #3b82f6;
                          }
                          .header-content .info-label {
                            font-weight: 600;
                            color: #374151;
                            min-width: 120px;
                          }
                          .header-content .info-value {
                            color: #1f2937;
                          }
                          .header-content p {
                            margin: 8px 0;
                            line-height: 1.5;
                          }
                          .header-content strong {
                            font-weight: 600;
                          }
                          .header-content .between-text {
                            margin: 30px 0 20px 0;
                            font-size: 14px;
                            color: #6b7280;
                            font-style: italic;
                          }
                    .contract-preview ul {
                      list-style-type: disc !important;
                      padding-left: 1.5rem !important;
                      margin: 0.5rem 0 !important;
                      color: #000000 !important;
                    }
                    .contract-preview ul li {
                      color: #000000 !important;
                      margin: 0.25rem 0 !important;
                    }
                    .contract-preview ul li::marker { color: #000000 !important; content: "●" !important; }
                    .contract-preview ol {
                            padding-left: 1.5rem !important;
                            margin: 0.5rem 0 !important;
                            color: #000000 !important;
                          }
                          .contract-preview ol li {
                            color: #000000 !important;
                            margin: 0.25rem 0 !important;
                          }
                          .contract-preview p {
                            color: #000000 !important;
                            margin: 0.5rem 0 !important;
                          }
                    .contract-preview * {
                      color: #000000 !important;
                    }
                    .contract-preview li::before {
                      color: #000000 !important;
                    }
                    .contract-preview ul > li::marker,
                    .contract-preview ol > li::marker {
                            color: #000000 !important;
                            font-weight: bold !important;
                          }
                        </style>
                        ${generatePreview()}
                        ` 
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
            <AlertDialogAction onClick={handleExportPdf} disabled={isLoading}>
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