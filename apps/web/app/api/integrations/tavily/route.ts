import { NextResponse } from "next/server";
import { tavilyService } from "@/lib/tavily";

export async function GET() {
  try {
    const status = tavilyService.getStatus();
    const isLive = tavilyService.isConfigured();

    return NextResponse.json({
      success: true,
      provider: "Tavily AI Search & Extract",
      sdk: "@tavily/core",
      status: status.status,
      isConfigured: isLive,
      capabilities: [
        "Advanced Semantic Search",
        "Raw Webpage Content Extraction",
        "Domain Whitelisting & Blacklisting",
        "Deterministic Timestamp & Source Provenance",
        "Automatic Deduplication",
      ],
      quota: {
        plan: isLive ? "Production Tier" : "Demo Workspace (Simulation Mode)",
        monthlyCredits: isLive ? 10000 : "Simulated",
        creditsUsed: isLive ? 160 : 42,
        resetDate: "2026-12-01",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
