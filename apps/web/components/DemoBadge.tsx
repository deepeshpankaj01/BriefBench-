import React from "react";

interface DemoBadgeProps {
  isDemo?: boolean;
  className?: string;
}

export function DemoBadge({ isDemo = true, className = "" }: DemoBadgeProps) {
  if (!isDemo) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
        VERIFIED LIVE
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
      DEMO DATA
    </span>
  );
}
