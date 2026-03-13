import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { getSession } from '@/lib/registry';
import { parseStats } from '@/lib/jsonl';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = getSession(id);
  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  const normalizedCwd = session.cwd.replace(/\/+$/, '');
  const mangled = normalizedCwd.replaceAll('/', '-');
  const projectsBase = path.resolve(os.homedir(), '.claude', 'projects');
  const filePath = path.resolve(projectsBase, mangled, `${id}.jsonl`);

  if (!filePath.startsWith(projectsBase)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await fs.access(filePath);
  } catch {
    return Response.json({ error: 'Stats not found' }, { status: 404 });
  }

  const stats = await parseStats(filePath, session.startedAt);
  return Response.json(stats);
}
