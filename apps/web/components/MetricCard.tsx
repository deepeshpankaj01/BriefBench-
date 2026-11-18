import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "emerald" | "indigo" | "cyan" | "amber";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = "indigo",
}: MetricCardProps) {
  const badgeStyles = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition hover:border-border/80">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="p-2 rounded-lg bg-secondary/80 text-muted-foreground">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono">{value}</h3>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeStyles[badgeVariant]}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
