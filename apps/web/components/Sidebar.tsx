"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ShieldCheck,
  Bot,
  PlaySquare,
  AlertTriangle,
  GitCompare,
  Trophy,
  Network,
  Globe,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";

const navItems = [
  { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Research Studio", href: "/research", icon: Search },
  { name: "Evidence Vault", href: "/evidence", icon: ShieldCheck },
  { name: "Agent Registry", href: "/agents", icon: Bot },
  { name: "Benchmark Engine", href: "/benchmarks", icon: PlaySquare },
  { name: "Controlled Failure Lab", href: "/failure-lab", icon: AlertTriangle },
  { name: "Comparison Studio", href: "/comparison", icon: GitCompare },
  { name: "Verified Leaderboard", href: "/leaderboard", icon: Trophy },
];

const integrationItems = [
  { name: "Bifrost Gateway", href: "/settings/bifrost", icon: Network, badge: "LLM Routing" },
  { name: "Tavily Integration", href: "/settings/tavily", icon: Globe, badge: "Research" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5">
        {/* Logo and Tagline */}
        <div className="px-2 mb-6">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-glow">
              <span className="font-bold text-white text-base">B</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight text-foreground">BriefBench</span>
                <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.2 rounded font-mono">v1.2</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Benchmark the Agent. Trust the Brief.</p>
            </div>
          </Link>
        </div>

        {/* Demo Status Banner */}
        <div className="mx-2 mb-5 p-2.5 rounded-lg bg-secondary/50 border border-border/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-foreground">Global Engineering</span>
            <DemoBadge isDemo={true} />
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Zero-config simulation active. Live Bifrost & Tavily keys can be configured in settings.
          </p>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Evaluation Core
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-brand-500/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Gateways & Integrations */}
        <div className="mt-6 space-y-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Infrastructure
          </p>
          {integrationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.name}</span>
                </div>
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-border bg-card/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-medium text-brand-300">
              LE
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-foreground truncate">Lead Engineer</p>
              <p className="text-[10px] text-muted-foreground truncate">engineer@briefbench.ai</p>
            </div>
          </div>
          <Link
            href="/"
            title="Public Landing Page"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
