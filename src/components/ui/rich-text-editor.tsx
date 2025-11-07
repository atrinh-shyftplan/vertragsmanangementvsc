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
  AlignRight, AlignJustify, Variable, Search, ImageIcon, Table as TableIcon, Trash2,
  Combine, Split, Pilcrow, Heading1, Heading2, Heading3, Columns, Rows,
  ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, ArrowDownToLine, Trash,
  BorderAll, BorderNone, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IndentExtension } from '@/lib/indent-extension';
import { supabase } from '@/integrations/supabase/client';
import { VariableHighlight } from '../../lib/variable-highlight-extension';

// NEU: Erweiterte Bild-Konfiguration
import { findParentNode } from "@tiptap/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Hilfsfunktion zum Umschalten der Tabellen-Klassen
  const toggleTableClass = (className: string) => {
    if (!editor) return;

    // Finde die Tabelle, in der sich der Cursor befindet
    const tableNodeWithPos = findParentNode(node => node.type.name === 'table')(editor.state.selection);
    if (!tableNodeWithPos) return;

    const { node: tableNode, pos } = tableNodeWithPos;

    const currentClass = tableNode.attrs.class || '';
    let newClass = '';

    if (className === '') {
      // Explizit auf Standard (vertikale Linie) zurücksetzen
      newClass = currentClass.replace('full-border', '').replace('no-border', '').trim();
    } else if (currentClass.includes(className)) {
      // Klasse entfernen (zurück zum Standard)
      newClass = currentClass.replace(className, '').trim();
    } else {
      // Klasse hinzufügen/ersetzen (entfernt andere Stil-Klassen, um Konflikte zu vermeiden)
      newClass = currentClass.replace('full-border', '').replace('no-border', '').trim();
      newClass = (newClass + ' ' + className).trim();
    }

    const tr = editor.state.tr;
    tr.setNodeMarkup(pos, tableNode.type, { ...tableNode.attrs, class: newClass });
    editor.view.dispatch(tr);
    editor.chain().focus().run(); // To update the toolbar state
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
        addAttributes() {
          return {
            class: {
              default: null,
              parseHTML: element => element.getAttribute('class'),
              renderHTML: attributes => ({
                class: attributes.class,
              }),
            },
          };
        },
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

  // Hilfsfunktion zum Umschalten der Tabellen-Klassen
  const toggleTableClass = (className: string) => {
    if (!editor) return;

    // Finde die Tabelle, in der sich der Cursor befindet
    const tableNode = findParentNode(node => node.type.name === 'table')(editor.state.selection);
    if (!tableNode) return;

    const currentClass = tableNode.node.attrs.class || '';
    let newClass = '';

    if (className === '') {
      // Explizit auf Standard (vertikale Linie) zurücksetzen
      newClass = currentClass.replace('full-border', '').replace('no-border', '').trim();
    } else if (currentClass.includes(className)) {
      // Klasse entfernen (zurück zum Standard)
      newClass = currentClass.replace(className, '').trim();
    } else {
      // Klasse hinzufügen/ersetzen
      // (entfernt andere Stil-Klassen, um Konflikte zu vermeiden)
      newClass = currentClass.replace('full-border', '').replace('no-border', '').trim();
      newClass = (newClass + ' ' + className).trim();
    }

    editor.chain().focus().updateAttributes('table', { class: newClass }).run();
  };

  return (
    <div className={cn("border rounded-md bg-background", className)}>
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-muted/30">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            tooltip="Fett"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            tooltip="Kursiv"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            tooltip="Durchgestrichen"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            tooltip="Überschrift 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            tooltip="Überschrift 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            tooltip="Überschrift 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={!editor.isActive('heading') && !editor.isActive('blockquote')}
            tooltip="Absatz"
          >
            P
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            tooltip="Aufzählung"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            tooltip="Nummerierte Liste"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            tooltip="Checkliste"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().outdent().run()}
            tooltip="Ausrücken"
          >
            <OutdentIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().indent().run()}
            tooltip="Einrücken"
          >
            <IndentIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            tooltip="Linksbündig"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            tooltip="Zentriert"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            tooltip="Rechtsbündig"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            tooltip="Blocksatz"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            tooltip="Zitat"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            tooltip="Tabelle einfügen"
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>

          {editor.can().deleteTable() && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                tooltip="Spalte davor einfügen"
              >
                <ArrowLeftToLine className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                tooltip="Spalte danach einfügen"
              >
                <ArrowRightToLine className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                tooltip="Spalte löschen"
              >
                <Trash className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                tooltip="Zeile davor einfügen"
              >
                <ArrowUpToLine className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                tooltip="Zeile danach einfügen"
              >
                <ArrowDownToLine className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                tooltip="Zeile löschen"
              >
                <Trash className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().mergeCells().run()}
                tooltip="Zellen verbinden"
              >
                <Combine className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().splitCell().run()}
                tooltip="Zellen trennen"
              >
                <Split className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                tooltip="Tabelle löschen"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </ToolbarButton>
            </>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={handleImageUpload}
            tooltip="Bild hochladen"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          {editor.isActive('image') && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <ToolbarButton
                onClick={() => setImageAlignment('left')}
                isActive={editor.isActive('image', { 'data-align': 'left' })}
                tooltip="Linksbündig"
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setImageAlignment('center')}
                isActive={editor.isActive('image', { 'data-align': 'center' })}
                tooltip="Zentriert"
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setImageAlignment('right')}
                isActive={editor.isActive('image', { 'data-align': 'right' })}
                tooltip="Rechtsbündig"
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />

              <ToolbarButton
                onClick={() => setImageSize('25%')}
                isActive={editor.isActive('image', { width: '25%' })}
                tooltip="Kleine Größe (25%)"
              >
                <span className="font-bold text-xs">S</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setImageSize('50%')}
                isActive={editor.isActive('image', { width: '50%' })}
                tooltip="Mittlere Größe (50%)"
              >
                <span className="font-bold text-xs">M</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setImageSize('75%')}
                isActive={editor.isActive('image', { width: '75%' })}
                tooltip="Große Größe (75%)"
              >
                <span className="font-bold text-xs">L</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setImageSize('100%')}
                isActive={editor.isActive('image', { width: '100%' })}
                tooltip="Volle Breite (100%)"
              >
                <span className="font-bold text-xs">XL</span>
              </ToolbarButton>
            </>
          )}

          <div className="w-px h-6 bg-border mx-1" />

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

                <div className="overflow-y-auto flex-1">
                  {(() => {
                    const filteredVariables = globalVariables.filter(variable => {
                      const matchesSearch = searchTerm === '' ||
                        variable.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (variable.description || '').toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const matchesCategory = selectedCategory === 'all' || 
                        (variable.category || 'general') === selectedCategory;
                      
                      return matchesSearch && matchesCategory;
                    });

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

          {/* Table Styling Controls */}
          {editor.isActive('table') && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <ToolbarButton
                onClick={() => toggleTableClass('full-border')}
                isActive={editor.getAttributes('table').class?.includes('full-border')}
                tooltip="Tabelle mit allen Rändern"
              > 
                <BorderAll className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => toggleTableClass('no-border')}
                isActive={editor.getAttributes('table').class?.includes('no-border')}
                tooltip="Tabelle ohne Ränder"
              > 
                <BorderNone className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => toggleTableClass('')} // Setzt auf Standard (nur vertikale Linie)
                isActive={!editor.getAttributes('table').class?.includes('full-border') && !editor.getAttributes('table').class?.includes('no-border')} 
                tooltip="Standard-Tabelle (vertikale Linie)"
              >
                <Minus className="h-4 w-4" />
              </ToolbarButton>
            </>
          )}
        </div>
        {/* Editor Content */}
        <div className="relative">
          <EditorContent 
            editor={editor} 
            className="prose max-w-none min-h-[400px] max-h-[600px] overflow-y-auto"
          />
        </div>
      </TooltipProvider>
    </div>
  );
}

interface ToolbarButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  onClick: () => void;
  tooltip: string;
  isActive?: boolean;
  children: React.ReactNode;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ onClick, tooltip, isActive = false, children, className, ...props }, ref) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn("h-8 w-8 p-0", isActive && "bg-primary/20", className)}
            {...props}
          >{children}</Button>
        </TooltipTrigger>
        <TooltipContent><p>{tooltip}</p></TooltipContent>
      </Tooltip>
    );
  }
);
ToolbarButton.displayName = "ToolbarButton";