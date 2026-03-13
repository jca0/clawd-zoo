import { promises as fs } from 'fs';
import type { ParsedMessage } from '@/lib/types';

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
