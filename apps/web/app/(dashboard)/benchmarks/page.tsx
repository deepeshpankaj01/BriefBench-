"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  PlaySquare,
  CheckCircle2,
  Clock,
  Layers,
  Bot,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  FileCheck,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration } from "@/lib/utils";

interface BenchmarkExperimentSummary {
  id: string;
  name: string;
  status: string;
  taskTitle: string;
  companyName: string;
  snapshotDigest: string;
  repetitions: number;
  totalRuns: number;
  participatingAgents: string[];
  metrics: {
    successRate: number;
    meanOverallScore: number;
    meanDurationMs: number;
    meanTokens: number;
    meanToolCalls: number;
  };
  isDemo: boolean;
  createdAt: string;
}

export default function BenchmarksPage() {
  const [experiments, setExperiments] = useState<BenchmarkExperimentSummary[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Experiment Form State
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [repetitions, setRepetitions] = useState<number>(3);
  const [experimentName, setExperimentName] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [expRes, agentsRes, evidenceRes] = await Promise.all([
        fetch("/api/benchmarks/experiments"),
        fetch("/api/agents"),
        fetch("/api/evidence"),
      ]);

      const [expJson, agentsJson, evidenceJson] = await Promise.all([
        expRes.json(),
        agentsRes.json(),
        evidenceRes.json(),
      ]);

      if (expJson.success) setExperiments(expJson.experiments);
      if (agentsJson.success) {
        setAgents(agentsJson.agents);
        // Default select all active agents
        setSelectedAgentIds(agentsJson.agents.filter((a: any) => a.isEnabled).map((a: any) => a.id));
      }
      if (evidenceJson.success && evidenceJson.snapshots.length > 0) {
        setTasks(evidenceJson.snapshots);
        setSelectedTaskId(evidenceJson.snapshots[0].task.id);
        setExperimentName(`${evidenceJson.snapshots[0].task.companyName || "Enterprise"} Multi-Agent Benchmark`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleLaunchBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || selectedAgentIds.length === 0) return;

    setIsRunning(true);
    const targetSnapshot = tasks.find((t) => t.task.id === selectedTaskId);

    try {
      const res = await fetch("/api/benchmarks/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: experimentName || "Custom Multi-Agent Benchmark",
          taskId: selectedTaskId,
          snapshotId: targetSnapshot ? targetSnapshot.id : "",
          agentIds: selectedAgentIds,
          repetitions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(`Benchmark failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to launch benchmark.");
    } finally {
      setIsRunning(false);
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Benchmark Engine</h1>
          <DemoBadge isDemo={true} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Execute fair, multi-agent evaluations against frozen evidence snapshots. Configure repeated iterations to capture variance, tool efficiency, and factual grounding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Launch Benchmark Form */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center space-x-2">
              <Play className="w-4 h-4 text-primary fill-current" />
              <span>Configure Benchmark Experiment</span>
            </h2>
            <p className="text-[11px] text-muted-foreground">Select task, evidence snapshot, and competing agents</p>
          </div>

          <form onSubmit={handleLaunchBenchmark} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-foreground mb-1">Experiment Name</label>
              <input
                type="text"
                required
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Benchmark Task & Frozen Snapshot *</label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  const found = tasks.find((t) => t.task.id === e.target.value);
                  if (found) {
                    setExperimentName(`${found.task.companyName || "Enterprise"} Multi-Agent Benchmark`);
                  }
                }}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
              >
                {tasks.map((snap) => (
                  <option key={snap.id} value={snap.task.id}>
                    {snap.task.title} (SHA-256: {snap.digest.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1.5">Select Competing Agents ({selectedAgentIds.length} selected)</label>
              <div className="space-y-2">
                {agents.map((ag) => {
                  const isChecked = selectedAgentIds.includes(ag.id);
                  return (
                    <div
                      key={ag.id}
                      onClick={() => toggleAgentSelection(ag.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                        isChecked ? "bg-secondary/70 border-primary" : "bg-secondary/20 border-border"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Bot className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-semibold text-foreground block">{ag.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{ag.framework} • v{ag.latestVersion}</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-foreground">Repetitions for Statistical Variance</label>
                <span className="font-mono text-primary font-bold">{repetitions} runs / agent</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={repetitions}
                onChange={(e) => setRepetitions(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 (Fast)</span>
                <span>3 (Recommended)</span>
                <span>5 (High Confidence)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRunning || selectedAgentIds.length === 0}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing {repetitions * selectedAgentIds.length} Agent Runs...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Benchmark Experiment</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Experiment History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Benchmark Experiments ({experiments.length})</h2>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground transition"
              title="Refresh experiments"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 hover:border-border/80 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-foreground">{exp.name}</h3>
                      <DemoBadge isDemo={exp.isDemo} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Task: {exp.taskTitle}</p>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono self-start sm:self-auto">
                    {exp.status}
                  </span>
                </div>

                {/* Evidence Snapshot Hash */}
                <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground bg-secondary/30 p-2 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Snapshot SHA-256:</span>
                  <span className="text-foreground">{exp.snapshotDigest.slice(0, 16)}...</span>
                </div>

                {/* Performance Metrics Summary */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-secondary/20">
                    <span className="text-[10px] text-muted-foreground block">Runs</span>
                    <span className="font-bold text-foreground">{exp.totalRuns}</span>
                  </div>
                  <div className="p-2 rounded bg-secondary/20">
                    <span className="text-[10px] text-muted-foreground block">Mean Score</span>
                    <span className="font-bold text-foreground">{exp.metrics.meanOverallScore.toFixed(1)}/100</span>
                  </div>
                  <div className="p-2 rounded bg-secondary/20">
                    <span className="text-[10px] text-muted-foreground block">Mean Latency</span>
                    <span className="font-bold text-foreground">{formatDuration(exp.metrics.meanDurationMs)}</span>
                  </div>
                  <div className="p-2 rounded bg-secondary/20">
                    <span className="text-[10px] text-muted-foreground block">Success Rate</span>
                    <span className="font-bold text-emerald-400">{(exp.metrics.successRate * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Competing Agents & Action */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center space-x-1.5 text-muted-foreground">
                    <span>Agents:</span>
                    <span className="text-foreground font-medium">{exp.participatingAgents.join(", ")}</span>
                  </div>

                  <Link
                    href={`/benchmarks/${exp.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium flex items-center space-x-1 transition"
                  >
                    <span>Inspect Results & Traces</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
