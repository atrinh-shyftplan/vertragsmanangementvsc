import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { ListKeymap } from '@tiptap/extension-list-keymap';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, List, ListOrdered, Quote, CheckSquare, Indent, Outdent, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [listStyle, setListStyle] = useState<'decimal' | 'decimal-paren' | 'decimal-dot'>('decimal');

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
          
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentClass = `list-style-${listStyle}`;
                editor.chain().focus().toggleOrderedList().run();
                // Update the class after creating the list
                setTimeout(() => {
                  const lists = editor.view.dom.querySelectorAll('ol');
                  lists.forEach(list => {
                    list.className = `prose-ordered-list ${currentClass}`;
                  });
                }, 0);
              }}
              className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-primary/20")}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Select value={listStyle} onValueChange={(value: 'decimal' | 'decimal-paren' | 'decimal-dot') => setListStyle(value)}>
              <SelectTrigger className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-muted">
                <ChevronDown className="h-3 w-3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decimal">1. a. i.</SelectItem>
                <SelectItem value="decimal-paren">1) a) i)</SelectItem>
                <SelectItem value="decimal-dot">1.1. 1.1.1.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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