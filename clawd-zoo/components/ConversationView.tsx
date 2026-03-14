'use client';

import { useState, useRef, useCallback } from 'react';
import type { ParsedMessage } from '@/lib/types';
import { renderMarkdown } from '@/lib/renderMarkdown';

interface ConversationViewProps {
  messages: ParsedMessage[];
}

const boxStyle = {
  fontFamily: 'monospace',
  color: '#2A2A2A',
  border: '2px solid #2A2A2A',
  borderRadius: '2px',
  boxShadow: '2px 2px 0 #2A2A2A',
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

type Edge = 'left' | 'right' | 'bottom' | 'bottom-left' | 'bottom-right';

export default function ConversationView({ messages }: ConversationViewProps) {
  const [size, setSize] = useState({ w: 260, h: 300 });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const startResize = useCallback((edge: Edge) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.w;
    const startH = sizeRef.current.h;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newW = startW;
      let newH = startH;

      if (edge === 'right' || edge === 'bottom-right') {
        newW = Math.max(180, startW + dx * 2);
      }
      if (edge === 'left' || edge === 'bottom-left') {
        newW = Math.max(180, startW - dx * 2);
      }
      if (edge === 'bottom' || edge === 'bottom-left' || edge === 'bottom-right') {
        newH = Math.max(120, startH + dy);
      }

      setSize({ w: newW, h: newH });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div
      className="absolute top-full mt-2 overflow-auto p-2 space-y-1"
      style={{
        ...boxStyle,
        background: '#FFFBE6',
        width: size.w,
        height: size.h,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      {/* Resize handles */}
      <div className="absolute left-0 top-0 bottom-0 w-[6px] cursor-ew-resize" onMouseDown={startResize('left')} />
      <div className="absolute right-0 top-0 bottom-0 w-[6px] cursor-ew-resize" onMouseDown={startResize('right')} />
      <div className="absolute left-0 right-0 h-[10px] cursor-ns-resize" style={{ bottom: -7 }} onMouseDown={startResize('bottom')} />
      <div className="absolute w-[14px] h-[14px] cursor-nesw-resize" style={{ bottom: -7, left: -4 }} onMouseDown={startResize('bottom-left')} />
      <div className="absolute w-[14px] h-[14px] cursor-nwse-resize" style={{ bottom: -7, right: -4 }} onMouseDown={startResize('bottom-right')} />

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
            {isUser ? msg.content : renderMarkdown(msg.content)}
          </div>
        );
      })}
    </div>
  );
}
