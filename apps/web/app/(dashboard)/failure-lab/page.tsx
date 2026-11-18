"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  Info,
  Layers,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration } from "@/lib/utils";

interface Scenario {
  code: string;
  name: string;
  category: string;
  description: string;
  triggerStep: string;
  expectedAgentBehavior: string;
}

export default function FailureLabPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [experimentResult, setExperimentResult] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const [scenariosRes, agentsRes] = await Promise.all([
          fetch("/api/failure-lab"),
          fetch("/api/agents"),
        ]);
        const [scenariosJson, agentsJson] = await Promise.all([
          scenariosRes.json(),
          agentsRes.json(),
        ]);

        if (scenariosJson.success && scenariosJson.scenarios.length > 0) {
          setScenarios(scenariosJson.scenarios);
          setSelectedScenario(scenariosJson.scenarios[0]);
        }
        if (agentsJson.success) {
          setAgents(agentsJson.agents);
          setSelectedAgentIds(agentsJson.agents.map((a: any) => a.id));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleTriggerFault = async () => {
    if (!selectedScenario || selectedAgentIds.length === 0) return;
    setRunning(true);
    setExperimentResult(null);

    try {
      const res = await fetch("/api/failure-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faultCode: selectedScenario.code,
          agentIds: selectedAgentIds,
          repetitions: 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExperimentResult(data.experiment);
      } else {
        alert(`Fault test failed: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to execute fault simulation.");
    } finally {
      setRunning(false);
    }
  };

  const categoryColors = {
    MODEL: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    TOOL: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    EVIDENCE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    SCHEMA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    RESILIENCE: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Controlled Failure Testing Lab</h1>
          <DemoBadge isDemo={true} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Stress-test AI agents with 10 deterministic failure scenarios. Benchmark real recovery behaviours, fallback logic,
          and prompt injection resistance without impacting live production systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Fault Scenario Selector */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center space-x-2">
            <Flame className="w-4 h-4 text-red-400" />
            <span>10 Controlled Fault Scenarios</span>
          </h2>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {scenarios.map((sc) => {
              const isSelected = selectedScenario?.code === sc.code;
              return (
                <div
                  key={sc.code}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-secondary/70 border-red-500/50 shadow-sm"
                      : "bg-card border-border hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{sc.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{sc.description}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                        categoryColors[sc.category as keyof typeof categoryColors] || "bg-secondary text-foreground"
                      }`}
                    >
                      {sc.category}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Trigger: {sc.triggerStep}</span>
                    <span className="text-red-400">Deterministic Adapter</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Fault Lab Execution & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {selectedScenario && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
              {/* Scenario Details */}
              <div className="border-b border-border pb-4">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <h3 className="text-base font-bold text-foreground">{selectedScenario.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {selectedScenario.description}
                </p>

                <div className="mt-3 p-3 rounded-lg bg-secondary/40 border border-border text-xs space-y-1">
                  <span className="font-semibold text-foreground block">Expected Resilient Agent Behavior:</span>
                  <p className="text-muted-foreground leading-relaxed">{selectedScenario.expectedAgentBehavior}</p>
                </div>
              </div>

              {/* Target Agents Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Select Agents to Subject to Fault ({selectedAgentIds.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {agents.map((ag) => {
                    const isChecked = selectedAgentIds.includes(ag.id);
                    return (
                      <div
                        key={ag.id}
                        onClick={() =>
                          setSelectedAgentIds((prev) =>
                            prev.includes(ag.id) ? prev.filter((i) => i !== ag.id) : [...prev, ag.id]
                          )
                        }
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition ${
                          isChecked ? "bg-secondary/80 border-primary" : "bg-secondary/20 border-border"
                        }`}
                      >
                        <span className="font-medium text-foreground">{ag.name}</span>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="text-primary rounded" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Button */}
              <button
                onClick={handleTriggerFault}
                disabled={running || selectedAgentIds.length === 0}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 text-xs transition"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Simulating Controlled Fault & Testing Recovery...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Inject Fault & Compare Agent Recovery</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Fault Experiment Comparison Results */}
          {experimentResult && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Fault Recovery Comparison</h3>
                  <p className="text-[11px] text-muted-foreground">Head-to-head resilience under {selectedScenario?.name}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                  FAULT INJECTED
                </span>
              </div>

              <div className="space-y-3">
                {experimentResult.runs.map((run: any) => {
                  const recovered = run.status === "SUCCESS";
                  return (
                    <div
                      key={run.id}
                      className={`p-4 rounded-xl border space-y-2 text-xs ${
                        recovered ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {recovered ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-bold text-foreground">{run.agent?.name}</span>
                        </div>

                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[10px] font-semibold ${
                            recovered ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                          }`}
                        >
                          {recovered ? "RECOVERED SUCCESSFULLY" : "TERMINATED WITH FAILURE"}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
                        <div>
                          <span>Latency: </span>
                          <span className="text-foreground">{formatDuration(run.durationMs)}</span>
                        </div>
                        <div>
                          <span>Retries: </span>
                          <span className="text-foreground">{run.retryCount}</span>
                        </div>
                        <div>
                          <span>Score: </span>
                          <span className="text-foreground">{run.evaluation?.overallScore ? `${run.evaluation.overallScore.toFixed(1)}/100` : "0/100"}</span>
                        </div>
                        <div className="text-right">
                          <Link href={`/traces/${run.id}`} className="text-primary hover:underline">
                            Inspect Trace →
                          </Link>
                        </div>
                      </div>

                      {run.errorMessage && (
                        <p className="text-[11px] text-red-400 font-mono bg-charcoal-950 p-2 rounded">
                          {run.errorMessage}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
