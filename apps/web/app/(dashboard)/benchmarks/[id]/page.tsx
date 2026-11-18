"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Layers,
  Coins,
  Bot,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration, formatCost, formatTokens } from "@/lib/utils";

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await fetch(`/api/benchmarks/experiments/${id}`);
        const json = await res.json();
        if (json.success) {
          setData(json.experiment);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-48"></div>
        <div className="h-32 bg-card border border-border rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-card border border-border rounded-xl"></div>
          <div className="h-64 bg-card border border-border rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-xs">
        <p className="text-muted-foreground">Experiment not found.</p>
        <Link href="/benchmarks" className="text-primary hover:underline mt-2 inline-block">
          Return to Benchmarks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/benchmarks"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Benchmark Engine</span>
        </Link>

        <div className="flex items-center space-x-2">
          <a
            href={`/api/export?experimentId=${data.id}&format=csv`}
            download
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium flex items-center space-x-1 transition"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </a>
          <a
            href={`/api/export?experimentId=${data.id}&format=json`}
            download
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium flex items-center space-x-1 transition"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Experiment Overview Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{data.name}</h1>
              <DemoBadge isDemo={data.isDemo} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Task: <span className="font-medium text-foreground">{data.task?.title}</span> • Objective: {data.task?.objective}
            </p>
          </div>

          <span className="px-2.5 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium self-start md:self-auto">
            {data.status} ({data.repetitions} reps / agent)
          </span>
        </div>

        {/* Frozen Snapshot Verification Banner */}
        <div className="p-3.5 rounded-lg bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-muted-foreground">Frozen Evidence Snapshot:</span>
            <span className="text-foreground font-semibold">{data.snapshot?.digest}</span>
          </div>
          <span className="text-muted-foreground text-[11px]">{data.snapshot?.totalSources} verified sources</span>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs font-mono text-center">
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground uppercase block">Total Runs</span>
            <span className="text-base font-bold text-foreground">{data.overallMetrics?.repetitionCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground uppercase block">Mean Score</span>
            <span className="text-base font-bold text-foreground">{data.overallMetrics?.meanOverallScore.toFixed(1)}/100</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground uppercase block">Mean Latency</span>
            <span className="text-base font-bold text-foreground">{formatDuration(data.overallMetrics?.meanDurationMs)}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground uppercase block">Mean Tokens</span>
            <span className="text-base font-bold text-foreground">{formatTokens(data.overallMetrics?.meanTokens)}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground uppercase block">Reported Cost</span>
            <span className="text-base font-bold text-foreground">{formatCost(data.overallMetrics?.meanCostUsd)}</span>
          </div>
        </div>
      </div>

      {/* Agent Comparison Breakdown */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-foreground">Agent Performance & Run Diffs</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(data.agentComparisons || []).map((ag: any) => (
            <div key={ag.agentId} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center space-x-2.5">
                  <Bot className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{ag.agentName}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground">{ag.framework}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-foreground">{ag.metrics?.meanOverallScore.toFixed(1)}/100</span>
                  <span className="text-[10px] text-muted-foreground block">Mean Score</span>
                </div>
              </div>

              {/* Individual Repetition Runs */}
              <div className="space-y-2.5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Individual Runs ({ag.runs?.length || 0})
                </span>

                {ag.runs?.map((run: any) => (
                  <div
                    key={run.id}
                    className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">Run #{run.repetitionIndex}</span>
                        <span className="text-emerald-400 font-mono text-[11px] font-medium">
                          {run.evaluation?.overallScore ? `${run.evaluation.overallScore.toFixed(1)}/100` : "Passed"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-muted-foreground font-mono mt-0.5">
                        <span>{formatDuration(run.durationMs)}</span>
                        <span>•</span>
                        <span>{formatTokens(run.totalTokens)} tok</span>
                        <span>•</span>
                        <span>{run.toolCallCount} tools</span>
                      </div>
                    </div>

                    <Link
                      href={`/traces/${run.id}`}
                      className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-medium flex items-center space-x-1 transition"
                    >
                      <span>Trace ({run.traceCount} steps)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Rubric Dimension Subscores */}
              {ag.runs[0]?.evaluation && (
                <div className="pt-3 border-t border-border space-y-1.5 text-xs font-mono">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-2">
                    Evaluation Rubric Breakdown
                  </span>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Factual Accuracy (25%):</span>
                    <span className="text-foreground">{ag.runs[0].evaluation.factualAccuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evidence & Citations (20%):</span>
                    <span className="text-foreground">{ag.runs[0].evaluation.evidenceSupport}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Task Completion (15%):</span>
                    <span className="text-foreground">{ag.runs[0].evaluation.taskCompletion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Research Completeness (15%):</span>
                    <span className="text-foreground">{ag.runs[0].evaluation.researchCompleteness}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actionability & Questions (10%):</span>
                    <span className="text-foreground">{ag.runs[0].evaluation.actionability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instruction Adherence (10%):</span>
                    <span className="text-foreground">{ag.runs[0].evaluation.instructionAdherence}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
