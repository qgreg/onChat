import type { ReactNode } from 'react';

interface MarkdownMessageProps {
  content: string;
}

type Block =
  | { type: 'code'; content: string; language?: string }
  | { type: 'heading'; depth: number; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; content: string };

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const tokenMatches = [
      { type: 'code', index: remaining.indexOf('`') },
      { type: 'bold', index: remaining.indexOf('**') },
      { type: 'italic', index: remaining.indexOf('*') },
    ].filter(({ index }) => index >= 0);

    if (tokenMatches.length === 0) {
      nodes.push(remaining);
      break;
    }

    tokenMatches.sort((a, b) => a.index - b.index);
    const next = tokenMatches[0];

    if (next.index > 0) {
      nodes.push(remaining.slice(0, next.index));
      remaining = remaining.slice(next.index);
      continue;
    }

    if (next.type === 'code') {
      const end = remaining.indexOf('`', 1);
      if (end < 0) {
        nodes.push(remaining);
        break;
      }

      nodes.push(
        <code key={`inline-code-${key++}`} className="rounded bg-black/30 px-1.5 py-0.5 text-indigo-100">
          {remaining.slice(1, end)}
        </code>,
      );
      remaining = remaining.slice(end + 1);
      continue;
    }

    if (next.type === 'bold') {
      const end = remaining.indexOf('**', 2);
      if (end < 0) {
        nodes.push(remaining);
        break;
      }

      nodes.push(
        <strong key={`bold-${key++}`} className="font-semibold text-white">
          {parseInline(remaining.slice(2, end))}
        </strong>,
      );
      remaining = remaining.slice(end + 2);
      continue;
    }

    const end = remaining.indexOf('*', 1);
    if (end < 0) {
      nodes.push(remaining);
      break;
    }

    nodes.push(
      <em key={`italic-${key++}`} className="text-gray-100">
        {parseInline(remaining.slice(1, end))}
      </em>,
    );
    remaining = remaining.slice(end + 1);
  }

  return nodes;
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const codeFence = line.match(/^```([\w-]+)?\s*$/);
    if (codeFence) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: 'code', language: codeFence[1], content: codeLines.join('\n') });
      index += index < lines.length ? 1 : 0;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', depth: heading[1].length, content: heading[2] });
      index += 1;
      continue;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];

      while (index < lines.length) {
        const item = lines[index].match(isOrdered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*]\s+(.+)$/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }

      blocks.push({ type: 'list', ordered: isOrdered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^```/.test(lines[index]) &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({ type: 'paragraph', content: paragraphLines.join('\n') });
  }

  return blocks;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3 break-words">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
              {block.language && (
                <div className="border-b border-white/10 px-3 py-1.5 text-xs uppercase tracking-wide text-gray-400">
                  {block.language}
                </div>
              )}
              <pre className="overflow-x-auto p-3 text-sm leading-relaxed text-indigo-100">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        if (block.type === 'heading') {
          const className =
            block.depth === 1
              ? 'text-xl font-bold text-white'
              : block.depth === 2
                ? 'text-lg font-bold text-white'
                : 'text-base font-semibold text-white';

          return (
            <div key={index} className={className}>
              {parseInline(block.content)}
            </div>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';

          return (
            <ListTag
              key={index}
              className={`space-y-1 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {parseInline(block.content)}
          </p>
        );
      })}
    </div>
  );
}
