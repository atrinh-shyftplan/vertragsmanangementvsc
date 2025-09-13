import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText, ArrowLeft, Save, X } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { VariableInputRenderer } from '@/components/admin/VariableInputRenderer';
import { Checkbox } from '@/components/ui/checkbox';

interface SelectedModule {
  moduleKey: string;
  order: number;
}

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
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['core']);

  const handleTypeSelect = (typeKey: string) => {
    setSelectedType(typeKey);
    
    // Reset modules and variables when type changes
    setSelectedModules([]);
    setVariableValues({});
    
    // Get compositions for this type
    const compositions = contractCompositions
      .filter(comp => comp.contract_type_key === typeKey)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    // Filter compositions based on selected products and set as selected modules
    const filteredCompositions = compositions.filter(comp => {
      const module = contractModules.find(m => m.key === comp.module_key);
      if (!module || !module.is_active) return false;
      
      const moduleTags = module.product_tags || ['core'];
      return moduleTags.some(tag => selectedProducts.includes(tag));
    });
    
    const modules = filteredCompositions.map(comp => ({
      moduleKey: comp.module_key,
      order: comp.sort_order
    }));
    
    setSelectedModules(modules);
    setShowDetails(true);
    
    console.log('Selected type:', typeKey);
    console.log('Available compositions:', compositions);
    console.log('Filtered modules:', modules);
  };

  // Update modules when product selection changes
  useEffect(() => {
    if (selectedType) {
      const compositions = contractCompositions
        .filter(comp => comp.contract_type_key === selectedType)
        .sort((a, b) => a.sort_order - b.sort_order);
      
      const filteredCompositions = compositions.filter(comp => {
        const module = contractModules.find(m => m.key === comp.module_key);
        if (!module || !module.is_active) return false;
        
        const moduleTags = module.product_tags || ['core'];
        return moduleTags.some(tag => selectedProducts.includes(tag));
      });
      
      const modules = filteredCompositions.map(comp => ({
        moduleKey: comp.module_key,
        order: comp.sort_order
      }));
      
      setSelectedModules(modules);
    }
  }, [selectedProducts, contractCompositions, contractModules, selectedType]);

  const processContent = (content: string, moduleVariables: any[] = []) => {
    let processedContent = content;
    
    // Replace global variables with highlighted spans
    globalVariables.forEach((variable) => {
      const variableName = variable.key;
      const value = variableValues[variableName] || variableName;
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 border-2 border-yellow-400 px-1 rounded">${value}</span>`);
    });
    
    // Also process the gueltig_bis variable specifically
    if (variableValues.gueltig_bis) {
      const regex = new RegExp(`{{gueltig_bis}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 border-2 border-yellow-400 px-1 rounded">${variableValues.gueltig_bis}</span>`);
    }
    
    // Replace module-specific variables with highlighted spans
    moduleVariables.forEach((variable) => {
      const variableName = (variable.name || variable.key);
      if (!variableName) return;
      const value = variableValues[variableName] || variableName;
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      processedContent = processedContent.replace(regex, `<span class="bg-yellow-200 border-2 border-yellow-400 px-1 rounded">${value}</span>`);
    });
    
    return processedContent;
  };

  // Generate contract preview with variable substitution
  const generatePreview = () => {
    let preview = '';
    
    // Filter modules based on selected products first, then sort
    const filteredSelectedModules = selectedModules
      .filter(selectedModule => {
        const module = contractModules.find(m => m.key === selectedModule.moduleKey);
        if (!module) return false;
        
        // Core modules are always included
        if (module.product_tags?.includes('core')) return true;
        
        // Check if any of the selected products match the module's product tags
        return selectedProducts.some(product => module.product_tags?.includes(product));
      })
      .sort((a, b) => a.order - b.order);
    
    // Separate regular modules from annexes and count annexes for proper numbering
    const regularModules = [];
    const annexModules = [];
    
    filteredSelectedModules.forEach((selectedModule) => {
      const module = contractModules.find(m => m.key === selectedModule.moduleKey);
      if (module) {
        if (module.category === 'anhang') {
          annexModules.push({ selectedModule, module });
        } else {
          regularModules.push({ selectedModule, module });
        }
      }
    });
    
    // Process regular modules first
    regularModules.forEach(({ selectedModule, module }) => {
      preview += renderModule(module, false, 0);
    });
    
    // Process annex modules with proper numbering
    annexModules.forEach(({ selectedModule, module }, index) => {
      const annexNumber = index + 1;
      preview += renderModule(module, true, annexNumber);
    });
    
    return preview || '<p class="text-gray-500">Keine Inhalte verfügbar</p>';
  };

  // Function to parse content into logical blocks with anchor points
  const parseContentIntoBlocks = (htmlContent: string): string[] => {
    if (!htmlContent) return [];
    
    // Split content by main structural elements (paragraphs and headings)
    // These serve as anchor points for alignment
    const anchorPattern = /(<(?:p|h[1-6]|li)(?:\s[^>]*)?>.*?<\/(?:p|h[1-6]|li)>)/gi;
    
    const blocks: string[] = [];
    let lastIndex = 0;
    let match;
    
    // Find all anchor elements and split content into blocks
    while ((match = anchorPattern.exec(htmlContent)) !== null) {
      // Add any content before this anchor as part of the previous block
      // or as a standalone block if it's at the beginning
      if (match.index > lastIndex) {
        const precedingContent = htmlContent.slice(lastIndex, match.index).trim();
        if (precedingContent) {
          if (blocks.length > 0) {
            // Append to previous block
            blocks[blocks.length - 1] += precedingContent;
          } else {
            // Create new block
            blocks.push(precedingContent);
          }
        }
      }
      
      // Start new block with the anchor element
      const anchorContent = match[0];
      
      // Look ahead to find content that belongs to this anchor
      const nextAnchorMatch = anchorPattern.exec(htmlContent);
      let blockEndIndex;
      
      if (nextAnchorMatch) {
        blockEndIndex = nextAnchorMatch.index;
        // Reset regex position for next iteration
        anchorPattern.lastIndex = nextAnchorMatch.index;
      } else {
        blockEndIndex = htmlContent.length;
      }
      
      // Get the full block content (anchor + following content)
      const blockContent = htmlContent.slice(match.index, blockEndIndex).trim();
      blocks.push(blockContent);
      
      lastIndex = blockEndIndex;
    }
    
    // Add any remaining content as the final block
    if (lastIndex < htmlContent.length) {
      const remainingContent = htmlContent.slice(lastIndex).trim();
      if (remainingContent) {
        if (blocks.length > 0) {
          blocks[blocks.length - 1] += remainingContent;
        } else {
          blocks.push(remainingContent);
        }
      }
    }
    
    // If no anchor elements found, treat entire content as one block
    if (blocks.length === 0 && htmlContent.trim()) {
      blocks.push(htmlContent.trim());
    }
    
    return blocks.filter(block => block.trim().length > 0);
  };

  // Helper function to render individual modules with block-aligned content
  const renderModule = (module: any, isAnnex: boolean, annexNumber: number) => {
    let moduleVariables = [];
    try {
      moduleVariables = Array.isArray(module.variables) 
        ? module.variables 
        : (module.variables && module.variables.trim() !== '' ? JSON.parse(module.variables as string) : []) || [];
    } catch (error) {
      console.error('Failed to parse module variables:', error);
      moduleVariables = [];
    }
    
    // Check if content exists (not empty or just whitespace)
    const hasGermanContent = (module.content_de || '').trim().length > 0;
    const hasEnglishContent = (module.content_en || '').trim().length > 0;
    
    // Special handling for Header Sales module - center it and override prose styles
    const isHeaderModule = module.key === 'Header Sales';
    
    let moduleHtml = '';
    
    if (isHeaderModule) {
      moduleHtml += `<div class="mb-8 not-prose flex justify-center">`;
      moduleHtml += `<div class="header-content" style="text-align: center; margin: 0 auto; max-width: 800px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: white;">`;
    } else {
      moduleHtml += `<div class="mb-8">`;
    }
    
    // Add module title
    if (!isHeaderModule && (hasGermanContent || hasEnglishContent)) {
      moduleHtml += `<div class="mb-6">`;
      if (hasGermanContent && hasEnglishContent) {
        // Two-column title layout
        moduleHtml += `<div class="preview-module-grid">`;
        moduleHtml += `<div class="preview-content-de">`;
        const displayTitle = isAnnex ? `Anhang ${annexNumber}: ${module.title_de}` : module.title_de;
        moduleHtml += `<h3 class="text-lg font-bold text-gray-800 mb-4">${displayTitle}</h3>`;
        moduleHtml += `</div>`;
        moduleHtml += `<div class="preview-content-en">`;
        const displayTitleEn = isAnnex ? `Annex ${annexNumber}: ${module.title_en || module.title_de}` : (module.title_en || module.title_de);
        moduleHtml += `<h3 class="text-lg font-bold text-gray-800 mb-4">${displayTitleEn}</h3>`;
        moduleHtml += `</div>`;
        moduleHtml += `</div>`;
      } else {
        // Single column title
        const displayTitle = hasGermanContent 
          ? (isAnnex ? `Anhang ${annexNumber}: ${module.title_de}` : module.title_de)
          : (isAnnex ? `Annex ${annexNumber}: ${module.title_en || module.title_de}` : (module.title_en || module.title_de));
        moduleHtml += `<h3 class="text-lg font-bold text-gray-800 mb-4">${displayTitle}</h3>`;
      }
      moduleHtml += `</div>`;
    }
    
    // Case 1: Both German and English content - block-aligned layout
    if (hasGermanContent && hasEnglishContent) {
      const germanBlocks = parseContentIntoBlocks(processContent(module.content_de, moduleVariables));
      const englishBlocks = parseContentIntoBlocks(processContent(module.content_en, moduleVariables));
      
      // Create aligned rows for each pair of blocks
      const maxBlocks = Math.max(germanBlocks.length, englishBlocks.length);
      
      for (let i = 0; i < maxBlocks; i++) {
        moduleHtml += `<div class="preview-module-grid mb-4">`;
        
        // German block
        moduleHtml += `<div class="preview-content-de">`;
        if (i < germanBlocks.length) {
          moduleHtml += `<div class="text-sm leading-relaxed">${germanBlocks[i]}</div>`;
        }
        moduleHtml += `</div>`;
        
        // English block
        moduleHtml += `<div class="preview-content-en">`;
        if (i < englishBlocks.length) {
          moduleHtml += `<div class="text-sm leading-relaxed">${englishBlocks[i]}</div>`;
        }
        moduleHtml += `</div>`;
        
        moduleHtml += `</div>`;
      }
    }
    // Case 2: Only German content - single-column layout
    else if (hasGermanContent && !hasEnglishContent) {
      moduleHtml += `<div class="space-y-4">`;
      moduleHtml += `<div class="text-sm leading-relaxed">${processContent(module.content_de, moduleVariables)}</div>`;
      moduleHtml += `</div>`;
    }
    // Case 3: Only English content - single-column layout
    else if (!hasGermanContent && hasEnglishContent) {
      moduleHtml += `<div class="space-y-4">`;
      moduleHtml += `<div class="text-sm leading-relaxed">${processContent(module.content_en, moduleVariables)}</div>`;
      moduleHtml += `</div>`;
    }
    
    if (isHeaderModule) {
      moduleHtml += `</div>`; // Close centering wrapper
    }
    moduleHtml += `</div>`;
    
    return moduleHtml;
  };

  const saveContract = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Validate required fields - check if all module variables are filled if status is not draft
      const isDraft = variableValues.status === 'draft';
      const hasRequiredFields = variableValues.title && variableValues.start_date;
      
      if (!hasRequiredFields) {
        toast.error('Bitte füllen Sie alle Pflichtfelder aus');
        return;
      }
      
      // If not draft, check if all required module variables are filled
      if (!isDraft) {
        const requiredVariables = [];
        selectedModules.forEach(sm => {
          const module = contractModules.find(m => m.key === sm.moduleKey);
          if (module) {
            const moduleVariables = Array.isArray(module.variables) 
              ? module.variables 
              : (module.variables ? JSON.parse(module.variables as string) : []);
            
            // Extract variables from content
            const contentVariables = extractVariablesFromContent(module.content_de || '');
            contentVariables.forEach(variable => {
              if (!variableValues[variable]) {
                requiredVariables.push(variable);
              }
            });
          }
        });
        
        if (requiredVariables.length > 0) {
          toast.error(`Folgende Felder müssen ausgefüllt werden: ${requiredVariables.join(', ')}`);
          return;
        }
      }

      // Prepare contract data
      const contractData = {
        title: variableValues.title,
        client: variableValues.client || 'TBD',
        status: (variableValues.status || 'draft'),
        value: parseFloat(variableValues.value) || 0,
        start_date: variableValues.start_date,
        end_date: variableValues.end_date || variableValues.start_date,
        assigned_to: variableValues.assigned_to || 'Unassigned',
        description: `${contractTypes.find(t => t.key === selectedType)?.name_de || 'Vertrag'}`,
        tags: [contractTypes.find(t => t.key === selectedType)?.name_de || 'Vertrag'],
        progress: variableValues.status === 'draft' ? 0 : 25,
        contract_type_key: selectedType,
        template_variables: variableValues,
        global_variables: Object.fromEntries(
          globalVariables.map(gv => [gv.key, variableValues[gv.key] || ''])
        )
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Vertrag erfolgreich gespeichert');
      
      // Reset form
      setSelectedType('');
      setShowDetails(false);
      setSelectedModules([]);
      setVariableValues({});
      
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
    <div className="space-y-6 p-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vertrag bearbeiten</h2>
          <p className="text-muted-foreground">
            Typ: {contractTypes.find(t => t.key === selectedType)?.name_de}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedType('');
              setShowDetails(false);
              setSelectedModules([]);
              setVariableValues({});
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
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
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Fields - smaller width */}
        <div className="space-y-6 lg:col-span-2">
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
                    <Label htmlFor="title">Titel <span className="text-destructive">*</span></Label>
                    <Input
                      id="title"
                      value={variableValues.title || ''}
                      onChange={(e) => setVariableValues(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      placeholder="Vertragstitel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Startdatum <span className="text-destructive">*</span></Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={variableValues.start_date || ''}
                      onChange={(e) => setVariableValues(prev => ({
                        ...prev,
                        start_date: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gueltig_bis">Angebot gültig bis</Label>
                    <Input
                      id="gueltig_bis"
                      type="date"
                      value={variableValues.gueltig_bis || ''}
                      onChange={(e) => setVariableValues(prev => ({
                        ...prev,
                        gueltig_bis: e.target.value
                      }))}
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
                    <Label htmlFor="assigned_to">Zugewiesen an</Label>
                    <Input
                      id="assigned_to"
                      value={variableValues.assigned_to || ''}
                      onChange={(e) => setVariableValues(prev => ({
                        ...prev,
                        assigned_to: e.target.value
                      }))}
                      placeholder="Name des Bearbeiters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
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
                        <SelectItem value="ready_for_review">Bereit zur Prüfung</SelectItem>
                        <SelectItem value="approved">Genehmigt</SelectItem>
                        <SelectItem value="active">Aktiv</SelectItem>
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
              <CardTitle>Produktauswahl</CardTitle>
              <CardDescription>
                Wählen Sie die Produkte aus, für die dieser Vertrag erstellt werden soll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['shyftplanner', 'shyftskills'].map((product) => (
                  <div key={product} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product}`}
                      checked={selectedProducts.includes(product)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts(prev => [...prev.filter(p => p !== product), product]);
                        } else {
                          setSelectedProducts(prev => prev.filter(p => p !== product));
                        }
                      }}
                    />
                    <Label htmlFor={`product-${product}`}>
                      {product === 'shyftplanner' ? 'shyftplanner' : 'shyftskills'}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <VariableInputRenderer
            selectedModules={selectedModules.map(sm => {
              const module = contractModules.find(m => m.key === sm.moduleKey);
              return module;
            }).filter(Boolean)}
            globalVariables={globalVariables}
            variableValues={variableValues}
            onVariableChange={(key, value) => setVariableValues(prev => ({
              ...prev,
              [key]: value
            }))}
          />
        </div>

        {/* Preview Panel - larger width */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live-Vorschau</CardTitle>
              <CardDescription>
                Vorschau des generierten Vertrags - Variable Felder sind gelb markiert
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div 
                className="max-w-none bg-white p-6 rounded-lg h-[70vh] overflow-y-auto border border-gray-200 shadow-inner contract-preview"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1.6',
                  fontFamily: 'Arial, sans-serif'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: `
                  <style>
                    .contract-preview p {
                      margin: 1em 0;
                      white-space: pre-wrap;
                    }
                    .contract-preview br {
                      display: block;
                      margin: 0.5em 0;
                      content: "";
                    }
                    .contract-preview div {
                      margin: 0.5em 0;
                      white-space: pre-wrap;
                    }
                    .contract-preview * {
                      white-space: pre-wrap;
                    }
                    .header-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 10px 0;
                    }
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
      </div>
    </div>
  );
}