import { Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const VariableHighlight = Mark.create({
  name: 'variableHighlight',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'variable-highlight',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[class=variable-highlight]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...this.options.HTMLAttributes, ...HTMLAttributes }, 0];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableHighlight'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!newState.doc.textContent) return null;

          const tr = newState.tr;
          let modified = false;

          const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
          
          newState.doc.descendants((node, pos) => {
            if (!node.isText) return;

            const text = node.textContent;
            let match;

            while ((match = regex.exec(text)) !== null) {
              const from = pos + match.index;
              const to = from + match[0].length;
              
              const hasMark = newState.doc.rangeHasMark(from, to, this.type);
              
              if (!hasMark) {
                tr.addMark(from, to, this.type.create());
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});