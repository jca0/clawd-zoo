import { updateToolUse } from '@/lib/registry';

function summarizeInput(toolName: string, toolInput: any): string | undefined {
  if (!toolInput) return undefined;
  if (toolName === 'Bash' && toolInput.command) {
    return String(toolInput.command).slice(0, 100);
  }
  if (['Read', 'Edit', 'Write'].includes(toolName) && toolInput.file_path) {
    return toolInput.file_path;
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, cwd, tool_name, tool_input } = body;
    console.log('[clawd-zoo] post-tool-use:', { session_id, cwd, tool_name });
    if (typeof session_id === 'string' && session_id) {
      const summary = summarizeInput(tool_name ?? '', tool_input);
      updateToolUse(session_id, cwd ?? '', tool_name ?? '', summary);
    }
  } catch (e) {
    console.error('[clawd-zoo] post-tool-use error:', e);
  }
  return Response.json({ ok: true });
}
