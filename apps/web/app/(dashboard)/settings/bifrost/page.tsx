"use client";

import React, { useEffect, useState } from "react";
import {
  Network,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

export default function BifrostSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  async function loadInfo() {
    try {
      const res = await fetch("/api/integrations/bifrost");
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

  const copyEndpoint = () => {
    if (data?.endpoint) {
      navigator.clipboard.writeText(data.endpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-48"></div>
        <div className="h-48 bg-card border border-border rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bifrost LLM Gateway Integration</h1>
          <DemoBadge isDemo={!data?.isConfigured} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Bifrost by Maxim AI serves as the core LLM gateway for BriefBench. It routes OpenAI-compatible requests, manages provider fallbacks, tracks token accounting, and provides deep inference telemetry.
        </p>
      </div>

      {/* Gateway Status Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-primary">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-foreground">Bifrost Gateway Status</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${data?.isConfigured ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                  {data?.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Active Model: <span className="text-foreground font-bold">{data?.selectedModel}</span>
              </p>
            </div>
          </div>

          <button
            onClick={loadInfo}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-medium flex items-center space-x-1.5 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Health Check Ping</span>
          </button>
        </div>

        {/* Gateway Endpoint Configuration */}
        <div className="p-3.5 rounded-lg bg-secondary/40 border border-border flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Gateway Base URL:</span>
            <span className="text-foreground font-semibold">{data?.endpoint}</span>
          </div>
          <button onClick={copyEndpoint} className="p-1 hover:text-foreground text-muted-foreground">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-center">
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Gateway Uptime</span>
            <span className="text-sm font-bold text-emerald-400">{data?.telemetry?.gatewayUptime}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Avg Latency</span>
            <span className="text-sm font-bold text-foreground">{data?.telemetry?.avgGatewayLatencyMs}ms</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Rate Limit Tier</span>
            <span className="text-xs font-semibold text-foreground">{data?.telemetry?.activeRateLimitTier}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Last Health Ping</span>
            <span className="text-xs text-foreground">Just now</span>
          </div>
        </div>

        {/* Supported Gateway Models */}
        <div className="pt-2 space-y-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
            Supported Upstream Models via Bifrost
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            {(data?.supportedModels || []).map((m: any) => (
              <div key={m.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                <span className="font-bold text-foreground block">{m.name}</span>
                <span className="text-[10px] text-muted-foreground">Provider: {m.provider} • Context: {m.contextWindow}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Notice */}
        <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground block mb-1">To connect live Maxim AI Bifrost credentials:</span>
          Set <code className="text-primary font-mono bg-charcoal-950 px-1 py-0.5 rounded">BIFROST_API_KEY</code> and <code className="text-primary font-mono bg-charcoal-950 px-1 py-0.5 rounded">BIFROST_BASE_URL</code> in your environment or <code className="font-mono">.env</code> file. When unconfigured, BriefBench automatically provides high-fidelity deterministic responses to allow offline hackathon evaluation.
        </div>
      </div>
    </div>
  );
}
