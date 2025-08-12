// MathRenderer.tsx

import 'katex/dist/katex.min.css';
import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { CHTML } from 'mathjax-full/js/output/chtml.js';
import { HTMLDocument } from 'mathjax-full/js/handlers/html/HTMLDocument.js';
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor.js';
import * as sre from 'speech-rule-engine';

// ——— Inicialización de MathJax + SRE ———
const adaptor = browserAdaptor();
mathjax.handlers.register(adaptor);

const tex = new TeX({
  packages: ['base', 'ams', 'mhchem', 'newcommand', 'physics']
});
const chtml = new CHTML({});
const mjDocument = new HTMLDocument('', adaptor, {
  InputJax: tex,
  OutputJax: chtml
});

sre.setupEngine({
  locale: 'es',
  domain: 'mathspeak',
  style: 'default',
  speech: 'deep'
});

// ——— Función para convertir KaTeX a texto hablable ———
export async function katexToSpeechText(katex: string): Promise<string> {
  // 1) Convertir TeX → nodo interno MathJax
  const node = mjDocument.convert(katex, { display: false });
  // 2) Obtener el MathML generado
  const mathml = adaptor.innerHTML(node);
  // 3) Generar verbalización con SRE
  const speech = sre.toSpeech(mathml, {
    domain: 'mathspeak',
    style: 'default',
    locale: 'es'
  });
  return speech;
}

// ——— Componente de renderizado visual ———
interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  // markdown sencillo para **bold** y *italic*
  const parseInlineMarkdown = (str: string): React.ReactNode[] => {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.flatMap((part, pi) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={pi}>{part.slice(2, -2)}</strong>;
      }
      if (/^\*[^*]+\*$/.test(part)) {
        return <em key={pi}>{part.slice(1, -1)}</em>;
      }
      return part.split('\n').map((line, i, arr) => (
        <React.Fragment key={`${pi}-${i}`}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  // regex para bloques y inline
  const blockMathRegex = /\$\$(.*?)\$\$|\\\[(.*?)\\\]/gs;
  const inlineMathRegex = /\$(.*?)\$|\\\((.*?)\\\)/g;

  const renderContent = (text: string) => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    type Match = { match: RegExpExecArray; type: 'block' | 'inline'; group: number };
    const matches: Match[] = [];
    let m: RegExpExecArray | null;

    while ((m = blockMathRegex.exec(text)) !== null) {
      matches.push({ match: m, type: 'block', group: m[1] != null ? 1 : 2 });
    }
    const tempText = text.replace(blockMathRegex, s => ' '.repeat(s.length));
    while ((m = inlineMathRegex.exec(tempText)) !== null) {
      matches.push({ match: m, type: 'inline', group: m[1] != null ? 1 : 2 });
    }
    matches.sort((a, b) => a.match.index - b.match.index);

    matches.forEach(({ match, type, group }, idx) => {
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        result.push(
          <span key={`text-${idx}`}>{parseInlineMarkdown(textBefore)}</span>
        );
      }

      const mathContent = (match[group] || '').trim();
      if (type === 'block') {
        result.push(
          <div key={`math-${idx}`} className="my-6 text-center text-2xl leading-relaxed">
            <BlockMath math={mathContent} errorColor="#cc0000" />
          </div>
        );
      } else {
        result.push(
          <InlineMath key={`math-${idx}`} math={mathContent} errorColor="#cc0000" />
        );
      }
      lastIndex = match.index + match[0].length;
    });

    if (lastIndex < text.length) {
      result.push(<span key="text-end">{parseInlineMarkdown(text.slice(lastIndex))}</span>);
    }
    return result;
  };

  return (
    <div className={`math-content ${className} [&_.katex]:text-3xl [&_.katex-display]:text-3xl`}>
      {renderContent(content)}
    </div>
  );
}
