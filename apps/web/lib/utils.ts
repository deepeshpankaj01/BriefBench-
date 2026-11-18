import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms?: number | null): string {
  if (ms === null || ms === undefined) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatCost(usd?: number | null): string {
  if (usd === null || usd === undefined) return "Not reported";
  return `$${usd.toFixed(4)}`;
}

export function formatTokens(tokens?: number | null): string {
  if (tokens === null || tokens === undefined) return "Not reported";
  return new Intl.NumberFormat().format(tokens);
}

export function formatPercent(rate?: number | null): string {
  if (rate === null || rate === undefined) return "N/A";
  return `${(rate * 100).toFixed(1)}%`;
}

export function truncate(str: string, len: number = 100): string {
  if (!str) return "";
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}
