import { addSession } from '@/lib/registry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, cwd } = body;
    console.log('[claude-zoo] session-start:', { session_id, cwd });
    if (typeof session_id === 'string' && session_id) {
      addSession(session_id, cwd ?? '');
    }
  } catch (e) {
    console.error('[claude-zoo] session-start error:', e);
  }
  return Response.json({ ok: true });
}
