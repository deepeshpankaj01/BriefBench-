"use client";

import React, { useEffect, useState } from "react";
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

export default function TavilySettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfo();
  }, []);

  async function loadInfo() {
    try {
      const res = await fetch("/api/integrations/tavily");
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tavily Research Integration</h1>
          <DemoBadge isDemo={!data?.isConfigured} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Tavily powers the automated research and evidence extraction pipeline. Using the official <code className="font-mono text-cyan-400">@tavily/core</code> SDK, it retrieves clean web content and formats source citations for evidence freezing.
        </p>
      </div>

      {/* Tavily Status Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-foreground">Tavily Core Client Status</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${data?.isConfigured ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                  {data?.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Official SDK: <span className="text-foreground">{data?.sdk}</span>
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

        {/* Quota & Plan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-center">
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Active Plan</span>
            <span className="text-xs font-bold text-foreground">{data?.quota?.plan}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Monthly Limit</span>
            <span className="text-xs font-bold text-foreground">{data?.quota?.monthlyCredits}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Credits Consumed</span>
            <span className="text-xs font-bold text-cyan-400">{data?.quota?.creditsUsed}</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/20">
            <span className="text-[10px] text-muted-foreground block">Quota Reset</span>
            <span className="text-xs text-muted-foreground">{data?.quota?.resetDate}</span>
          </div>
        </div>

        {/* Capabilities List */}
        <div className="pt-2 space-y-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
            Active SDK Capabilities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(data?.capabilities || []).map((cap: string, idx: number) => (
              <div key={idx} className="p-2.5 rounded bg-secondary/30 border border-border flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="text-foreground">{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Notice */}
        <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground block mb-1">To connect live Tavily credentials:</span>
          Add your <code className="text-cyan-400 font-mono bg-charcoal-950 px-1 py-0.5 rounded">TAVILY_API_KEY</code> to the <code className="font-mono">.env</code> file. When absent, the system uses high-quality deterministic meeting research extracts to ensure full hackathon evaluation functionality.
        </div>
      </div>
    </div>
  );
}
