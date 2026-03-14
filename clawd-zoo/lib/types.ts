export interface Session {
  id: string;
  cwd: string;
  status: 'active' | 'idle' | 'done';
  lastTool: string | null;
  lastToolInput: string | null;
  lastActivity: number;
  startedAt: number;
  endedAt: number | null;
  lastMessage: string | null;
}

export interface SessionStats {
  duration: number; // ms since session start
  model: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  userMessages: number;
  assistantTurns: number;
  toolUses: number;
  toolBreakdown: Record<string, number>;
}

export interface ParsedMessage {
  role: 'user' | 'assistant';
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result';
  content: string;
  timestamp: string;
  toolName?: string;
}
