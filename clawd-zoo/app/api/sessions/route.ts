import { getAllSessions } from '@/lib/registry';

export async function GET() {
  return Response.json(getAllSessions());
}
