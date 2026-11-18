import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateRunMetrics } from "@/lib/benchmark/metrics";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experimentId = searchParams.get("experimentId");

    const whereClause: { experimentId?: string } = {};
    if (experimentId) {
      whereClause.experimentId = experimentId;
    }

    const runs = await prisma.agentRun.findMany({
      where: whereClause,
      include: {
        agent: true,
        evaluation: true,
        experiment: { include: { task: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group runs by agent
    const agentMap = new Map<string, typeof runs>();
    for (const r of runs) {
      const list = agentMap.get(r.agent.name) || [];
      list.push(r);
      agentMap.set(r.agent.name, list);
    }

    const agents = Array.from(agentMap.entries()).map(([name, agentRuns]) => {
      const metrics = calculateRunMetrics(agentRuns);
      const evals = agentRuns.map((r) => r.evaluation).filter(Boolean);

      const avgDimension = (key: keyof NonNullable<(typeof evals)[0]>) => {
        const vals = evals.map((e) => Number(e![key]) || 0).filter((v) => v > 0);
        return vals.length > 0 ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0;
      };

      return {
        name,
        framework: agentRuns[0]?.agent.framework || "NATIVE_TS",
        runCount: agentRuns.length,
        metrics,
        radarDimensions: {
          factualAccuracy: avgDimension("factualAccuracy"),
          evidenceSupport: avgDimension("evidenceSupport"),
          taskCompletion: avgDimension("taskCompletion"),
          researchCompleteness: avgDimension("researchCompleteness"),
          actionability: avgDimension("actionability"),
          instructionAdherence: avgDimension("instructionAdherence"),
          outputConsistency: avgDimension("outputConsistency"),
        },
      };
    });

    // Format Radar Data suitable for Recharts RadarChart
    // Keys: dimension, Agent1, Agent2, etc.
    const dimensions = [
      { key: "factualAccuracy", label: "Factual Accuracy" },
      { key: "evidenceSupport", label: "Evidence & Citations" },
      { key: "taskCompletion", label: "Task Completion" },
      { key: "researchCompleteness", label: "Research Depth" },
      { key: "actionability", label: "Actionability" },
      { key: "instructionAdherence", label: "Instruction Adherence" },
      { key: "outputConsistency", label: "Consistency" },
    ];

    const radarChartData = dimensions.map((dim) => {
      const row: Record<string, string | number> = { dimension: dim.label };
      for (const ag of agents) {
        row[ag.name] = ag.radarDimensions[dim.key as keyof typeof ag.radarDimensions] || 0;
      }
      return row;
    });

    return NextResponse.json({
      success: true,
      agents,
      radarChartData,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
