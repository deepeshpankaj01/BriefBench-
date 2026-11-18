"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

interface ResearchSource {
  url: string;
  title: string;
  excerpt: string;
  domain?: string;
  publishedAt?: string;
}

interface BriefingData {
  executiveSummary: string;
  companyOverview: string;
  recentDevelopments: string[];
  industryContext: string;
  competitorLandscape: Array<{ name: string; differentiation: string }>;
  businessOpportunities: string[];
  potentialRisks: string[];
  importantQuestionsToAsk: string[];
  citations: Array<{ url: string; claim: string; sourceTitle: string }>;
  verifiedFacts: string[];
  inferences: string[];
  unknowns: string[];
}

export default function ResearchStudioPage() {
  const [companyName, setCompanyName] = useState("Snowflake");
  const [meetingPurpose, setMeetingPurpose] = useState("Executive partnership review and multi-agent observability architecture");
  const [meetingDate, setMeetingDate] = useState("2026-11-28");
  const [participants, setParticipants] = useState("Sridhar Ramaswamy (CEO), VP of AI Products");
  const [industry, setIndustry] = useState("Data Cloud & Enterprise AI Platforms");
  const [competitors, setCompetitors] = useState("Databricks, Google BigQuery, AWS Redshift");
  const [researchObjectives, setResearchObjectives] = useState("Assess recent product announcements, enterprise growth velocity, and competitive differentiation in generative AI governance");
  const [importantQuestions, setImportantQuestions] = useState("How does Snowflake ensure deterministic reproduction of agent reasoning across model updates?");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    taskId: string;
    snapshotId: string;
    digest: string;
    totalSources: number;
    sources: ResearchSource[];
    briefing: BriefingData;
    isSimulated: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"briefing" | "evidence" | "citations" | "facts">("briefing");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/research/tavily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          meetingPurpose,
          meetingDate,
          meetingParticipants: participants.split(",").map((p) => p.trim()).filter(Boolean),
          industry,
          competitors: competitors.split(",").map((c) => c.trim()).filter(Boolean),
          researchObjectives: researchObjectives.split(",").map((o) => o.trim()).filter(Boolean),
          importantQuestions: importantQuestions.split(",").map((q) => q.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        alert(`Research failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Research failed to execute.");
    } finally {
      setLoading(false);
    }
  };

  const copyDigest = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meeting Research Studio</h1>
          <DemoBadge isDemo={true} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Powered by Tavily Search & Extract and Bifrost LLM Gateway. Gathers live web intelligence, extracts verified excerpts,
          generates an evidence-grounded briefing, and computes an immutable SHA-256 snapshot digest for agent benchmarking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Research Input Form */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center space-x-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Meeting Context & Directives</span>
            </h2>
            <p className="text-[11px] text-muted-foreground">Specify the target enterprise and evaluation constraints</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-foreground mb-1">Target Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Snowflake, Databricks, Stripe"
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">Meeting Date</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block font-medium text-foreground mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Meeting Purpose</label>
              <input
                type="text"
                value={meetingPurpose}
                onChange={(e) => setMeetingPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Participants</label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Comma separated names and titles"
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Competitors to Compare</label>
              <input
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g. Competitor A, Competitor B"
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Research Objectives</label>
              <textarea
                rows={2}
                value={researchObjectives}
                onChange={(e) => setResearchObjectives(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">Key Questions to Address</label>
              <textarea
                rows={2}
                value={importantQuestions}
                onChange={(e) => setImportantQuestions(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Harvesting Evidence via Tavily & Bifrost...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Conduct Meeting Research & Freeze Evidence</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[420px]">
              <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center text-primary mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Ready to Execute Research</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Enter target meeting details on the left. Tavily will extract verified sources and generate a cryptographically frozen evidence snapshot for downstream benchmarking.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[420px] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground">Executing Evidence Pipeline</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Searching Tavily Advanced Index...</p>
                <p>2. Extracting raw article content and timestamps...</p>
                <p>3. Computing SHA-256 cryptographic digest...</p>
                <p>4. Generating evidence-grounded briefing via Bifrost...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Snapshot Banner */}
              <div className="p-4 bg-secondary/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-foreground">Frozen Evidence Snapshot Created</span>
                    <DemoBadge isDemo={result.isSimulated} />
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1 font-mono text-[11px] text-muted-foreground">
                    <span>SHA-256:</span>
                    <span className="text-foreground">{result.digest.slice(0, 16)}...{result.digest.slice(-8)}</span>
                    <button onClick={copyDigest} className="p-0.5 hover:text-foreground">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/benchmarks?taskId=${result.taskId}&snapshotId=${result.snapshotId}`}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shadow-sm transition"
                  >
                    <span>Launch Benchmark</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-border px-4 bg-card text-xs">
                {[
                  { key: "briefing", label: "Executive Briefing" },
                  { key: "evidence", label: `Evidence Sources (${result.totalSources})` },
                  { key: "citations", label: `Citations (${result.briefing.citations?.length || 0})` },
                  { key: "facts", label: "Facts vs Inferences" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 px-3 font-medium border-b-2 transition ${
                      activeTab === tab.key
                        ? "border-primary text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-5 max-h-[600px] overflow-y-auto space-y-4 text-xs">
                {activeTab === "briefing" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">Executive Summary</h4>
                      <p className="text-muted-foreground leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/60">
                        {result.briefing.executiveSummary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">Company Overview</h4>
                      <p className="text-muted-foreground leading-relaxed">{result.briefing.companyOverview}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Recent Developments</h4>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {result.briefing.recentDevelopments?.map((dev, idx) => (
                          <li key={idx}>{dev}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Competitor Landscape</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {result.briefing.competitorLandscape?.map((comp, idx) => (
                          <div key={idx} className="p-2.5 rounded bg-secondary/40 border border-border">
                            <span className="font-semibold text-foreground block">{comp.name}</span>
                            <span className="text-muted-foreground text-[11px]">{comp.differentiation}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Critical Questions for Meeting</h4>
                      <ul className="list-decimal pl-5 space-y-1 text-muted-foreground">
                        {result.briefing.importantQuestionsToAsk?.map((q, idx) => (
                          <li key={idx} className="font-medium text-foreground">{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "evidence" && (
                  <div className="space-y-3">
                    {result.sources.map((s, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg border border-border bg-secondary/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{s.title}</span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center space-x-1"
                          >
                            <span className="font-mono text-[10px]">{s.domain}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">{s.excerpt}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{s.url}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "citations" && (
                  <div className="space-y-2.5">
                    {result.briefing.citations?.map((c, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/20">
                        <p className="font-medium text-foreground">"{c.claim}"</p>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{c.sourceTitle}</span>
                          <a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-[10px]">
                            {c.url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "facts" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <h5 className="font-semibold text-emerald-400 mb-2">Verified Facts</h5>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                        {result.briefing.verifiedFacts?.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                      <h5 className="font-semibold text-indigo-400 mb-2">Analytical Inferences</h5>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                        {result.briefing.inferences?.map((inf, i) => (
                          <li key={i}>{inf}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <h5 className="font-semibold text-amber-400 mb-2">Unknowns / Gaps</h5>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                        {result.briefing.unknowns?.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
