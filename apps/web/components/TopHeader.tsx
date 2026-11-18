"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Search, Sun, Moon, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { DemoBadge } from "./DemoBadge";

export function TopHeader() {
  const [bifrostStatus, setBifrostStatus] = useState<string>("Checking...");
  const [tavilyStatus, setTavilyStatus] = useState<string>("Checking...");
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Set dark class on document element
    document.documentElement.classList.add("dark");

    async function checkHealth() {
      try {
        const bifrostRes = await fetch("/api/integrations/bifrost");
        const bifrostData = await bifrostRes.json();
        setBifrostStatus(bifrostData.isConfigured ? "Live Gateway" : "Simulated");

        const tavilyRes = await fetch("/api/integrations/tavily");
        const tavilyData = await tavilyRes.json();
        setTavilyStatus(tavilyData.isConfigured ? "Live SDK" : "Simulated");
      } catch {
        setBifrostStatus("Offline");
        setTavilyStatus("Offline");
      }
    }
    checkHealth();
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Active Workspace & Gateway Telemetry */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-foreground tracking-tight">Global AI Workspace</span>
          <DemoBadge isDemo={true} />
        </div>

        <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-border text-[11px] text-muted-foreground">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Bifrost:</span>
            <span className="text-foreground font-medium font-mono">{bifrostStatus}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Tavily:</span>
            <span className="text-foreground font-medium font-mono">{tavilyStatus}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Launch & Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        <Link
          href="/research"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>Research Studio</span>
        </Link>

        <Link
          href="/benchmarks"
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>New Benchmark</span>
        </Link>
      </div>
    </header>
  );
}
