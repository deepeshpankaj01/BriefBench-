"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlaySquare,
  CheckCircle2,
  Clock,
  Layers,
  Coins,
  Bot,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration, formatCost, formatTokens } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

interface StatsData {
  overview: {
    totalExperiments: number;
    totalRuns: number;
    successfulRuns: number;
    reliability: number;
    successRate: number;
    avgDurationMs: number;
    avgToolCalls: number;
    avgRetries: number;
    avgTokens: number;
    avgCostUsd: number | null;
  };
  agentSummaries: Array<{
    agentName: string;
    framework: string;
    repetitionCount: number;
    successRate: number;
    meanDurationMs: number;
    meanOverallScore: number;
    meanFactualAccuracy: number;
    meanEvidenceSupport: number;
    reliabilityScore: number;
  }>;
  recentExperiments: Array<{
    id: string;
    name: string;
    taskTitle: string;
    status: string;
    repetitions: number;
    totalRuns: number;
    successRate: number;
    meanOverallScore: number;
    meanDurationMs: number;
    createdAt: string;
    isDemo: boolean;
  }>;
  chartData: Array<{
    label: string;
    name: string;
    nativeDuration: number;
    langgraphDuration: number;
    nativeScore: number;
    langgraphScore: number;
    tokens: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-secondary rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-card border border-border rounded-xl"></div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalExperiments: 0,
    totalRuns: 0,
    successfulRuns: 0,
    reliability: 0,
    successRate: 0,
    avgDurationMs: 0,
    avgToolCalls: 0,
    avgRetries: 0,
    avgTokens: 0,
    avgCostUsd: null,
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Benchmark Observability</h1>
            <DemoBadge isDemo={true} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time evaluation metrics, latency profiles, and factual grounding telemetry across registered agents.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/research"
            className="px-3.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition"
          >
            Start Meeting Research
          </Link>
          <Link
            href="/benchmarks"
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition"
          >
            Launch Benchmark Run
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Experiments"
          value={overview.totalExperiments}
          subtitle={`${overview.totalRuns} total runs`}
          icon={PlaySquare}
        />
        <MetricCard
          title="Success Rate"
          value={`${(overview.successRate * 100).toFixed(0)}%`}
          subtitle={`${overview.successfulRuns} of ${overview.totalRuns} passed`}
          icon={CheckCircle2}
          badge={`${(overview.successRate * 100).toFixed(0)}%`}
          badgeVariant="emerald"
        />
        <MetricCard
          title="Reliability Index"
          value={`${overview.reliability}/100`}
          subtitle="Composite robustness"
          icon={ShieldCheck}
          badge="Robust"
          badgeVariant="cyan"
        />
        <MetricCard
          title="Avg Latency"
          value={formatDuration(overview.avgDurationMs)}
          subtitle={`${overview.avgToolCalls} tool calls/run`}
          icon={Clock}
        />
        <MetricCard
          title="Avg Tokens"
          value={formatTokens(overview.avgTokens)}
          subtitle="Prompt + completion"
          icon={Layers}
        />
        <MetricCard
          title="Reported Cost"
          value={formatCost(overview.avgCostUsd)}
          subtitle="Model gateway telemetry"
          icon={Coins}
        />
      </div>

      {/* Head-to-Head Visual Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Comparison */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Latency Distribution (ms)</h3>
              <p className="text-xs text-muted-foreground">Execution time comparison: Native TS vs LangGraph Python</p>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Bifrost Gateway</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.3} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="nativeDuration" name="Native TS Agent (ms)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="langgraphDuration" name="LangGraph Python (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Score Comparison */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quality Score Trend (0-100)</h3>
              <p className="text-xs text-muted-foreground">7-Dimension rubric score across repeated benchmark runs</p>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Rubric v1.0.0</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.3} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} domain={[70, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="nativeScore" name="Native TS Score" stroke="#818CF8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="langgraphScore" name="LangGraph Score" stroke="#22D3EE" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agents Summary Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Benchmarked Agent Leaderboard</h3>
            <p className="text-xs text-muted-foreground">Comparative summary based on frozen evidence snapshots</p>
          </div>
          <Link href="/leaderboard" className="text-xs text-primary hover:underline flex items-center space-x-1">
            <span>View Full Leaderboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Framework</th>
                <th className="py-3 px-4">Sample Size</th>
                <th className="py-3 px-4">Success Rate</th>
                <th className="py-3 px-4">Mean Score</th>
                <th className="py-3 px-4">Factual Accuracy</th>
                <th className="py-3 px-4">Evidence Support</th>
                <th className="py-3 px-4">Mean Latency</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.agentSummaries || []).map((ag) => (
                <tr key={ag.agentName} className="hover:bg-secondary/20 transition">
                  <td className="py-3.5 px-4 font-medium text-foreground flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span>{ag.agentName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-secondary border border-border">
                      {ag.framework}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{ag.repetitionCount} runs</td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-400 font-medium">{(ag.successRate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground text-sm font-mono">
                    {ag.meanOverallScore.toFixed(1)}/100
                  </td>
                  <td className="py-3.5 px-4 font-mono">{ag.meanFactualAccuracy.toFixed(1)}%</td>
                  <td className="py-3.5 px-4 font-mono">{ag.meanEvidenceSupport.toFixed(1)}%</td>
                  <td className="py-3.5 px-4 font-mono">{formatDuration(ag.meanDurationMs)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href="/comparison"
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Compare
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Experiments */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Benchmark Experiments</h3>
            <p className="text-xs text-muted-foreground">Historical test executions and reproducible audit records</p>
          </div>
          <Link href="/benchmarks" className="text-xs text-primary hover:underline flex items-center space-x-1">
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {(data?.recentExperiments || []).map((exp) => (
            <div
              key={exp.id}
              className="p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-semibold text-foreground">{exp.name}</h4>
                  <DemoBadge isDemo={exp.isDemo} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Task: {exp.taskTitle}</p>
              </div>

              <div className="flex items-center space-x-6 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px] block">Runs</span>
                  <span>{exp.totalRuns}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Mean Score</span>
                  <span className="font-bold text-foreground">{exp.meanOverallScore.toFixed(1)}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Mean Latency</span>
                  <span>{formatDuration(exp.meanDurationMs)}</span>
                </div>
                <div>
                  <Link
                    href={`/benchmarks/${exp.id}`}
                    className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-sans transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
