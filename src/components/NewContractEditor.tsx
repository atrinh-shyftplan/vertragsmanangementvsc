import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, ArrowLeft, Save, X, PanelLeftClose, PanelRightClose, BookOpen, FileDown } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { VariableInputRenderer } from '@/components/admin/VariableInputRenderer';
import { Checkbox } from '@/components/ui/checkbox';
import * as yup from 'yup';
import { Attachment, ContractModule, Database } from '@/integrations/supabase/types';

type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];

const getValidationSchema = (
  status: string,
  modules: ContractModule[],
  allContractModules: any[],
  globalVars: any[],
  allAttachments: Attachment[]
) => {
  const isDraft = status === 'draft';

  // Grundschema, das jetzt für ALLE Status die Produktauswahl erfordert.
  let schema = yup.object({
    title: yup.string().required('Titel ist ein Pflichtfeld.'),
    assigned_to_user_id: yup.string().required('Zuständiger Ansprechpartner ist ein Pflichtfeld.'),
    status: yup.string().required('Status ist ein Pflichtfeld.'),
    selectedAttachmentIds: yup.array().of(yup.string())
      .test(
        'has-product',
        'Mindestens ein Produkt muss ausgewählt werden.',
        (ids) => {
          // --- DEBUGGING START ---
          console.log("%c--- Validierungs-Check ---", "color: blue; font-weight: bold;");
          console.log("1. IDs, die validiert werden:", ids);
          console.log("2. Alle Anhänge, die zur Prüfung bereitstehen:", allAttachments);
          
          if (!ids) return false;
          
          const selected = ids.map(id => allAttachments.find(a => a.id.toString() === id)).filter(Boolean);
          
          console.log("3. Gefundene Anhang-Objekte:", selected);
          const hasProduct = selected.some(a => a!.type === 'produkt');
          console.log("4. Ergebnis: Hat es ein Produkt?", hasProduct);
          console.log("%c--------------------------", "color: blue; font-weight: bold;");
          // --- DEBUGGING END ---

          return hasProduct;
        }
      ).required('Produktauswahl ist ein Pflichtfeld.'),
  });

  // Wenn der Status NICHT "Entwurf" ist, fügen wir die zusätzlichen Pflichtfelder hinzu.
  if (!isDraft) {
    const requiredFieldsShape: { [key: string]: yup.AnySchema } = {
      start_date: yup.string().required('Startdatum ist ein Pflichtfeld.'),
      end_date: yup.string().required('Enddatum ist ein Pflichtfeld.'),
    };

    // Dynamische Validierung für alle Variablen in den Modulen
    modules.forEach(module => {
      if (module) {
        let moduleJsonVars: any[] = [];
        if (module.variables) {
          if (Array.isArray(module.variables)) {
            moduleJsonVars = module.variables;
          } else if (typeof module.variables === 'string' && module.variables.trim()) {
            try {
              const parsed = JSON.parse(module.variables as string);
              if (Array.isArray(parsed)) {
                moduleJsonVars = parsed;
              }
            } catch (e) {
              console.error(`Failed to parse variables for module ${module.key}:`, e);
            }
          }
        }
        moduleJsonVars.forEach((variable: any) => {
          if (variable && typeof variable.key === 'string') {
            requiredFieldsShape[variable.key] = yup.string().required(`Das Feld "${variable.name_de || variable.key}" ist erforderlich.`);
          }
        });

        const contentVariables = extractVariablesFromContent(module.content_de || '');
        contentVariables.forEach(variableKey => {
          if (!requiredFieldsShape[variableKey]) {
            requiredFieldsShape[variableKey] = yup.string().required(`Die Variable "${variableKey}" ist ein Pflichtfeld.`);
          }
        });
      }
    });
    
    // Kombiniere das Basisschema mit den zusätzlichen Regeln
    schema = schema.concat(yup.object(requiredFieldsShape));
  }

  return schema;
};

interface NewContractEditorProps {
  onClose?: () => void;
}

// Function to extract variables from module content
const extractVariablesFromContent = (content: string) => {
  if (!content) return [];
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '').trim()) : [];
};

export default function NewContractEditor({ onClose }: NewContractEditorProps) {
  const { contractTypes, contractModules, contractCompositions, globalVariables } = useAdminData();
  const [selectedType, setSelectedType] = useState<string>('');
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isOutlineSheetOpen, setIsOutlineSheetOpen] = useState(false);
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<ImperativePanelHandle>(null);
  
  // Holds all modules for the selected contract type, including attachment info
  const [contractStructure, setContractStructure] = useState<{
    composition: ContractComposition;
    module: ContractModule;
    attachment?: Attachment;
  }[]>([]);

  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);

  const handleTypeSelect = (typeKey: string) => {
    setSelectedType(typeKey);
    
    // Reset modules and variables when type changes
    setVariableValues({});
    setShowDetails(true);
  };

  // Load users on component mount
  useEffect(() => {
    const loadData = async () => {
      const loadUsers = async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data, error } = await supabase.from('profiles').select('*').order('display_name');
          if (error) throw error;
          setUsers(data || []);
        } catch (error) {
          console.error('Error loading users:', error);
        }
      };
      loadUsers();
    };
    
    loadData();
  }, []);

  // NEUER, KORREKTER useEffect ZUM LADEN DER DATEN
  useEffect(() => {
    // Diese Funktion wird NUR ausgeführt, wenn sich der 'selectedType' ändert.
    const loadDataForType = async () => {
      if (!selectedType) {
        setContractStructure([]); // Leeren, wenn kein Typ ausgewählt ist
        return;
      }

      const type = contractTypes.find(t => t.key === selectedType);
      if (!type) return;

      const { supabase } = await import('@/integrations/supabase/client');

      // 1. Lade die Struktur (contract_compositions)
      const { data: compositionsData, error: compositionsError } = await supabase
        .from('contract_compositions')
        .select('*')
        .eq('contract_type_key', type.key)
        .order('sort_order');

      if (compositionsError) {
        toast.error('Fehler beim Laden der Vertragsstruktur.');
        return;
      }

      // 2. Lade alle zugehörigen Anhänge (attachments)
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .eq('contract_type_id', type.id);

      if (attachmentsError) {
        toast.error('Fehler beim Laden der Anhänge.');
      }

      const attachmentsMap = new Map<string, Attachment>();
      if (attachmentsData) {
        for (const att of attachmentsData) {
          attachmentsMap.set(att.module_id, att);
        }
      }

      // 3. Baue die finale Struktur zusammen
      const fullStructure = (compositionsData || []).map(comp => {
        const module = contractModules.find(m => m.key === comp.module_key);
        if (!module) return null;
        const attachment = attachmentsMap.get(module.id);
        return { composition: comp, module, attachment: attachment || undefined };
      }).filter(Boolean) as typeof contractStructure;

      setContractStructure(fullStructure);

      // 4. Setze NUR die festen Anhänge als Standard-Auswahl.
      // Deine Produktauswahl wird diesen Wert später einfach ergänzen.
      const fixedAttachmentIds = fullStructure
        .filter(item => item.attachment?.type === 'fest')
        .map(item => item.attachment!.id);
      setSelectedAttachmentIds(fixedAttachmentIds);
    };

    loadDataForType();
    
  }, [selectedType]); // <-- DAS IST DER SCHLÜSSEL: Stabil und korrekt.

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

  useEffect(() => {
    const selectedModules = contractStructure.filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id)).map(item => item.module);
    const status = variableValues.status || 'draft';
    const schema = getValidationSchema(status, selectedModules, contractModules, globalVariables, contractStructure.map(cs => cs.attachment).filter(Boolean) as Attachment[]);
    const description = schema.describe();
    setRequiredFields(Object.keys(description.fields));
  }, [variableValues.status, contractStructure, selectedAttachmentIds, contractModules, globalVariables]);


  const processContent = (content: string, moduleVariables: any[] = []) => {
    let processedContent = content;
    
    // Replace global variables with highlighted spans
    globalVariables.forEach((variable) => {
      const variableName = variable.key;
      const value = variableValues[variableName] || '';
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    });
    
    // Also process the gueltig_bis variable specifically
    if (variableValues.gueltig_bis) {
      const displayDate = variableValues.gueltig_bis_formatted || variableValues.gueltig_bis;
      const regex = new RegExp(`{{gueltig_bis}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${displayDate}</span>`);
    }
    
    // Replace module-specific variables with highlighted spans
    moduleVariables.forEach((variable) => {
      const variableName = (variable.name || variable.key);
      if (!variableName) return;
      const value = variableValues[variableName] || '';
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 px-1 rounded">${value}</span>`);
    });
    
    return processedContent;
  };

  // Generate contract preview with variable substitution
  const generatePreview = () => {
    let preview = '';
    
    const modulesToRender = contractStructure.filter(item => {
      // Always include modules that are not selectable attachments
      if (!item.attachment) return true;
      // Include selectable attachments if their ID is in the selected list
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
    
    // Process regular modules first
    regularModules.forEach((module) => {
      preview += renderSimpleModule(module, false, 0);
    });
    
    // Process annex modules with proper numbering
    annexModules.forEach((module, index) => {
      const annexNumber = index + 1;
      preview += renderSimpleModule(module, true, annexNumber);
    });
    
    return preview || '<p class="text-gray-500">Keine Inhalte verfügbar</p>';
  };

  // Function to parse content into logical blocks based on paragraph markers
  const parseContentIntoBlocks = (content: string) => {
    if (!content || content.trim() === '') return [];
    
    // Regex pattern to match paragraph markers like § 1, (1), 1., 3.2, 3.2.1, etc.
    // This matches:
    // - § followed by numbers and dots (§ 1, § 3.2)
    // - Numbers in parentheses ((1), (2))
    // - Numbers followed by dots (1., 2., 3.2.1.)
    // - Roman numerals followed by dots (I., II., III.)
    const paragraphPattern = /^(\s*(?:§\s*\d+(?:\.\d+)*|(\d+(?:\.\d+)*\.?|\([0-9]+\)|[IVX]+\.)))/gm;
    
    const blocks = [];
    let lastIndex = 0;
    let match;
    
    // Reset the regex
    paragraphPattern.lastIndex = 0;
    
    while ((match = paragraphPattern.exec(content)) !== null) {
      // If there's content before this match, add it as a block
      if (match.index > lastIndex) {
        const beforeContent = content.substring(lastIndex, match.index).trim();
        if (beforeContent) {
          blocks.push(beforeContent);
        }
      }
      
      // Find the start of the next paragraph or end of content
      const nextMatch = paragraphPattern.exec(content);
      let blockEnd;
      
      if (nextMatch) {
        blockEnd = nextMatch.index;
        // Reset for next iteration
        paragraphPattern.lastIndex = nextMatch.index;
      } else {
        blockEnd = content.length;
      }
      
      // Extract the complete paragraph block
      const blockContent = content.substring(match.index, blockEnd).trim();
      if (blockContent) {
        blocks.push(blockContent);
      }
      
      lastIndex = blockEnd;
      
      if (!nextMatch) break;
    }
    
    // Add any remaining content
    if (lastIndex < content.length) {
      const remaining = content.substring(lastIndex).trim();
      if (remaining) {
        blocks.push(remaining);
      }
    }
    
    // If no blocks were found, return the entire content as one block
    return blocks.length > 0 ? blocks : [content.trim()];
  };

  // Simplified module rendering function with intelligent paragraph alignment
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
    
    // A module is empty if it has no title and no content, unless it's the special header
    if (module.key !== 'Header Sales' && !hasGermanTitle && !hasEnglishTitle && !hasGermanContent && !hasEnglishContent) {
      return '';
    }

    // Special handling for Header Sales module
    const isHeaderModule = module.key === 'Header Sales';
    
    let moduleHtml = '';
    
    if (isHeaderModule) {
      moduleHtml += `<div class="mb-8 not-prose flex justify-center">`;
      moduleHtml += `<div class="header-content" style="text-align: center; margin: 0 auto; max-width: 800px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: white;">`; // Stile beibehalten
    } else {
      moduleHtml += `<div class="mb-8">`;
    }
    
    const isBilingual = (hasGermanContent || hasGermanTitle) && (hasEnglishContent || hasEnglishTitle);

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
    } else if (hasGermanContent || hasGermanTitle) {
      // German only
      moduleHtml += `<div class="german-content">`;
      if (!isHeaderModule && hasGermanTitle) {
        const displayTitle = isAnnex ? `Anhang ${annexNumber}: ${module.title_de}` : module.title_de;
        moduleHtml += `<h3>${displayTitle}</h3>`;
      }
      if (hasGermanContent) {
        moduleHtml += `<div>${processContent(module.content_de, moduleVariables)}</div>`;
      }
      moduleHtml += `</div>`;
    } else if (hasEnglishContent || hasEnglishTitle) {
      // English only
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
      moduleHtml += `</div>`; // Close centering wrapper
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
    // --- DEBUGGING START ---
    console.log("%c--- Speichervorgang gestartet ---", "color: green; font-weight: bold;");
    console.log("Aktuell ausgewählte Attachment-IDs:", selectedAttachmentIds);
    const attachmentsForValidation = contractStructure.map(cs => cs.attachment).filter(Boolean) as Attachment[];
    console.log("Anhänge, die an den Validator gesendet werden:", attachmentsForValidation);
    console.log("%c----------------------------------", "color: green; font-weight: bold;");
    // --- DEBUGGING END ---
    const selectedModules = contractStructure.filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id)).map(item => item.module);
    const validationSchema = getValidationSchema(
      variableValues.status || 'draft',
      selectedModules,
      contractModules,
      globalVariables,
      contractStructure.map(cs => cs.attachment).filter(Boolean) as Attachment[]
    );

    try {
      await validationSchema.validate(
        { ...variableValues, selectedAttachmentIds: selectedAttachmentIds },
        { abortEarly: false } // Collect all errors
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

      // 1. Prepare and insert main contract data
      const contractData = {
        title: variableValues.title,
        status: (variableValues.status || 'draft'),
        value: parseFloat(variableValues.value) || 0,
        start_date: variableValues.start_date || null,
        end_date: variableValues.end_date || null,
        assigned_to: variableValues.assigned_to || 'Unassigned',
        description: `${contractTypes.find(t => t.key === selectedType)?.name_de || 'Vertrag'}`,
        tags: [contractTypes.find(t => t.key === selectedType)?.name_de || 'Vertrag'],
        progress: variableValues.status === 'draft' ? 0 : 25,
        contract_type_key: selectedType,
        assigned_to_user_id: variableValues.assigned_to_user_id || null,
        template_variables: variableValues, // Products are now in a join table
        global_variables: Object.fromEntries(
          globalVariables.map(gv => [gv.key, variableValues[gv.key] || ''])
        )
      };

      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert([contractData])
        .select('id')
        .single();

      if (contractError) throw contractError;
      if (!newContract) throw new Error('Contract creation failed, no contract returned.');

      // 2. Prepare and insert attachment relations
      if (selectedAttachmentIds.length > 0) {
        const contractAttachmentsData = selectedAttachmentIds.map(attachmentId => ({
          contract_id: newContract.id,
          attachment_id: attachmentId,
        }));

        const { error: joinTableError } = await supabase
          .from('contract_attachments')
          .insert(contractAttachmentsData);

        if (joinTableError) throw joinTableError;
      }

      toast.success('Vertrag erfolgreich gespeichert');
      
      // Close modal if callback provided
      onClose?.();
      
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Fehler beim Speichern des Vertrags');
    }
  };

  if (!selectedType || !showDetails) {
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
              onClick={() => handleTypeSelect(type.key)}
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

  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-lg overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold">Vertrag erstellen</h2>
          <p className="text-muted-foreground">
            Typ: {contractTypes.find(t => t.key === selectedType)?.name_de}
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
              setSelectedType('');
              setShowDetails(false);
              setSelectedUser([]);
              setVariableValues({});
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <Button variant="outline" onClick={() => setIsOutlineSheetOpen(true)}>
            <BookOpen className="mr-2 h-4 w-4" />
            Gliederung
          </Button>
          <Button
            variant="outline"
            onClick={() => {
                setPdfFilename(`${variableValues.title || 'Vertrag'}.pdf`);
                setIsPdfDialogOpen(true);
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF Export
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
          minSize={25}
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
                  {/* Grunddaten Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Grunddaten
                    </h4>
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
                        <Label htmlFor="gueltig_bis">Angebot gültig bis</Label>
                        <Input
                          id="gueltig_bis"
                          type="date"
                          value={variableValues.gueltig_bis || ''}
                         onChange={(e) => {
                            const dateValue = e.target.value;
                            // Format date as German date string for variable
                            const formattedDate = dateValue ? 
                              new Date(dateValue).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric'
                              }) : '';
                            
                            setVariableValues(prev => ({
                              ...prev,
                              gueltig_bis: dateValue,
                              gueltig_bis_formatted: formattedDate // Update the variable value for contract content
                            }));
                          }}
                          placeholder="Gültigkeitsdatum"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zuständigkeit Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Zuständigkeit
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="assigned_to_user_id">Zuständiger Ansprechpartner {requiredFields.includes('assigned_to_user_id') && <span className="text-destructive">*</span>}</Label>
                        <Select
                          value={variableValues.assigned_to_user_id || ''}
                         onValueChange={(value) => {
                            const user = users.find(u => u.user_id === value);
                            setVariableValues(prev => ({
                              ...prev,
                              assigned_to_user_id: value,
                              assigned_to: user?.display_name || prev.assigned_to || ''
                            }));
                            setSelectedUser(user || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ansprechpartner auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.user_id}>
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

              {/* Module Variables using VariableInputRenderer */}
              <Card>
                <CardHeader>
                  <CardTitle>Vertragsbestandteile</CardTitle>
                  <CardDescription>
                    Stellen Sie die Komponenten des Vertrags zusammen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Feste Bestandteile */}
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

                  {/* Produkte */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Produkte (mindestens eines auswählen)</h4>
                    <div className="space-y-2">
                      {contractStructure.filter(item => item.attachment?.type === 'produkt').map(item => (
                        <div key={item.attachment!.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`attachment-${item.attachment!.id}`}
                            checked={selectedAttachmentIds.includes(item.attachment!.id)}
                            onCheckedChange={(checked) => {
                              // --- NEUER SPION ---
                              console.log(`%cProdukt-Checkbox geklickt: ${item.module.name}, Checked: ${checked}, ID: ${item.attachment!.id}`, "color: purple; font-weight: bold;");
                              
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

                  {/* Optionale Zusatzleistungen */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Optionale Zusatzleistungen</h4>
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
                selectedModules={contractStructure.filter(item => !item.attachment || selectedAttachmentIds.includes(item.attachment.id)).map(item => item.module)}
                globalVariables={globalVariables.filter(v => v.key !== 'gueltig_bis')}
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

        {/* Preview Panel - larger width */}
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
                      className="prose prose-sm sm:prose-base max-w-none bg-white p-6 rounded-lg h-[70vh] overflow-y-auto border border-gray-200 shadow-inner contract-preview"
                      style={{ lineHeight: '1.6', fontFamily: 'Arial, sans-serif' }}
                      dangerouslySetInnerHTML={{ 
                        __html: `
                        <style>
                          /* Ensure consistent heading sizes with editor */
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

                          /* Side-by-side table layout - prose-compatible */
                          .contract-preview .side-by-side-table {
                            width: 100%;
                            margin: 1.5rem 0;
                          }
                          
                          .contract-preview .table-content-de,
                          .contract-preview .table-content-en {
                            vertical-align: top;
                          }
                          
                          /* Ensure prose styles work within table cells */
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
                          /* Header content table styling - unchanged */
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
                          /* FORCE BLACK BULLETS AND TEXT IN PREVIEW */
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
                          .contract-preview ul li::marker {
                            color: #000000 !important;
                            content: "●" !important;
                          }
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
                          /* Force all content to be black */
                          .contract-preview * {
                            color: #000000 !important;
                          }
                          /* Override any white or transparent colors */
                          .contract-preview li::before {
                            color: #000000 !important;
                          }
                          /* Specific override for list markers */
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
            <Input
              id="pdf-filename"
              value={pdfFilename}
              onChange={(e) => setPdfFilename(e.target.value)}
              placeholder="Dateiname.pdf"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const previewElement = previewRef.current;
                if (previewElement && pdfFilename) {
                  const { generatePdf: exportToPdf } = await import('@/lib/pdf-export');
                  await exportToPdf(previewElement, pdfFilename);
                }
              }}
            >
              Exportieren
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