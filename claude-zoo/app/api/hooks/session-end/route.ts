import { endSession } from '@/lib/registry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id } = body;
    console.log('[claude-zoo] session-end:', { session_id });
    if (typeof session_id === 'string' && session_id) {
      endSession(session_id);
    }
  } catch (e) {
    console.error('[claude-zoo] session-end error:', e);
  }
  return Response.json({ ok: true });
}
