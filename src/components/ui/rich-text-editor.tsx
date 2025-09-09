import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import { ListKeymap } from '@tiptap/extension-list-keymap';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Bold, Italic, Underline, List, ListOrdered, Quote, CheckSquare, Indent, Outdent, AlignLeft, AlignCenter, AlignRight, AlignJustify, Variable, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  globalVariables?: Array<{key: string; name_de: string; description?: string}>;
}

export function RichTextEditor({ content, onChange, placeholder, className, globalVariables = [] }: RichTextEditorProps) {
  const [listStyle, setListStyle] = useState<'decimal' | 'decimal-paren' | 'decimal-dot'>('decimal');
  const [variablePopoverOpen, setVariablePopoverOpen] = useState(false);

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
            class: `prose-ordered-list list-style-${listStyle}`,
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
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
      {/* Enhanced Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-muted/30">
        {/* Basic formatting */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-primary/20")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-primary/20")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('strike') && "bg-primary/20")}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
            className={cn("h-8 px-2 text-xs font-semibold", editor.isActive('heading', { level: 1 }) && "bg-primary/20")}
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
            className={cn("h-8 px-2 text-xs font-semibold", editor.isActive('heading', { level: 2 }) && "bg-primary/20")}
          >
            H2
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
            className={cn("h-8 px-2 text-xs font-semibold", editor.isActive('heading', { level: 3 }) && "bg-primary/20")}
          >
            H3
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn("h-8 px-2 text-xs", !editor.isActive('heading') && !editor.isActive('blockquote') && "bg-primary/20")}
          >
            P
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-primary/20")}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-primary/20")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Select 
            value={listStyle} 
            onValueChange={(value: 'decimal' | 'decimal-paren' | 'decimal-dot') => {
              setListStyle(value);
              // Apply style to existing lists immediately
              setTimeout(() => {
                const allLists = editor.view.dom.querySelectorAll('ol');
                allLists.forEach(list => {
                  // Remove existing style classes
                  list.classList.remove('list-style-decimal', 'list-style-decimal-paren', 'list-style-decimal-dot');
                  // Add new style class
                  list.classList.add('prose-ordered-list', `list-style-${value}`);
                });
                // Force editor to update
                editor.commands.focus();
              }, 10);
            }}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-md z-50">
              <SelectItem value="decimal">1. a. i.</SelectItem>
              <SelectItem value="decimal-paren">1) a) i)</SelectItem>
              <SelectItem value="decimal-dot">1.1. 1.2.</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('taskList') && "bg-primary/20")}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Indentation */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            disabled={!editor.can().liftListItem('listItem')}
            className="h-8 w-8 p-0"
          >
            <Outdent className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            disabled={!editor.can().sinkListItem('listItem')}
            className="h-8 w-8 p-0"
          >
            <Indent className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) && "bg-primary/20")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) && "bg-primary/20")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) && "bg-primary/20")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'justify' }) && "bg-primary/20")}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Quote */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-primary/20")}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Variables */}
        {globalVariables.length > 0 && (
          <Popover open={variablePopoverOpen} onOpenChange={setVariablePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
              >
                <Variable className="h-3 w-3" />
                <span>Variable</span>
                <Search className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-popover border shadow-lg z-50" align="start">
              <Command>
                <CommandInput placeholder="Suche Variablen..." className="h-9" />
                <CommandEmpty>Keine Variablen gefunden.</CommandEmpty>
                <CommandList className="max-h-64">
                  <CommandGroup>
                    {globalVariables.map(variable => (
                      <CommandItem
                        key={variable.key}
                        value={`${variable.name_de} ${variable.key} ${variable.description || ''}`}
                        onSelect={() => {
                          editor.chain().focus().insertContent(`{{${variable.key}}}`).run();
                          setVariablePopoverOpen(false);
                        }}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      >
                        <div className="flex w-full justify-between items-center">
                          <span className="font-medium">{variable.name_de}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{`{{${variable.key}}}`}</span>
                        </div>
                        {variable.description && (
                          <span className="text-xs text-muted-foreground w-full">{variable.description}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[400px] max-h-[600px] overflow-y-auto"
        />
      </div>
    </div>
  );
}