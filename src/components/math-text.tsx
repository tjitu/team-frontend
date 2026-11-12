'use client';

import React from 'react';

type MathTextProps = {
  text?: string | null;
  className?: string;
};

function renderFormattedLine(line: string, lineKey: string) {
  const tokens = line.split(/(<hl>.*?<\/hl>|\*\*.*?\*\*|`.*?`)/g);
  return (
    <React.Fragment key={lineKey}>
      {tokens.map((token, idx) => {
        if (!token) return null;
        if (token.startsWith('<hl>') && token.endsWith('</hl>')) {
          return (
            <mark
              key={idx}
              style={{
                background: 'rgba(250, 204, 21, 0.28)',
                color: '#fef08a',
                padding: '0 4px',
                borderRadius: '4px',
              }}
            >
              {token.slice(4, -5)}
            </mark>
          );
        }
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
          return <strong key={idx}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
          return (
            <code
              key={idx}
              style={{
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.08)',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={idx}>{token}</React.Fragment>;
      })}
    </React.Fragment>
  );
}

/**
 * Lightweight rich text & inline math/highlight formatter for Team Control Center tables and previews.
 */
export function MathText({ text, className }: MathTextProps) {
  const safeText = String(text ?? '').replace(/\\n/g, '\n');
  if (!safeText) return null;
  const lines = safeText.split('\n');
  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderFormattedLine(line, `line-${i}`)}
          {i < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </span>
  );
}
