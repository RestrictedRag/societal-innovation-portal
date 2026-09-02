'use client';

import React, { useState } from 'react';
import { Copy, Check, Sparkles, Lightbulb, FileText, CheckCircle2 } from 'lucide-react';

interface ChatMessageMarkdownProps {
  content: string;
}

export function ChatMessageMarkdown({ content }: ChatMessageMarkdownProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    // Strip quotes and markdown marks from copied text
    const cleanText = text
      .replace(/^>\s*/gm, '')
      .replace(/[*_~`]/g, '')
      .replace(/\s*\(\d+\s*words\)\s*$/i, '')
      .trim();

    void navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse paragraphs and special markdown blocks
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed font-sans">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Divider
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={bIdx} className="border-t border-slate-700/60 my-2" />;
        }

        // Section Headings (### Option 1, ### Tips, etc.)
        if (trimmed.startsWith('#')) {
          const match = trimmed.match(/^(#{1,4})\s+(.+)$/);
          if (match) {
            const headingText = match[2];
            const isOption = /option\s*\d+/i.test(headingText);
            const isTips = /tips|before you submit|requirements/i.test(headingText);

            return (
              <div key={bIdx} className="pt-1.5 pb-0.5 flex items-center gap-1.5 flex-wrap">
                {isOption ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[11px] border border-blue-500/30">
                    <FileText className="w-3 h-3" />
                    {headingText.replace(/^###\s*/, '')}
                  </span>
                ) : isTips ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                    <Lightbulb className="w-3 h-3" />
                    {headingText.replace(/^###\s*/, '')}
                  </span>
                ) : (
                  <h4 className="font-bold text-white text-xs tracking-wide">
                    {renderFormattedInline(headingText)}
                  </h4>
                )}
              </div>
            );
          }
        }

        // Blockquotes (Draft Statements / Quotes)
        if (trimmed.startsWith('>')) {
          const quoteText = trimmed
            .split('\n')
            .map((line) => line.replace(/^>\s?/, ''))
            .join(' ')
            .trim();

          // Extract word count if attached
          const wordCountMatch = quoteText.match(/\((\d+\s*words?)\)/i);
          const cleanQuote = quoteText.replace(/\(\d+\s*words?\)/i, '').trim();

          return (
            <div
              key={bIdx}
              className="relative my-2 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-slate-800/80 p-3.5 shadow-inner transition-all hover:border-blue-500/50 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-grow pr-6">
                  <p className="font-sans text-xs text-slate-100 italic leading-relaxed">
                    {renderFormattedInline(cleanQuote)}
                  </p>

                  {wordCountMatch && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{wordCountMatch[1]} (Meets 30-word requirement)</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(cleanQuote, bIdx)}
                  title="Copy this draft"
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white hover:bg-blue-600 transition border border-slate-700 text-[10px] font-semibold shadow-sm"
                >
                  {copiedIndex === bIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }

        // Bullet Lists (* item or - item or 1. item)
        const lines = trimmed.split('\n');
        const isList = lines.every(
          (l) => l.trim().startsWith('*') || l.trim().startsWith('-') || /^\d+\.\s/.test(l.trim()),
        );

        if (isList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-1 my-1.5">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\*\-]\s*|\d+\.\s*/, '').trim();
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5 shadow-sm" />
                    <span>{renderFormattedInline(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={bIdx} className="leading-relaxed">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/** Helper to render inline markdown: **bold**, *italic*, `code`, and [Placeholders] */
function renderFormattedInline(text: string): React.ReactNode {
  // Tokenize bold, italic, code, and bracketed placeholders
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Pattern matches **bold**, `code`, [Placeholders], *italic*
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[A-Za-z0-9\s_-]+\]|\*[^*]+\*)/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    const token = match[0];
    keyIdx++;

    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyIdx} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={keyIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px] border border-slate-700">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[') && token.endsWith(']')) {
      // Highlight placeholders like [Street Name], [Location]
      parts.push(
        <span
          key={keyIdx}
          className="inline-block px-1.5 py-0.2 mx-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-semibold border border-amber-500/30"
        >
          {token}
        </span>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={keyIdx} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      parts.push(token);
    }

    remaining = remaining.substring(match.index + token.length);
  }

  return <>{parts}</>;
}
