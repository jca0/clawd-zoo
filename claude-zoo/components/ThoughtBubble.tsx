'use client';

import type { Session } from '@/lib/types';

interface ThoughtBubbleProps {
  session: Session;
  onToggleExpand: () => void;
  expanded: boolean;
}

export default function ThoughtBubble({ session, onToggleExpand, expanded }: ThoughtBubbleProps) {
  let content: string;
  if (session.lastToolInput) {
    content = session.lastToolInput.length > 100
      ? session.lastToolInput.slice(0, 100) + '...'
      : session.lastToolInput;
  } else if (session.lastTool) {
    content = `using ${session.lastTool}`;
  } else {
    content = 'thinking...';
  }

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4">
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2 max-w-[250px]">
        <p className="text-sm text-gray-700 break-words">{content}</p>
        <button
          onClick={onToggleExpand}
          className="text-xs text-blue-500 hover:text-blue-700 mt-1"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      {/* Thought bubble trailing circles */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-white border border-gray-200 rounded-full mt-1" />
        <div className="w-2 h-2 bg-white border border-gray-200 rounded-full mt-0.5" />
      </div>
    </div>
  );
}
