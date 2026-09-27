import React from 'react';
import { SeverityLevel } from '@/lib/api/types';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className = '',
  showDot = true,
}) => {
  const normalized = severity?.toLowerCase() as SeverityLevel;

  switch (normalized) {
    case 'critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 ${className}`}
        >
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />}
          critical
        </span>
      );

    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#f97316]/15 text-[#fb923c] border border-[#f97316]/30 ${className}`}
        >
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />}
          high
        </span>
      );

    case 'medium':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#eab308]/15 text-[#facc15] border border-[#eab308]/30 ${className}`}
        >
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />}
          medium
        </span>
      );

    case 'low':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 ${className}`}
        >
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
          low
        </span>
      );
  }
};
