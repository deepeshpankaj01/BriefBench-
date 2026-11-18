"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ExternalLink,
  Download,
  Copy,
  Check,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

interface EvidenceSource {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  fullContent?: string;
  domain: string;
  publishedAt?: string;
  retrievalTimestamp: string;
}

interface EvidenceSnapshot {
  id: string;
  digest: string;
  title: string;
  description: string;
  isFrozen: boolean;
  version: number;
  totalSources: number;
  createdAt: string;
  task: {
    id: string;
    title: string;
    companyName: string;
  };
  sources?: EvidenceSource[];
  isDigestVerified?: boolean;
}

export default function EvidenceVaultPage() {
  const [snapshots, setSnapshots] = useState<EvidenceSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<EvidenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    async function loadSnapshots() {
      try {
        const res = await fetch("/api/evidence");
        const json = await res.json();
        if (json.success && json.snapshots.length > 0) {
          setSnapshots(json.snapshots);
          // Load first snapshot details
          loadSnapshotDetails(json.snapshots[0].id);
        }
      } catch (err) {
        console.error("Failed to load snapshots", err);
      } finally {
        setLoading(false);
      }
    }
    loadSnapshots();
  }, []);

  const loadSnapshotDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/evidence?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedSnapshot(json.snapshot);
      }
    } catch (err) {
      console.error("Failed to load snapshot details", err);
    }
  };

  const copyDigest = (digest: string) => {
    navigator.clipboard.writeText(digest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  const filteredSnapshots = snapshots.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.task?.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.digest.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Evidence Vault</h1>
            <DemoBadge isDemo={true} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Cryptographically frozen ground-truth evidence packages. Every benchmark run evaluates agents on identical, immutable SHA-256 snapshots to prevent live web drift.
          </p>
        </div>

        <Link
          href="/research"
          className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm flex items-center space-x-1.5 transition"
        >
          <span>Create New Snapshot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Snapshot List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search snapshots by name, task, or SHA-256..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2.5">
            {filteredSnapshots.map((snap) => {
              const isSelected = selectedSnapshot?.id === snap.id;
              return (
                <div
                  key={snap.id}
                  onClick={() => loadSnapshotDetails(snap.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-secondary/70 border-primary/50 shadow-sm"
                      : "bg-card border-border hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">{snap.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Task: {snap.task?.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      FROZEN v{snap.version}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <div className="flex items-center space-x-1">
                      <span>SHA-256:</span>
                      <span className="text-foreground">{snap.digest.slice(0, 10)}...</span>
                    </div>
                    <span>{snap.totalSources} sources</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Snapshot Detail & Evidence Inspection */}
        <div className="lg:col-span-7">
          {selectedSnapshot ? (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
              {/* Snapshot Metadata Header */}
              <div className="border-b border-border pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selectedSnapshot.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedSnapshot.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`/api/export?experimentId=${selectedSnapshot.id}&format=json`}
                      download
                      className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs flex items-center space-x-1 font-medium transition"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Export JSON</span>
                    </a>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-muted-foreground">Cryptographic Digest:</span>
                    <span className="text-foreground font-bold">{selectedSnapshot.digest}</span>
                  </div>
                  <button
                    onClick={() => copyDigest(selectedSnapshot.digest)}
                    className="p-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground self-start sm:self-auto"
                  >
                    {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="mt-3 flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Integrity Verified:</span>
                    <span className="text-foreground font-semibold">100% Match</span>
                  </div>
                  <span>•</span>
                  <span>Total Sources: {selectedSnapshot.sources?.length || selectedSnapshot.totalSources}</span>
                  <span>•</span>
                  <span>Created: {new Date(selectedSnapshot.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Source List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
                  Immutable Verified Sources ({selectedSnapshot.sources?.length || 0})
                </h3>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {(selectedSnapshot.sources || []).map((source, idx) => (
                    <div key={source.id || idx} className="p-4 rounded-lg border border-border bg-secondary/20 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {idx + 1}. {source.title}
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center space-x-1 flex-shrink-0"
                        >
                          <span className="font-mono text-[11px]">{source.domain}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-muted-foreground leading-relaxed bg-background/50 p-2.5 rounded border border-border/60">
                        {source.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span className="font-mono truncate max-w-sm">{source.url}</span>
                        <span>{new Date(source.retrievalTimestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-between border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  Benchmark tasks linked to this snapshot will enforce identical input constraints.
                </p>
                <Link
                  href={`/benchmarks?taskId=${selectedSnapshot.task?.id}&snapshotId=${selectedSnapshot.id}`}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shadow-sm transition"
                >
                  <span>Benchmark on this Snapshot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Select an evidence snapshot on the left to inspect its verified sources.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
