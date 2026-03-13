'use client';

import { useState } from 'react';
import type { ParsedMessage } from '@/lib/types';

interface ConversationViewProps {
  messages: ParsedMessage[];
}

function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="bg-gray-100 rounded px-2 py-1 my-1 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-xs text-gray-500 italic">
        {expanded ? content : 'Thinking...'}
      </span>
    </div>
  );
}

function ToolResultBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.length > 100 ? content.slice(0, 100) + '...' : content;
  return (
    <div
      className="bg-gray-50 border border-gray-200 rounded px-2 py-1 my-1 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-xs text-gray-500">
        {expanded ? content : preview}
      </span>
    </div>
  );
}

export default function ConversationView({ messages }: ConversationViewProps) {
  return (
    <div className="max-h-[400px] overflow-y-auto w-full mt-2 space-y-1">
      {messages.map((msg, i) => {
        if (msg.type === 'thinking') {
          return <ThinkingBlock key={i} content={msg.content} />;
        }

        if (msg.type === 'tool_result') {
          return <ToolResultBlock key={i} content={msg.content} />;
        }

        if (msg.type === 'tool_use') {
          return (
            <div key={i} className="border border-gray-300 rounded px-2 py-1 my-1 font-mono text-xs">
              <span className="font-bold">{msg.toolName}</span>
              {msg.content && (
                <p className="text-gray-600 mt-0.5 break-words">{msg.content}</p>
              )}
            </div>
          );
        }

        // text messages
        const isUser = msg.role === 'user';
        return (
          <div
            key={i}
            className={`rounded px-2 py-1 my-1 text-sm break-words ${
              isUser
                ? 'bg-blue-50 text-gray-800'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            {msg.content}
          </div>
        );
      })}
    </div>
  );
}
