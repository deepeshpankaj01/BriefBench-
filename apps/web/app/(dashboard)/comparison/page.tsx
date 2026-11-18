"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitCompare,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Coins,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration, formatCost, formatTokens } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ComparisonStudioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComparison() {
      try {
        const res = await fetch("/api/comparison");
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-48"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-80 bg-card border border-border rounded-xl"></div>
          <div className="h-80 bg-card border border-border rounded-xl"></div>
        </div>
      </div>
    );
  }

  const agents = data?.agents || [];
  const radarChartData = data?.radarChartData || [];

  const agent1 = agents[0] || { name: "Agent Alpha", metrics: {} };
  const agent2 = agents[1] || { name: "Agent Beta", metrics: {} };

  const barData = [
    {
      metric: "Mean Latency (s)",
      [agent1.name]: (agent1.metrics?.meanDurationMs || 0) / 1000,
      [agent2.name]: (agent2.metrics?.meanDurationMs || 0) / 1000,
    },
    {
      metric: "Tokens / 100",
      [agent1.name]: (agent1.metrics?.meanTokens || 0) / 100,
      [agent2.name]: (agent2.metrics?.meanTokens || 0) / 100,
    },
    {
      metric: "Tool Calls",
      [agent1.name]: agent1.metrics?.meanToolCalls || 0,
      [agent2.name]: agent2.metrics?.meanToolCalls || 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Multi-Agent Comparison Studio</h1>
          <DemoBadge isDemo={true} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Side-by-side analytical evaluation across the 7-dimension rubric, latency efficiency, tool usage, and factual grounding on identical frozen evidence snapshots.
        </p>
      </div>

      {/* Visual Comparison: Radar & Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">7-Dimension Quality Radar</h3>
              <p className="text-xs text-muted-foreground">Factual grounding, citation coverage & instruction adherence</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Rubric v1.0.0</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                <PolarGrid stroke="#262626" opacity={0.4} />
                <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" fontSize={9} />
                <Radar
                  name={agent1.name}
                  dataKey={agent1.name}
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.25}
                />
                {agent2.name && (
                  <Radar
                    name={agent2.name}
                    dataKey={agent2.name}
                    stroke="#06B6D4"
                    fill="#06B6D4"
                    fillOpacity={0.25}
                  />
                )}
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Efficiency & Resource Consumption</h3>
              <p className="text-xs text-muted-foreground">Latency, token consumption & tool invocations</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Bifrost Gateway</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.3} />
                <XAxis dataKey="metric" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey={agent1.name} fill="#6366F1" radius={[4, 4, 0, 0]} />
                {agent2.name && <Bar dataKey={agent2.name} fill="#06B6D4" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparison Matrix */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Direct Metric Comparison Matrix</h3>
          <p className="text-xs text-muted-foreground">Statistical comparison derived from verified benchmark runs</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Evaluation Dimension</th>
                <th className="py-3 px-4 text-primary font-bold">{agent1.name}</th>
                <th className="py-3 px-4 text-cyan-400 font-bold">{agent2.name}</th>
                <th className="py-3 px-4 text-right">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Mean Overall Quality Score (0-100)</td>
                <td className="py-3 px-4 font-bold">{agent1.metrics?.meanOverallScore.toFixed(1)}/100</td>
                <td className="py-3 px-4 font-bold">{agent2.metrics?.meanOverallScore.toFixed(1)}/100</td>
                <td className="py-3 px-4 text-right text-emerald-400 font-sans">
                  {agent1.metrics?.meanOverallScore > agent2.metrics?.meanOverallScore ? `+${(agent1.metrics.meanOverallScore - agent2.metrics.meanOverallScore).toFixed(1)} ${agent1.name}` : `+${(agent2.metrics?.meanOverallScore - agent1.metrics?.meanOverallScore).toFixed(1)} ${agent2.name}`}
                </td>
              </tr>
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Factual Accuracy (25% Weight)</td>
                <td className="py-3 px-4">{agent1.radarDimensions?.factualAccuracy}%</td>
                <td className="py-3 px-4">{agent2.radarDimensions?.factualAccuracy}%</td>
                <td className="py-3 px-4 text-right text-emerald-400 font-sans">
                  {agent1.radarDimensions?.factualAccuracy >= agent2.radarDimensions?.factualAccuracy ? agent1.name : agent2.name}
                </td>
              </tr>
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Evidence & Citation Grounding (20%)</td>
                <td className="py-3 px-4">{agent1.radarDimensions?.evidenceSupport}%</td>
                <td className="py-3 px-4">{agent2.radarDimensions?.evidenceSupport}%</td>
                <td className="py-3 px-4 text-right text-emerald-400 font-sans">
                  {agent1.radarDimensions?.evidenceSupport >= agent2.radarDimensions?.evidenceSupport ? agent1.name : agent2.name}
                </td>
              </tr>
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Mean Execution Latency</td>
                <td className="py-3 px-4">{formatDuration(agent1.metrics?.meanDurationMs)}</td>
                <td className="py-3 px-4">{formatDuration(agent2.metrics?.meanDurationMs)}</td>
                <td className="py-3 px-4 text-right text-cyan-400 font-sans">
                  {agent1.metrics?.meanDurationMs < agent2.metrics?.meanDurationMs ? `Faster (${agent1.name})` : `Faster (${agent2.name})`}
                </td>
              </tr>
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Mean Token Consumption</td>
                <td className="py-3 px-4">{formatTokens(agent1.metrics?.meanTokens)}</td>
                <td className="py-3 px-4">{formatTokens(agent2.metrics?.meanTokens)}</td>
                <td className="py-3 px-4 text-right font-sans text-muted-foreground">
                  {agent1.metrics?.meanTokens < agent2.metrics?.meanTokens ? `More Efficient (${agent1.name})` : `More Efficient (${agent2.name})`}
                </td>
              </tr>
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Reported Model Cost (USD)</td>
                <td className="py-3 px-4">{formatCost(agent1.metrics?.meanCostUsd)}</td>
                <td className="py-3 px-4">{formatCost(agent2.metrics?.meanCostUsd)}</td>
                <td className="py-3 px-4 text-right font-sans text-muted-foreground">Bifrost Telemetry</td>
              </tr>
              <tr className="hover:bg-secondary/20">
                <td className="py-3 px-4 font-sans font-medium text-foreground">Composite Reliability Index (0-100)</td>
                <td className="py-3 px-4 font-bold">{agent1.metrics?.reliabilityScore}/100</td>
                <td className="py-3 px-4 font-bold">{agent2.metrics?.reliabilityScore}/100</td>
                <td className="py-3 px-4 text-right font-sans text-emerald-400">
                  {agent1.metrics?.reliabilityScore >= agent2.metrics?.reliabilityScore ? agent1.name : agent2.name}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
