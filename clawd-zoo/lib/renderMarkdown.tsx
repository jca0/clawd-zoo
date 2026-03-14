import type { ReactNode } from 'react';

/** Lightweight inline markdown: **bold**, *italic*, `code`, - lists, ### headers */
export function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      elements.push(
        <div key={i} className="font-bold mt-1">
          {renderInline(headerMatch[2])}
        </div>
      );
      continue;
    }

    // List items
    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      elements.push(
        <div key={i} className="flex">
          <span className="mr-1 shrink-0">&bull;</span>
          <span>{renderInline(listMatch[1])}</span>
        </div>
      );
      continue;
    }

    // Empty lines become small spacers
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      continue;
    }

    // Regular text
    elements.push(<div key={i}>{renderInline(line)}</div>);
  }

  return <>{elements}</>;
}

export function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code key={match.index} className="bg-black/10 px-0.5 rounded-sm">
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
