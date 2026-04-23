import { Mark, mergeAttributes } from '@tiptap/react';

export const Comment = Mark.create({
  name: 'comment',

  addAttributes() {
    return {
      comment: { default: '' },
      id: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-comment]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-comment': HTMLAttributes.comment || '',
      class: 'inline-comment',
      title: HTMLAttributes.comment || '',
    }), 0];
  },

  addCommands() {
    return {
      setComment: (attrs) => ({ commands }) => {
        return commands.setMark(this.name, attrs);
      },
      unsetComment: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
