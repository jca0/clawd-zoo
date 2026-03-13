'use client';

import { useState } from 'react';
import type { ParsedMessage } from '@/lib/types';

interface ConversationViewProps {
  messages: ParsedMessage[];
  onClose: () => void;
}

const boxStyle = {
  fontFamily: 'monospace',
  color: '#2A2A2A',
  border: '3px solid #2A2A2A',
  borderRadius: '2px',
  boxShadow: '3px 3px 0 #2A2A2A',
  imageRendering: 'pixelated' as const,
};

function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="cursor-pointer px-2 py-1"
      style={{ ...boxStyle, background: '#E8E8E8' }}
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-[10px] italic">
        {expanded ? content : '~ thinking ~'}
      </span>
    </div>
  );
}

function ToolResultBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.length > 60 ? content.slice(0, 60) + '...' : content;
  return (
    <div
      className="cursor-pointer px-2 py-1"
      style={{ ...boxStyle, background: '#E8E8E8' }}
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-[10px]">{expanded ? content : preview}</span>
    </div>
  );
}

export default function ConversationView({ messages, onClose }: ConversationViewProps) {
  return (
    <div
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 overflow-auto p-2 space-y-1"
      style={{ ...boxStyle, background: '#FFFBE6', resize: 'both', width: 260, height: 300, minWidth: 180, minHeight: 120 }}
    >
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="text-[10px] px-1 cursor-pointer"
          style={{ fontFamily: 'monospace', color: '#2A2A2A', background: '#E8E8E8', border: '2px solid #2A2A2A', borderRadius: '2px' }}
        >
          x close
        </button>
      </div>
      {messages.map((msg, i) => {
        if (msg.type === 'thinking') {
          return <ThinkingBlock key={i} content={msg.content} />;
        }

        if (msg.type === 'tool_result') {
          return <ToolResultBlock key={i} content={msg.content} />;
        }

        if (msg.type === 'tool_use') {
          return (
            <div key={i} className="px-2 py-1" style={{ ...boxStyle, background: '#F0EAD6' }}>
              <span className="text-[10px] font-bold">{msg.toolName}</span>
              {msg.content && (
                <p className="text-[10px] mt-0.5 break-words">{msg.content}</p>
              )}
            </div>
          );
        }

        const isUser = msg.role === 'user';
        return (
          <div
            key={i}
            className="px-2 py-1 text-[10px] break-words"
            style={{ ...boxStyle, background: isUser ? '#D6EAFF' : '#FFFFFF' }}
          >
            {msg.content}
          </div>
        );
      })}
    </div>
  );
}
