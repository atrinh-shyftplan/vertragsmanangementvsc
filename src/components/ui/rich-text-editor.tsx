import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import { ListKeymap } from '@tiptap/extension-list-keymap';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from '@tiptap/extension-table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, CheckSquare,
  Indent as IndentIcon, Outdent as OutdentIcon, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Variable, Search, ImageIcon,
  Table as TableIcon, Rows, Trash2, Plus, Minus, Combine, Split
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IndentExtension } from '@/lib/indent-extension';
import { supabase } from '@/integrations/supabase/client';
import { VariableHighlight } from '../../lib/variable-highlight-extension';

// NEU: Erweiterte Bild-Konfiguration
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// NEU: Komponente, die das Bild im Editor rendert
const ImageView = ({ node, selected }: NodeViewProps) => {
  return (
    <NodeViewWrapper className="image-wrapper inline-block" data-drag-handle>
      <img
        {...node.attrs}
        className={cn(
          "max-w-full h-auto rounded-lg",
          selected ? "ring-2 ring-primary ring-offset-2" : ""
        )}
        style={{ width: node.attrs.width }}
        data-align={node.attrs["data-align"]}
      />
    </NodeViewWrapper>
  );
};
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%', // Standardmäßig volle Breite
      },
      'data-align': {
        default: 'center', // Standardmäßig zentriert
      },
    };
  },
  // NEU: Diese Zeile macht das Bild im Editor zu einer React-Komponente
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  globalVariables?: Array<{key: string; name_de: string; description?: string; category?: string}>;
}

export function RichTextEditor({ content, onChange, placeholder, className, globalVariables = [] }: RichTextEditorProps) {
  const [variablePopoverOpen, setVariablePopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [, setForceUpdate] = useState(0);

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `private/contract-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle image upload button click
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        try {
          const imageUrl = await uploadImage(file);
          editor.chain().focus().setImage({ src: imageUrl }).run();
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    };
    input.click();
  };

  // NEUE Handler für Bildanpassung
  const setImageSize = (size: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { width: size }).run();
  };

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { 'data-align': align }).run();
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'prose-bullet-list',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'prose-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'prose-list-item',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'prose-paragraph',
          },
        },
        heading: {
          HTMLAttributes: {
            class: 'prose-heading',
          },
        },
      }),
      TextStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      IndentExtension.configure({
        types: ['heading', 'paragraph', 'listItem'],
        minLevel: 0,
        maxLevel: 8,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CustomImage.configure({
        // HTMLAttributes are now handled by the NodeView
      }),
      ListKeymap,
      TaskList.configure({
        HTMLAttributes: {
          class: 'prose-task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'prose-task-item',
        },
      }),
      VariableHighlight,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => {
      setForceUpdate(val => val + 1);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md bg-background", className)}>
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-muted/30">
          {/* Basic formatting */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-primary/20")}>
              <Bold className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Fett</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-primary/20")}>
              <Italic className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Kursiv</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("h-8 w-8 p-0", editor.isActive('strike') && "bg-primary/20")}>
              <Strikethrough className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Durchgestrichen</p></TooltipContent></Tooltip>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()} className={cn("h-8 px-2 text-xs font-semibold", editor.isActive('heading', { level: 1 }) && "bg-primary/20")}>
              H1</Button></TooltipTrigger><TooltipContent><p>Überschrift 1</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()} className={cn("h-8 px-2 text-xs font-semibold", editor.isActive('heading', { level: 2 }) && "bg-primary/20")}>
              H2</Button></TooltipTrigger><TooltipContent><p>Überschrift 2</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()} className={cn("h-8 px-2 text-xs font-semibold", editor.isActive('heading', { level: 3 }) && "bg-primary/20")}>
              H3</Button></TooltipTrigger><TooltipContent><p>Überschrift 3</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setParagraph().run()} className={cn("h-8 px-2 text-xs", !editor.isActive('heading') && !editor.isActive('blockquote') && "bg-primary/20")}>
              P</Button></TooltipTrigger><TooltipContent><p>Absatz</p></TooltipContent></Tooltip>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-primary/20")}>
              <List className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Aufzählung</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-primary/20")}>
              <ListOrdered className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Nummerierte Liste</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleTaskList().run()} className={cn("h-8 w-8 p-0", editor.isActive('taskList') && "bg-primary/20")}>
              <CheckSquare className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Checkliste</p></TooltipContent></Tooltip>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Indentation */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().outdent().run()} className="h-8 w-8 p-0">
              <OutdentIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Ausrücken</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().indent().run()} className="h-8 w-8 p-0">
              <IndentIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Einrücken</p></TooltipContent></Tooltip>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Text Alignment */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) && "bg-primary/20")}>
              <AlignLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Linksbündig</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) && "bg-primary/20")}>
              <AlignCenter className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Zentriert</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) && "bg-primary/20")}>
              <AlignRight className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Rechtsbündig</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'justify' }) && "bg-primary/20")}>
              <AlignJustify className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Blocksatz</p></TooltipContent></Tooltip>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Quote */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-primary/20")}>
            <Quote className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Zitat</p></TooltipContent></Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Table Controls */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="h-8 w-8 p-0">
              <TableIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Tabelle einfügen</p></TooltipContent></Tooltip>
            
            {editor.can().deleteTable() && (
              <>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnBefore().run()} className="h-8 w-8 p-0">
                  <div className="flex items-center"><Plus className="h-3 w-3" /><Rows className="h-4 w-4 -rotate-90" /></div></Button></TooltipTrigger><TooltipContent><p>Spalte davor</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnAfter().run()} className="h-8 w-8 p-0">
                  <div className="flex items-center"><Rows className="h-4 w-4 -rotate-90" /><Plus className="h-3 w-3" /></div></Button></TooltipTrigger><TooltipContent><p>Spalte danach</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteColumn().run()} className="h-8 w-8 p-0">
                  <div className="flex items-center"><Minus className="h-3 w-3" /><Rows className="h-4 w-4 -rotate-90" /></div></Button></TooltipTrigger><TooltipContent><p>Spalte löschen</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowBefore().run()} className="h-8 w-8 p-0">
                  <div className="flex items-center"><Plus className="h-3 w-3" /><Rows className="h-4 w-4" /></div></Button></TooltipTrigger><TooltipContent><p>Zeile davor</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowAfter().run()} className="h-8 w-8 p-0">
                  <div className="flex items-center"><Rows className="h-4 w-4" /><Plus className="h-3 w-3" /></div></Button></TooltipTrigger><TooltipContent><p>Zeile danach</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteRow().run()} className="h-8 w-8 p-0">
                  <div className="flex items-center"><Minus className="h-3 w-3" /><Rows className="h-4 w-4" /></div></Button></TooltipTrigger><TooltipContent><p>Zeile löschen</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().mergeCells().run()} className="h-8 w-8 p-0">
                  <Combine className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Zellen verbinden</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().splitCell().run()} className="h-8 w-8 p-0">
                  <Split className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Zellen trennen</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteTable().run()} className="h-8 w-8 p-0">
                  <Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent><p>Tabelle löschen</p></TooltipContent></Tooltip>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Image Upload */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={handleImageUpload} className="h-8 w-8 p-0">
            <ImageIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Bild hochladen</p></TooltipContent></Tooltip>

          {/* NEU: Buttons sind nur sichtbar, wenn ein Bild aktiv ist */}
          {editor.isActive('image') && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <Tooltip><TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlignment('left')} className={cn("h-8 w-8 p-0", editor.isActive('image', { 'data-align': 'left' }) && "bg-primary/20")}>
                  <AlignLeft className="h-4 w-4" />
                </Button></TooltipTrigger><TooltipContent><p>Linksbündig</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlignment('center')} className={cn("h-8 w-8 p-0", editor.isActive('image', { 'data-align': 'center' }) && "bg-primary/20")}>
                  <AlignCenter className="h-4 w-4" />
                </Button></TooltipTrigger><TooltipContent><p>Zentriert</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageAlignment('right')} className={cn("h-8 w-8 p-0", editor.isActive('image', { 'data-align': 'right' }) && "bg-primary/20")}>
                  <AlignRight className="h-4 w-4" />
                </Button></TooltipTrigger><TooltipContent><p>Rechtsbündig</p></TooltipContent></Tooltip>

              <div className="w-px h-6 bg-border mx-1" />

              <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => setImageSize('25%')} className={cn("h-8 w-8 p-0", editor.isActive('image', { width: '25%' }) && "bg-primary/20")}>
                  <span className="font-bold text-xs">S</span>
                </Button></TooltipTrigger><TooltipContent><p>Kleine Größe (25%)</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => setImageSize('50%')} className={cn("h-8 w-8 p-0", editor.isActive('image', { width: '50%' }) && "bg-primary/20")}>
                  <span className="font-bold text-xs">M</span>
                </Button></TooltipTrigger><TooltipContent><p>Mittlere Größe (50%)</p></TooltipContent></Tooltip>
              {/* *** ANGEPASST: L ist jetzt 75% und XL ist 100% *** */}
              <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => setImageSize('75%')} className={cn("h-8 w-8 p-0", editor.isActive('image', { width: '75%' }) && "bg-primary/20")}>
                  <span className="font-bold text-xs">L</span>
                </Button></TooltipTrigger><TooltipContent><p>Große Größe (75%)</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => setImageSize('100%')} className={cn("h-8 w-8 p-0", editor.isActive('image', { width: '100%' }) && "bg-primary/20")}>
                  <span className="font-bold text-xs">XL</span>
                </Button></TooltipTrigger><TooltipContent><p>Volle Breite (100%)</p></TooltipContent></Tooltip>
            </>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Variables */}
          {globalVariables.length > 0 && (
            <Popover open={variablePopoverOpen} onOpenChange={setVariablePopoverOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  title="Variable einfügen"
                >
                  <Variable className="h-3 w-3" />
                  <span>Variable</span>
                  <Search className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 bg-popover border shadow-lg flex flex-col max-h-96" align="start">
                {/* Search and Filter Controls */}
                <div className="p-3 border-b space-y-2 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Suche Variablen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Alle Kategorien</option>
                    {Array.from(new Set(globalVariables.map(v => v.category || 'general'))).map(category => (
                      <option key={category} value={category}>
                        {category === 'header' ? 'Header' : 
                         category === 'vertragskonditionen' ? 'Vertragskonditionen' :
                         category === 'general' ? 'Allgemein' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variables List */}
                <div className="overflow-y-auto flex-1">
                  {(() => {
                    // Filter variables based on search and category
                    const filteredVariables = globalVariables.filter(variable => {
                      const matchesSearch = searchTerm === '' ||
                        variable.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (variable.description || '').toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const matchesCategory = selectedCategory === 'all' || 
                        (variable.category || 'general') === selectedCategory;
                      
                      return matchesSearch && matchesCategory;
                    });

                    // Group by category
                    const groupedVariables = filteredVariables.reduce((acc, variable) => {
                      const category = variable.category || 'general';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(variable);
                      return acc;
                    }, {} as Record<string, typeof globalVariables>);

                    const categoryNames = {
                      header: 'Header',
                      vertragskonditionen: 'Vertragskonditionen', 
                      general: 'Allgemein'
                    };

                    return Object.entries(groupedVariables).map(([category, variables]) => (
                      <div key={category} className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b mb-2">
                          {categoryNames[category as keyof typeof categoryNames] || category}
                        </div>
                        {variables.map(variable => (
                          <div
                            key={variable.key}
                            onClick={() => {
                              editor.chain().focus().insertContent(`{{${variable.key}}}`).run();
                              setVariablePopoverOpen(false);
                              setSearchTerm('');
                              setSelectedCategory('all');
                            }}
                            className="flex flex-col gap-1 p-3 cursor-pointer hover:bg-accent rounded-md mx-1 mb-1"
                          >
                            <div className="flex w-full justify-between items-center">
                              <span className="font-medium text-sm">{variable.name_de}</span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                                {`{{${variable.key}}}`}
                              </span>
                            </div>
                            {variable.description && (
                              <span className="text-xs text-muted-foreground">{variable.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                  
                  {/* No results message */}
                  {globalVariables.filter(variable => {
                    const matchesSearch = searchTerm === '' ||
                      variable.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (variable.description || '').toLowerCase().includes(searchTerm.toLowerCase());
                    
                    const matchesCategory = selectedCategory === 'all' || 
                      (variable.category || 'general') === selectedCategory;
                    return matchesSearch && matchesCategory;
                  }).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      Keine Variablen gefunden.
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </TooltipProvider>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="prose max-w-none min-h-[400px] max-h-[600px] overflow-y-auto"
        />
      </div>
    </div>
  );
}