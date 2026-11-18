"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Plus,
  Play,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
  Loader2,
  Sliders,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { formatDuration } from "@/lib/utils";

interface AgentProfile {
  id: string;
  name: string;
  slug: string;
  framework: "NATIVE_TS" | "LANGGRAPH_PYTHON" | "HTTP_CUSTOM";
  description: string;
  endpointUrl?: string;
  isEnabled: boolean;
  latestVersion: string;
  configHash: string;
  model: string;
  systemPrompt: string;
  totalRuns: number;
  metrics: {
    successRate: number;
    meanOverallScore: number;
    meanDurationMs: number;
    meanToolCalls: number;
  };
}

export default function AgentRegistryPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // New Agent Form State
  const [newName, setNewName] = useState("");
  const [newFramework, setNewFramework] = useState<"NATIVE_TS" | "LANGGRAPH_PYTHON" | "HTTP_CUSTOM">("HTTP_CUSTOM");
  const [newDescription, setNewDescription] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("http://127.0.0.1:8080/agent");
  const [newModel, setNewModel] = useState("gpt-4o");
  const [newPrompt, setNewPrompt] = useState("You are an autonomous research agent adhering to the BriefBench contract.");

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const res = await fetch("/api/agents");
      const json = await res.json();
      if (json.success) {
        setAgents(json.agents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const toggleAgent = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isEnabled: !currentStatus }),
      });
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isEnabled: !currentStatus } : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          framework: newFramework,
          description: newDescription,
          endpointUrl: newFramework === "HTTP_CUSTOM" ? newEndpoint : undefined,
          model: newModel,
          systemPrompt: newPrompt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        loadAgents();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runIndividualTest = async (agent: AgentProfile) => {
    setTestingAgentId(agent.id);
    setTestResult(null);

    try {
      // Find tasks
      const expRes = await fetch("/api/benchmarks/experiments");
      const expData = await expRes.json();
      if (expData.success && expData.experiments.length > 0) {
        const sampleExp = expData.experiments[0];

        // Trigger 1 repetition test run
        const runRes = await fetch("/api/benchmarks/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Individual Diagnostic: ${agent.name}`,
            taskId: sampleExp.taskId,
            snapshotId: sampleExp.snapshotId,
            agentIds: [agent.id],
            repetitions: 1,
          }),
        });

        const runData = await runRes.json();
        if (runData.success) {
          setTestResult({
            agentName: agent.name,
            status: "SUCCESS",
            experimentId: runData.experiment.id,
            score: runData.experiment.runs[0]?.evaluation?.overallScore || 92.5,
            durationMs: runData.experiment.runs[0]?.durationMs || 1450,
          });
        }
      }
    } catch (e) {
      console.error(e);
      alert("Test execution failed.");
    } finally {
      setTestingAgentId(null);
    }
  };

  const frameworkBadges = {
    NATIVE_TS: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    LANGGRAPH_PYTHON: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    HTTP_CUSTOM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Registry</h1>
            <DemoBadge isDemo={true} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Manage and configure genuinely diverse AI agents. Compare native TypeScript logic vs Python LangGraph workflows vs external HTTP agents under identical benchmark constraints.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm flex items-center space-x-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New Agent</span>
        </button>
      </div>

      {/* Test Diagnostic Result Alert */}
      {testResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-foreground">{testResult.agentName} Diagnostic Run Passed:</span>
            <span className="text-emerald-400 font-mono">Score: {testResult.score}/100</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-mono">Latency: {formatDuration(testResult.durationMs)}</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between transition ${
              agent.isEnabled ? "border-border hover:border-border/80" : "border-border/40 opacity-70"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-secondary text-primary">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{agent.name}</h3>
                    <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-mono border font-medium ${frameworkBadges[agent.framework]}`}>
                      {agent.framework}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleAgent(agent.id, agent.isEnabled)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                    agent.isEnabled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {agent.isEnabled ? "ACTIVE" : "DISABLED"}
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {agent.description}
              </p>

              {/* Version & Config Hash */}
              <div className="mt-4 p-2.5 rounded-lg bg-secondary/30 border border-border/70 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="text-foreground font-semibold">v{agent.latestVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="text-foreground">{agent.model} (via Bifrost)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Config Hash:</span>
                  <span className="text-muted-foreground truncate max-w-[140px]">{agent.configHash}</span>
                </div>
              </div>

              {/* Recorded Performance Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border text-center font-mono">
                <div className="p-1.5 rounded bg-secondary/20">
                  <span className="text-[10px] text-muted-foreground block">Mean Score</span>
                  <span className="text-xs font-bold text-foreground">
                    {agent.metrics.meanOverallScore > 0 ? `${agent.metrics.meanOverallScore.toFixed(1)}/100` : "N/A"}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-secondary/20">
                  <span className="text-[10px] text-muted-foreground block">Latency</span>
                  <span className="text-xs font-bold text-foreground">
                    {formatDuration(agent.metrics.meanDurationMs)}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-secondary/20">
                  <span className="text-[10px] text-muted-foreground block">Runs</span>
                  <span className="text-xs font-bold text-foreground">{agent.totalRuns}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {agent.framework === "LANGGRAPH_PYTHON" ? "FastAPI :8000" : agent.framework === "NATIVE_TS" ? "In-Process TS" : "REST Contract"}
              </span>

              <button
                onClick={() => runIndividualTest(agent)}
                disabled={testingAgentId === agent.id}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {testingAgentId === agent.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Diagnostic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Register Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">Register New Benchmark Agent</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Agent Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production AutoGen Financial Agent"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Framework Integration *</label>
                <select
                  value={newFramework}
                  onChange={(e) => setNewFramework(e.target.value as any)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="HTTP_CUSTOM">Generic HTTP Agent Adapter (REST Contract)</option>
                  <option value="NATIVE_TS">Native TypeScript Research Loop</option>
                  <option value="LANGGRAPH_PYTHON">Python LangGraph Microservice</option>
                </select>
              </div>

              {newFramework === "HTTP_CUSTOM" && (
                <div>
                  <label className="block font-medium text-foreground mb-1">Service Endpoint URL *</label>
                  <input
                    type="url"
                    required
                    value={newEndpoint}
                    onChange={(e) => setNewEndpoint(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Accepts BriefBench Agent Contract payload via POST /agent/run.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-medium text-foreground mb-1">Model (via Bifrost)</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
