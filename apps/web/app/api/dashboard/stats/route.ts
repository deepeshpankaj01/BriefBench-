import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateRunMetrics } from "@/lib/benchmark/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const experiments = await prisma.benchmarkExperiment.findMany({
      include: {
        task: true,
        runs: {
          include: {
            agent: true,
            evaluation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const allRuns = await prisma.agentRun.findMany({
      include: {
        agent: true,
        evaluation: true,
      },
    });

    const totalExperiments = await prisma.benchmarkExperiment.count();
    const totalRuns = allRuns.length;
    const successfulRuns = allRuns.filter((r) => r.status === "SUCCESS").length;
    const metrics = calculateRunMetrics(allRuns);

    // Agent specific aggregates
    const agentMap = new Map<string, typeof allRuns>();
    for (const r of allRuns) {
      const list = agentMap.get(r.agent.name) || [];
      list.push(r);
      agentMap.set(r.agent.name, list);
    }

    const agentSummaries = Array.from(agentMap.entries()).map(([agentName, runs]) => {
      const agentMetrics = calculateRunMetrics(runs);
      const framework = runs[0]?.agent?.framework || "UNKNOWN";
      return {
        agentName,
        framework,
        ...agentMetrics,
      };
    }).sort((a, b) => b.meanOverallScore - a.meanOverallScore);

    // Recent experiments list
    const recentExperiments = experiments.map((exp) => {
      const expMetrics = calculateRunMetrics(exp.runs);
      return {
        id: exp.id,
        name: exp.name,
        taskTitle: exp.task.title,
        status: exp.status,
        repetitions: exp.repetitions,
        totalRuns: exp.runs.length,
        successRate: expMetrics.successRate,
        meanOverallScore: expMetrics.meanOverallScore,
        meanDurationMs: expMetrics.meanDurationMs,
        createdAt: exp.createdAt,
        isDemo: exp.isDemo,
      };
    });

    // Latency & Token consumption chart data
    const chartData = experiments.slice(0, 6).reverse().map((exp, idx) => {
      const tsRuns = exp.runs.filter((r) => r.agent.framework === "NATIVE_TS");
      const pyRuns = exp.runs.filter((r) => r.agent.framework === "LANGGRAPH_PYTHON");
      const tsMetrics = calculateRunMetrics(tsRuns);
      const pyMetrics = calculateRunMetrics(pyRuns);

      return {
        label: `Exp ${idx + 1}`,
        name: exp.name,
        nativeDuration: tsMetrics.meanDurationMs,
        langgraphDuration: pyMetrics.meanDurationMs,
        nativeScore: tsMetrics.meanOverallScore,
        langgraphScore: pyMetrics.meanOverallScore,
        tokens: tsMetrics.meanTokens + pyMetrics.meanTokens,
      };
    });

    return NextResponse.json({
      success: true,
      overview: {
        totalExperiments,
        totalRuns,
        successfulRuns,
        reliability: metrics.reliabilityScore,
        successRate: metrics.successRate,
        avgDurationMs: metrics.meanDurationMs,
        avgToolCalls: metrics.meanToolCalls,
        avgRetries: metrics.meanRetries,
        avgTokens: metrics.meanTokens,
        avgCostUsd: metrics.meanCostUsd,
      },
      agentSummaries,
      recentExperiments,
      chartData,
    });
  } catch (err: unknown) {
    console.error("[API stats error]:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
