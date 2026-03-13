'use client';

import { useState } from 'react';
import type { Session, ParsedMessage } from '@/lib/types';
import ThoughtBubble from '@/components/ThoughtBubble';
import ConversationView from '@/components/ConversationView';

interface ClawdInstanceProps {
  session: Session;
  position: { x: number; y: number };
}

function shortenPath(cwd: string): string {
  const segments = cwd.split('/').filter(Boolean);
  return segments.slice(-2).join('/');
}

export default function ClawdInstance({ session, position }: ClawdInstanceProps) {
  const [expanded, setExpanded] = useState(false);
  const [conversation, setConversation] = useState<ParsedMessage[] | null>(null);

  const isActive = session.status === 'active';

  async function handleToggleExpand() {
    if (expanded) {
      setExpanded(false);
      setConversation(null);
    } else {
      setExpanded(true);
      try {
        const res = await fetch(`/api/session/${session.id}/conversation`);
        if (res.ok) {
          setConversation(await res.json());
        }
      } catch {
        // silently fail
      }
    }
  }

  return (
    <div
      style={{ position: 'absolute', left: `${position.x}%`, top: `${position.y}%` }}
      className="flex flex-col items-center"
    >
      <div className="relative flex flex-col items-center">
        {isActive && (
          <ThoughtBubble
            session={session}
            onToggleExpand={handleToggleExpand}
            expanded={expanded}
          />
        )}
        <img
          src="/clawd.svg"
          alt="Clawd"
          width={80}
          height={80}
          className={isActive ? 'animate-clawd-bounce' : ''}
        />
      </div>
      <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
        {shortenPath(session.cwd)}
      </span>
      {expanded && conversation && (
        <ConversationView messages={conversation} />
      )}
    </div>
  );
}
