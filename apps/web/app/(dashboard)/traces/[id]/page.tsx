"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Layers,
  Coins,
  Bot,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Code,
  FileText,
  Activity,
  Terminal,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration, formatCost, formatTokens } from "@/lib/utils";

interface TraceStep {
  id: string;
  stepNumber: number;
  eventType: string;
  name: string;
  status: "SUCCESS" | "ERROR" | "RETRY" | "SKIPPED";
  durationMs: number;
  tokenUsage?: number;
  errorDetails?: string;
  timestamp: string;
  input?: any;
  output?: any;
}

export default function ExecutionTraceViewerPage() {
  const params = useParams();
  const id = params?.id as string;
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadTrace() {
      try {
        const res = await fetch(`/api/traces/${id}`);
        const json = await res.json();
        if (json.success) {
          setRun(json.run);
          // Expand first 3 steps by default
          const initialExpanded: Record<string, boolean> = {};
          (json.run.traces || []).slice(0, 3).forEach((t: TraceStep) => {
            initialExpanded[t.id] = true;
          });
          setExpandedSteps(initialExpanded);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadTrace();
  }, [id]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-48"></div>
        <div className="h-28 bg-card border border-border rounded-xl"></div>
        <div className="h-96 bg-card border border-border rounded-xl"></div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-8 text-center text-xs">
        <p className="text-muted-foreground">Run trace not found.</p>
        <Link href="/benchmarks" className="text-primary hover:underline mt-2 inline-block">
          Return to Benchmarks
        </Link>
      </div>
    );
  }

  const statusBadges = {
    SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
    RETRY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    SKIPPED: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href={`/benchmarks/${run.experiment?.id}`}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Experiment</span>
        </Link>

        <span className="font-mono text-xs text-muted-foreground">Run ID: {run.id}</span>
      </div>

      {/* Execution Summary Header */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-secondary text-primary">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-foreground">{run.agent?.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] bg-secondary border border-border font-mono">
                  {run.agent?.framework}
                </span>
                <DemoBadge isDemo={run.isDemo} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Model: <span className="text-foreground font-mono">{run.agent?.model}</span> • Version: v{run.agent?.version}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border self-start md:self-auto ${statusBadges[run.status as keyof typeof statusBadges] || statusBadges.SUCCESS}`}
          >
            {run.status}
          </span>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1 text-xs font-mono text-center">
          <div className="p-2.5 rounded-lg bg-secondary/30">
            <span className="text-[10px] text-muted-foreground uppercase block">Duration</span>
            <span className="text-sm font-bold text-foreground">{formatDuration(run.durationMs)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/30">
            <span className="text-[10px] text-muted-foreground uppercase block">Total Tokens</span>
            <span className="text-sm font-bold text-foreground">{formatTokens(run.totalTokens)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/30">
            <span className="text-[10px] text-muted-foreground uppercase block">Reported Cost</span>
            <span className="text-sm font-bold text-foreground">{formatCost(run.estimatedCostUsd)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/30">
            <span className="text-[10px] text-muted-foreground uppercase block">Tool Calls</span>
            <span className="text-sm font-bold text-foreground">{run.toolCallCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/30">
            <span className="text-[10px] text-muted-foreground uppercase block">Retries</span>
            <span className="text-sm font-bold text-foreground">{run.retryCount}</span>
          </div>
        </div>
      </div>

      {/* Execution Trace Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Step-by-Step Execution Trace</h2>
            <span className="text-xs text-muted-foreground">({run.traces?.length || 0} discrete events)</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                const all: Record<string, boolean> = {};
                run.traces.forEach((t: TraceStep) => (all[t.id] = true));
                setExpandedSteps(all);
              }}
              className="text-primary hover:underline"
            >
              Expand All
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => setExpandedSteps({})}
              className="text-primary hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {(run.traces || []).map((step: TraceStep) => {
            const isExpanded = expandedSteps[step.id];
            return (
              <div
                key={step.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition hover:border-border/80"
              >
                {/* Step Header */}
                <div
                  onClick={() => toggleStep(step.id)}
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-secondary/20 transition select-none"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-mono font-bold text-foreground">
                      {step.stepNumber}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-foreground">{step.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                          {step.eventType}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    {step.tokenUsage ? (
                      <span className="text-muted-foreground text-[11px]">{step.tokenUsage} tok</span>
                    ) : null}
                    <span className="text-muted-foreground">{formatDuration(step.durationMs)}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusBadges[step.status] || statusBadges.SUCCESS}`}
                    >
                      {step.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Step Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-secondary/30 border-t border-border space-y-3 text-xs">
                    {step.errorDetails && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[11px]">
                        <span className="font-bold block mb-1">Error Details:</span>
                        {step.errorDetails}
                      </div>
                    )}

                    {step.input && (
                      <div>
                        <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block mb-1">
                          Input Payload
                        </span>
                        <pre className="p-3 rounded-lg bg-charcoal-950 border border-border/60 text-muted-foreground font-mono text-[11px] overflow-x-auto max-h-48">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.output && (
                      <div>
                        <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block mb-1">
                          Output Payload / State Transition
                        </span>
                        <pre className="p-3 rounded-lg bg-charcoal-950 border border-border/60 text-muted-foreground font-mono text-[11px] overflow-x-auto max-h-48">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
