import { Node, mergeAttributes } from '@tiptap/react';
import katex from 'katex';

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-math]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math': '' }), 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('math-block');
      
      const rendered = document.createElement('div');
      rendered.classList.add('math-rendered');
      
      const input = document.createElement('input');
      input.classList.add('math-input');
      input.type = 'text';
      input.value = node.attrs.latex || '';
      input.placeholder = 'Type LaTeX math, e.g. E = mc^2';
      
      const renderMath = (latex) => {
        if (!latex.trim()) {
          rendered.innerHTML = '<span class="math-placeholder">Click to add math equation</span>';
          return;
        }
        try {
          rendered.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: true });
        } catch {
          rendered.textContent = latex;
        }
      };
      
      renderMath(node.attrs.latex);
      
      let isEditing = false;
      
      rendered.addEventListener('click', () => {
        isEditing = true;
        dom.classList.add('editing');
        input.style.display = 'block';
        rendered.style.display = 'none';
        input.focus();
        input.select();
      });
      
      const finishEditing = () => {
        isEditing = false;
        dom.classList.remove('editing');
        input.style.display = 'none';
        rendered.style.display = 'block';
        
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(pos, undefined, { latex: input.value })
          );
        }
        renderMath(input.value);
      };
      
      input.addEventListener('blur', finishEditing);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finishEditing();
        }
        if (e.key === 'Escape') {
          input.value = node.attrs.latex || '';
          finishEditing();
        }
      });
      
      input.style.display = 'none';
      
      dom.appendChild(rendered);
      dom.appendChild(input);
      
      return { dom };
    };
  },
});

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-math-inline]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-math-inline': '' }), 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.classList.add('math-inline-node');
      
      const renderMath = () => {
        if (!node.attrs.latex.trim()) {
          dom.innerHTML = '<span class="math-placeholder-inline">math</span>';
          return;
        }
        try {
          dom.innerHTML = katex.renderToString(node.attrs.latex, { throwOnError: false, displayMode: false });
        } catch {
          dom.textContent = node.attrs.latex;
        }
      };
      
      renderMath();
      
      dom.addEventListener('click', () => {
        const newLatex = prompt('Edit LaTeX:', node.attrs.latex);
        if (newLatex !== null) {
          const pos = getPos();
          if (typeof pos === 'number') {
            editor.view.dispatch(
              editor.view.state.tr.setNodeMarkup(pos, undefined, { latex: newLatex })
            );
          }
        }
      });
      
      return { dom };
    };
  },
});
