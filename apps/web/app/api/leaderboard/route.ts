import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateRunMetrics } from "@/lib/benchmark/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
        runs: {
          include: { evaluation: true },
        },
      },
    });

    const entries = agents.map((agent) => {
      const metrics = calculateRunMetrics(agent.runs);
      const isDemo = agent.runs.some((r) => r.isDemo);
      const version = agent.versions[0]?.version || "1.0.0";
      const model = agent.versions[0]?.model || "gpt-4o";

      return {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        framework: agent.framework,
        version,
        model,
        sampleSize: metrics.repetitionCount,
        successRate: metrics.successRate,
        reliabilityScore: metrics.reliabilityScore,
        meanOverallScore: metrics.meanOverallScore,
        meanFactualAccuracy: metrics.meanFactualAccuracy,
        meanEvidenceSupport: metrics.meanEvidenceSupport,
        avgDurationMs: metrics.meanDurationMs,
        avgTokens: metrics.meanTokens,
        avgCostUsd: metrics.meanCostUsd,
        avgToolCalls: metrics.meanToolCalls,
        isDemo,
        evaluationConditions: "Identical Frozen SHA-256 Snapshot • 7-Dimension Rubric v1.0.0",
      };
    }).sort((a, b) => b.meanOverallScore - a.meanOverallScore);

    return NextResponse.json({
      success: true,
      leaderboard: entries,
      evaluationRubric: {
        name: "BriefBench Evidence-First Evaluation Protocol",
        version: "1.0.0",
        rubricWeights: {
          factualAccuracy: "25%",
          evidenceSupport: "20%",
          taskCompletion: "15%",
          researchCompleteness: "15%",
          actionability: "10%",
          instructionAdherence: "10%",
          outputConsistency: "5%",
        },
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
