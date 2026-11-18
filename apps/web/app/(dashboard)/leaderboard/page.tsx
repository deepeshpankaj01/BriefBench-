"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Coins,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration, formatCost, formatTokens } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  name: string;
  slug: string;
  framework: string;
  version: string;
  model: string;
  sampleSize: number;
  successRate: number;
  reliabilityScore: number;
  meanOverallScore: number;
  meanFactualAccuracy: number;
  meanEvidenceSupport: number;
  avgDurationMs: number;
  avgTokens: number;
  avgCostUsd: number | null;
  avgToolCalls: number;
  isDemo: boolean;
  evaluationConditions: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rubric, setRubric] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (json.success) {
          setEntries(json.leaderboard);
          setRubric(json.evaluationRubric);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-48"></div>
        <div className="h-96 bg-card border border-border rounded-xl"></div>
      </div>
    );
  }

  const rankBadges = [
    { rank: 1, color: "text-amber-400 bg-amber-400/10 border-amber-400/20", label: "1ST PLACE" },
    { rank: 2, color: "text-slate-300 bg-slate-300/10 border-slate-300/20", label: "2ND PLACE" },
    { rank: 3, color: "text-amber-600 bg-amber-600/10 border-amber-600/20", label: "3RD PLACE" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Verified Agent Leaderboard</h1>
          <DemoBadge isDemo={true} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Scientific ranking derived strictly from identical frozen evidence snapshots. No ungrounded rankings; all scores are backed by reproducible SHA-256 evidence digests and 7-dimension rubric evaluations.
        </p>
      </div>

      {/* Evaluation Rubric Transparency Banner */}
      {rubric && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-foreground">{rubric.name} (v{rubric.version})</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Standardized weighted criteria: Factual (25%), Citations (20%), Completion (15%), Research (15%), Actionability (10%), Adherence (10%), Consistency (5%).
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px] text-muted-foreground">
            <span>Gateway: Bifrost (Maxim AI)</span>
            <span>•</span>
            <span>Search: Tavily Core</span>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Agent & Architecture</th>
                <th className="py-3.5 px-4">Sample Size</th>
                <th className="py-3.5 px-4">Mean Score</th>
                <th className="py-3.5 px-4">Factual Accuracy</th>
                <th className="py-3.5 px-4">Citation Support</th>
                <th className="py-3.5 px-4">Mean Latency</th>
                <th className="py-3.5 px-4">Reliability</th>
                <th className="py-3.5 px-4 text-right">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const badge = rankBadges[idx];

                return (
                  <tr key={entry.id} className="hover:bg-secondary/20 transition">
                    <td className="py-4 px-4 font-mono font-bold">
                      {badge ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${badge.color}`}>
                          #{rank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">#{rank}</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2.5">
                        <Bot className="w-4 h-4 text-primary" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-foreground text-sm">{entry.name}</span>
                            <DemoBadge isDemo={entry.isDemo} />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {entry.framework} • Model: {entry.model} • v{entry.version}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono">{entry.sampleSize} runs</td>

                    <td className="py-4 px-4 font-bold text-foreground text-sm font-mono">
                      {entry.meanOverallScore.toFixed(1)}/100
                    </td>

                    <td className="py-4 px-4 font-mono text-emerald-400">
                      {entry.meanFactualAccuracy.toFixed(1)}%
                    </td>

                    <td className="py-4 px-4 font-mono text-cyan-400">
                      {entry.meanEvidenceSupport.toFixed(1)}%
                    </td>

                    <td className="py-4 px-4 font-mono text-muted-foreground">
                      {formatDuration(entry.avgDurationMs)}
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="text-foreground font-semibold">{entry.reliabilityScore}/100</span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/comparison"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Compare
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
