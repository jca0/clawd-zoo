'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@/lib/types';
import ClawdInstance from '@/components/ClawdInstance';

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/sessions');
        if (!cancelled) {
          setSessions(await res.json());
          setTimeout(poll, 3000);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 3000);
      }
    }
    poll();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = {};
    let hasNew = false;
    for (const session of sessions) {
      if (!positions[session.id]) {
        hasNew = true;
        newPositions[session.id] = {
          x: Math.random() * 80 + 5,
          y: Math.random() * 60 + 10,
        };
      }
    }
    if (hasNew) {
      setPositions((prev) => ({ ...prev, ...newPositions }));
    }
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-lg text-center px-4">
          No active Claude Code sessions. Sessions will appear here when Claude Code instances start.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white overflow-auto">
      {sessions.map((session) => (
        <ClawdInstance
          key={session.id}
          session={session}
          position={positions[session.id] ?? { x: 50, y: 50 }}
        />
      ))}
    </div>
  );
}
