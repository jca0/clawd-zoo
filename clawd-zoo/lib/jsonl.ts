import { promises as fs } from 'fs';
import type { ParsedMessage, SessionStats } from '@/lib/types';

function summarizeToolInput(toolName: string, input: any): string {
  if (!input) return '';
  if (toolName === 'Bash' && input.command) return input.command;
  if (['Read', 'Edit', 'Write'].includes(toolName) && input.file_path) return input.file_path;
  return JSON.stringify(input).slice(0, 150);
}

function extractToolResultText(content: any): string {
  if (typeof content === 'string') return content.slice(0, 200);
  if (Array.isArray(content)) {
    return content
      .map((block: any) => (block && typeof block.text === 'string' ? block.text : ''))
      .filter(Boolean)
      .join('\n')
      .slice(0, 200);
  }
  return '';
}

export async function parseConversation(filePath: string): Promise<ParsedMessage[]> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const messages: ParsedMessage[] = [];

  for (const line of lines) {
    let entry: any;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const type = entry.type;
    const timestamp = entry.timestamp ?? '';

    if (type === 'user') {
      const content = entry.message?.content;
      if (typeof content === 'string') {
        messages.push({ role: 'user', type: 'text', content, timestamp });
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && typeof block.text === 'string') {
            messages.push({ role: 'user', type: 'text', content: block.text, timestamp });
          } else if (block.type === 'tool_result') {
            const text = extractToolResultText(block.content);
            if (text) {
              messages.push({ role: 'user', type: 'tool_result', content: text, timestamp });
            }
          }
        }
      }
    } else if (type === 'assistant') {
      const content = entry.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && typeof block.text === 'string') {
            messages.push({ role: 'assistant', type: 'text', content: block.text, timestamp });
          } else if (block.type === 'thinking' && typeof block.thinking === 'string') {
            messages.push({ role: 'assistant', type: 'thinking', content: block.thinking, timestamp });
          } else if (block.type === 'tool_use') {
            const toolName = block.name ?? 'unknown';
            const summary = summarizeToolInput(toolName, block.input);
            messages.push({
              role: 'assistant',
              type: 'tool_use',
              content: summary,
              timestamp,
              toolName,
            });
          }
        }
      }
    }
    // Skip progress, system, file-history-snapshot, and unknown types
  }

  return messages;
}

export async function parseStats(filePath: string, startedAt: number): Promise<SessionStats> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());

  let model: string | null = null;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheWriteTokens = 0;
  let userMessages = 0;
  let assistantTurns = 0;
  let toolUses = 0;
  const toolBreakdown: Record<string, number> = {};

  for (const line of lines) {
    let entry: any;
    try { entry = JSON.parse(line); } catch { continue; }

    if (entry.type === 'user' && !entry.isMeta) {
      userMessages++;
    }

    if (entry.type === 'assistant') {
      assistantTurns++;
      if (!model && entry.message?.model) {
        model = entry.message.model;
      }
      const usage = entry.message?.usage;
      if (usage) {
        totalInputTokens += usage.input_tokens ?? 0;
        totalOutputTokens += usage.output_tokens ?? 0;
        totalCacheReadTokens += usage.cache_read_input_tokens ?? 0;
        totalCacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
      }
      const content = entry.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'tool_use') {
            toolUses++;
            const name = block.name ?? 'unknown';
            toolBreakdown[name] = (toolBreakdown[name] ?? 0) + 1;
          }
        }
      }
    }
  }

  return {
    duration: Date.now() - startedAt,
    model,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheWriteTokens,
    userMessages,
    assistantTurns,
    toolUses,
    toolBreakdown,
  };
}
