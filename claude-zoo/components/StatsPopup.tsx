'use client';

import type { SessionStats } from '@/lib/types';

interface StatsPopupProps {
  stats: SessionStats;
  side: 'left' | 'right';
}

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remSecs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(1) + 'k';
  return (n / 1_000_000).toFixed(2) + 'M';
}

// Rough cost estimate based on Claude pricing
function estimateCost(stats: SessionStats): string {
  // opus input: $15/M, output: $75/M, cache read: $1.50/M, cache write: $18.75/M
  // sonnet input: $3/M, output: $15/M, cache read: $0.30/M, cache write: $3.75/M
  const isOpus = stats.model?.includes('opus');
  const inputRate = isOpus ? 15 : 3;
  const outputRate = isOpus ? 75 : 15;
  const cacheReadRate = isOpus ? 1.5 : 0.3;
  const cacheWriteRate = isOpus ? 18.75 : 3.75;

  const cost =
    (stats.totalInputTokens / 1_000_000) * inputRate +
    (stats.totalOutputTokens / 1_000_000) * outputRate +
    (stats.totalCacheReadTokens / 1_000_000) * cacheReadRate +
    (stats.totalCacheWriteTokens / 1_000_000) * cacheWriteRate;

  return '$' + cost.toFixed(2);
}

const labelStyle = { color: '#7A7060' };
const valueStyle = { color: '#2A2A2A', fontWeight: 'bold' as const };

export default function StatsPopup({ stats, side }: StatsPopupProps) {
  const topTools = Object.entries(stats.toolBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div
      className="absolute top-0 w-[220px] p-3 space-y-2"
      data-side={side}
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#2A2A2A',
        background: '#FFFBE6',
        border: '1px solid #B0A890',
        borderRadius: '2px',
        boxShadow: '1px 1px 0 rgba(0,0,0,0.08)',
        imageRendering: 'pixelated',
        ...(side === 'right' ? { left: '100%', marginLeft: 8 } : { right: '100%', marginRight: 8 }),
      }}
    >
      <div className="flex justify-between">
        <span style={labelStyle}>model</span>
        <span style={valueStyle}>{stats.model?.replace('claude-', '') ?? '?'}</span>
      </div>
      <div className="flex justify-between">
        <span style={labelStyle}>est. cost</span>
        <span style={valueStyle}>{estimateCost(stats)}</span>
      </div>
      <div style={{ borderTop: '1px solid #B0A890', margin: '4px 0' }} />
      <div className="flex justify-between">
        <span style={labelStyle}>messages</span>
        <span style={valueStyle}>{stats.userMessages}</span>
      </div>
      <div className="flex justify-between">
        <span style={labelStyle}>responses</span>
        <span style={valueStyle}>{stats.assistantTurns}</span>
      </div>
      <div style={{ borderTop: '1px solid #B0A890', margin: '4px 0' }} />
      <div className="flex justify-between">
        <span style={labelStyle}>in tokens</span>
        <span style={valueStyle}>{formatTokens(stats.totalInputTokens)}</span>
      </div>
      <div className="flex justify-between">
        <span style={labelStyle}>out tokens</span>
        <span style={valueStyle}>{formatTokens(stats.totalOutputTokens)}</span>
      </div>
      <div className="flex justify-between">
        <span style={labelStyle}>cache read</span>
        <span style={valueStyle}>{formatTokens(stats.totalCacheReadTokens)}</span>
      </div>
      <div className="flex justify-between">
        <span style={labelStyle}>cache write</span>
        <span style={valueStyle}>{formatTokens(stats.totalCacheWriteTokens)}</span>
      </div>
    </div>
  );
}
