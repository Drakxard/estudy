import 'katex/dist/katex.min.css';
import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  /**
   * Contenido de texto con delimitadores de fórmulas:
   * inline: $...$, \(...\)
   * block: $$...$$, \[...\]
   */
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  // Regex para detectar fórmulas block y inline, incluyendo delimitadores KaTeX y backslash
  const blockMathRegex = /\$\$(.*?)\$\$|\\\[(.*?)\\\]/gs;
  const inlineMathRegex = /\$(.*?)\$|\\\((.*?)\\\)/g;

  const renderContent = (text: string) => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    type Match = { match: RegExpExecArray; type: 'block' | 'inline'; group: number };
    const matches: Match[] = [];
    let m: RegExpExecArray | null;

    // 1) Detectar fórmulas block ($$...$$ y \[...\])
    while ((m = blockMathRegex.exec(text)) !== null) {
      const group = m[1] != null ? 1 : 2;
      matches.push({ match: m, type: 'block', group });
    }

    // 2) Remover bloques en texto temporal para no re-detectar como inline
    const tempText = text.replace(blockMathRegex, s => ' '.repeat(s.length));

    // 3) Detectar fórmulas inline ($...$ y \(...\))
    while ((m = inlineMathRegex.exec(tempText)) !== null) {
      const group = m[1] != null ? 1 : 2;
      matches.push({ match: m, type: 'inline', group });
    }

    // 4) Ordenar todas las coincidencias según posición original
    matches.sort((a, b) => a.match.index - b.match.index);

    // 5) Construir nodos React
    matches.forEach(({ match, type, group }, idx) => {
      // Texto anterior
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        result.push(
          <span key={`text-${idx}`}>{
            textBefore.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))
          }</span>
        );
      }

      const mathContent = (match[group] || '').trim();
      try {
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
      } catch {
        // Fallback si TeX inválido
        const openDelim = type === 'block'
          ? (group === 1 ? '$$' : '\\[')
          : (group === 1 ? '$' : '\\(');
        const closeDelim = type === 'block'
          ? (group === 1 ? '$$' : '\\]')
          : (group === 1 ? '$' : '\\)');
        result.push(
          <span key={`error-${idx}`} className="text-red-500 font-mono">
            {openDelim + mathContent + closeDelim}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    });

    // 6) Texto restante
    if (lastIndex < text.length) {
      const rest = text.slice(lastIndex);
      result.push(
        <span key="text-end">
          {rest.split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    }

    return result;
  };

  return (
    <div className={`math-content ${className} [&_.katex]:text-3xl [&_.katex-display]:text-3xl`}>
      {renderContent(content)}
    </div>
  );
}
