import { Extension } from '@tiptap/core';
import { TextSelection, AllSelection } from '@tiptap/pm/state';

export interface IndentOptions {
  types: string[];
  minLevel: number;
  maxLevel: number;
  defaultIndentLevel: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const IndentExtension = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['listItem', 'paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8,
      defaultIndentLevel: 0,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.defaultIndentLevel,
            parseHTML: element => {
              const level = element.getAttribute('data-indent');
              return level ? parseInt(level, 10) : this.options.defaultIndentLevel;
            },
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }
              return {
                'data-indent': attributes.indent,
                style: `margin-left: ${attributes.indent * 2}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch, editor }) => {
          const { selection } = state;
          let { from, to } = selection;

          if (selection instanceof AllSelection) {
            from = 0;
            to = state.doc.content.size;
          }

          const tasks: Array<{ node: any; pos: number; currentIndent: number }> = [];

          state.doc.nodesBetween(from, to, (node, pos) => {
            const nodeType = node.type;

            if (this.options.types.includes(nodeType.name)) {
              const currentIndent = node.attrs.indent || 0;

              if (currentIndent < this.options.maxLevel) {
                tasks.push({
                  node,
                  pos,
                  currentIndent,
                });
              }
              return false;
            }
            return true;
          });

          if (!tasks.length) {
            return false;
          }

          if (dispatch) {
            const newTr = state.tr;
            tasks.forEach(({ node, pos, currentIndent }) => {
              newTr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent + 1,
              });
            });

            if (newTr.docChanged) {
              dispatch(newTr);
              return true;
            }
          }

          return true;
        },

      outdent:
        () =>
        ({ tr, state, dispatch, editor }) => {
          const { selection } = state;
          let { from, to } = selection;

          if (selection instanceof AllSelection) {
            from = 0;
            to = state.doc.content.size;
          }

          const tasks: Array<{ node: any; pos: number; currentIndent: number }> = [];

          state.doc.nodesBetween(from, to, (node, pos) => {
            const nodeType = node.type;

            if (this.options.types.includes(nodeType.name)) {
              const currentIndent = node.attrs.indent || 0;

              if (currentIndent > this.options.minLevel) {
                tasks.push({
                  node,
                  pos,
                  currentIndent,
                });
              }
              return false;
            }
            return true;
          });

          if (!tasks.length) {
            return false;
          }

          if (dispatch) {
            const newTr = state.tr;
            tasks.forEach(({ node, pos, currentIndent }) => {
              newTr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: Math.max(this.options.minLevel, currentIndent - 1),
              });
            });

            if (newTr.docChanged) {
              dispatch(newTr);
              return true;
            }
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        return this.editor.commands.outdent();
      },
    };
  },
});