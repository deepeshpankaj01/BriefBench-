"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Bot,
  PlaySquare,
  Network,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  Sparkles,
  GitCompare,
  Terminal,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal-950 text-foreground selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-border/60 bg-charcoal-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-glow">
              <span className="font-bold text-white text-base">B</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">BriefBench</span>
              <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.2 rounded font-mono">v1.2</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-white transition">The Problem</a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
            <a href="#integrations" className="hover:text-white transition">Bifrost & Tavily</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-glow transition flex items-center space-x-1.5"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-charcoal-950 to-charcoal-950 -z-10" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Bifrost Problem Statement 02 & Tavily Secondary Track</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Benchmark the Agent. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Trust the Brief.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            Conventional benchmarks evaluate raw foundation models in isolation. BriefBench evaluates the{" "}
            <span className="text-white font-medium">complete agent</span>: tools, retrieval strategy, planning loops,
            grounding citations, and failure recovery—tested against immutable SHA-256 evidence snapshots.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center space-x-2 transition"
            >
              <span>Explore Demo Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/research"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-sm flex items-center justify-center space-x-2 transition"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Test Tavily Meeting Research</span>
            </Link>
          </div>

          {/* Quick Stats Pill */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Frozen Evidence Snapshots</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bifrost LLM Gateway Telemetry</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Native TS vs Python LangGraph</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>10 Controlled Fault Tests</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Central Problem Section */}
      <section id="problem" className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-primary">The Core Problem</h2>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              Identical Models Produce Vastly Different Agents
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Two agents powered by the same LLM (e.g. GPT-4o or Claude 3.5 Sonnet) can deliver opposite results in production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Unbenchmarked Black-Box Agents</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Evaluated against live web pages that drift, change, or 404 between runs.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Citations hallucinated without deterministic URL verification against sources.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Silent retry loops and unmetered tokens inflate enterprise bills.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Catastrophic crashes when upstream tool endpoints return 429 or 503.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-brand-500/30 bg-gradient-to-br from-brand-950/20 to-transparent space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">The BriefBench Standard</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Frozen SHA-256 evidence snapshots ensure 100% reproducible benchmark tasks.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Deterministic citation mapping flags unverified or fabricated claims.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Bifrost gateway telemetry records exact latency, input/output tokens, and cost.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Controlled Failure Lab tests resilience across 10 realistic fault scenarios.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture Section */}
      <section id="architecture" className="py-20 border-b border-border/40 bg-charcoal-900/40">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400">System Architecture</h2>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              End-to-End Grounded Verification Pipeline
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Engineered with genuine framework independence and observable execution stages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 w-fit">
                <Globe className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-white text-sm">1. Harvest & Extract</h5>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tavily Core SDK gathers deep semantic research, extracts page text, and collects metadata.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 w-fit">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-white text-sm">2. Freeze & Digest</h5>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Computes immutable SHA-256 digest over sources to guarantee identical input grounding.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-primary w-fit">
                <Bot className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-white text-sm">3. Agent Execution</h5>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Multi-agent competition (Native TS, Python LangGraph, HTTP) routed via Bifrost Gateway.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border space-y-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                <Trophy className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-white text-sm">4. 7-Dimension Rubric</h5>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Evaluates factual accuracy, citation integrity, adherence, actionability, and latency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bifrost & Tavily Integration Highlight */}
      <section id="integrations" className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-primary">Core Integrations</h2>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              Built on Maxim AI Bifrost & Tavily
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              These are verified technical foundations, not marketing badges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Network className="w-5 h-5 text-primary" />
                  <h4 className="text-base font-bold text-white">Bifrost LLM Gateway (Maxim AI)</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Primary Challenge
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                BriefBench routes model requests across all agent implementations through Bifrost. Provides OpenAI-compatible endpoint abstraction, centralized retry management, token telemetry, and upstream latency auditing.
              </p>
              <div className="pt-2 flex items-center space-x-2 text-xs font-mono text-primary">
                <Link href="/settings/bifrost" className="hover:underline flex items-center space-x-1">
                  <span>Inspect Gateway Telemetry</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-base font-bold text-white">Tavily Research & Extract (@tavily/core)</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Secondary Track
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Integrates the official Tavily SDK to perform semantic research on target enterprises, extract full web content, preserve source provenance, and generate structured meeting briefings with verified citations.
              </p>
              <div className="pt-2 flex items-center space-x-2 text-xs font-mono text-cyan-400">
                <Link href="/settings/tavily" className="hover:underline flex items-center space-x-1">
                  <span>View Tavily SDK Status</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-primary">Frequently Asked Questions</h2>
            <h3 className="text-2xl font-bold text-white">Understanding BriefBench</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <h4 className="font-bold text-white text-sm">Why benchmark agents instead of just foundation models?</h4>
              <p className="text-muted-foreground leading-relaxed">
                Models don't run in production alone—agents do. Two agents with the identical model can experience completely different hallucination rates, retry failures, and token costs based on their prompt structure, tool execution order, and validation loops.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <h4 className="font-bold text-white text-sm">What is the Evidence Vault and why SHA-256 digests?</h4>
              <p className="text-muted-foreground leading-relaxed">
                Live web scraping is non-deterministic; pages update, news articles change, and paywalls appear. BriefBench freezes the retrieved evidence into an immutable packet with an SHA-256 digest so all competing agents receive the exact same grounding data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <h4 className="font-bold text-white text-sm">Can I test external agents created in CrewAI or AutoGen?</h4>
              <p className="text-muted-foreground leading-relaxed">
                Yes. BriefBench features a standardized Generic HTTP Agent Adapter adhering to a versioned JSON contract, allowing any external microservice to participate in benchmarks without modifying platform code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Ready to Verify Your AI Agents?
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Experience the complete platform in the pre-seeded demo workspace with zero credentials required.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-glow inline-flex items-center space-x-2 transition"
            >
              <span>Launch BriefBench Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 text-xs text-muted-foreground text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 BriefBench Platform. Built for the Global AI Hackathon.</p>
          <div className="flex items-center space-x-4">
            <span className="font-mono">Maxim AI Bifrost PS02</span>
            <span>•</span>
            <span className="font-mono">Tavily Core Research</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
