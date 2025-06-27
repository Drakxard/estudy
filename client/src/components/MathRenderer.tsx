import 'katex/dist/katex.min.css';
import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';


interface MathRendererProps {
  content: string;
  inlineSize?: number;     // em
  displaySize?: number;    // em
  displayPadding?: number; // rem
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  // Split content by math delimiters and render appropriately
  const renderContent = (text: string) => {
    const blockMathRegex = /\$\$(.*?)\$\$/gs;
    const inlineMathRegex = /\$(.*?)\$/g;

    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Collect block math matches
    const blockMatches: Array<{ match: RegExpExecArray; type: 'block' }> = [];
    while ((match = blockMathRegex.exec(text)) !== null) {
      blockMatches.push({ match, type: 'block' });
    }

    // Collect inline math matches (on text with blocks removed)
    const inlineMatches: Array<{ match: RegExpExecArray; type: 'inline' }> = [];
    const tempText = text.replace(blockMathRegex, (m) => ' '.repeat(m.length));
    while ((match = inlineMathRegex.exec(tempText)) !== null) {
      inlineMatches.push({ match, type: 'inline' });
    }

    // Merge and sort all matches by original index
    const allMatches = [...blockMatches, ...inlineMatches].sort(
      (a, b) => a.match.index - b.match.index
    );

    allMatches.forEach(({ match, type }, idx) => {
      // Text before math
      if (match.index > lastIndex) {
        const before = text.slice(lastIndex, match.index);
        result.push(
          <span key={`text-${idx}`}>
            {before.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }

      // The math itself
      const mathContent = match[1].trim();
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
        // Fallback for invalid LaTeX
        const delim = type === 'block' ? '$$' : '$';
        result.push(
          <span key={`error-${idx}`} className="text-red-500 font-mono">
            {delim}{mathContent}{delim}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    });

    // Remaining text after last match
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
