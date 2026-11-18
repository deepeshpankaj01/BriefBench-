import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateRunMetrics } from "@/lib/benchmark/metrics";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experiment = await prisma.benchmarkExperiment.findUnique({
      where: { id: params.id },
      include: {
        task: true,
        snapshot: {
          include: { sources: true },
        },
        runs: {
          include: {
            agent: true,
            agentVersion: true,
            evaluation: true,
            traceEvents: { orderBy: { stepNumber: "asc" } },
            toolCalls: true,
          },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json({ success: false, error: "Experiment not found." }, { status: 404 });
    }

    const overallMetrics = calculateRunMetrics(experiment.runs);

    // Group runs by agent
    const agentGroups = new Map<string, typeof experiment.runs>();
    for (const run of experiment.runs) {
      const list = agentGroups.get(run.agent.name) || [];
      list.push(run);
      agentGroups.set(run.agent.name, list);
    }

    const agentComparisons = Array.from(agentGroups.entries()).map(([agentName, runs]) => {
      const metrics = calculateRunMetrics(runs);
      const agent = runs[0].agent;
      return {
        agentId: agent.id,
        agentName,
        framework: agent.framework,
        metrics,
        runs: runs.map((r) => ({
          id: r.id,
          repetitionIndex: r.repetitionIndex,
          status: r.status,
          durationMs: r.durationMs,
          totalTokens: r.totalTokens,
          estimatedCostUsd: r.estimatedCostUsd,
          toolCallCount: r.toolCallCount,
          retryCount: r.retryCount,
          evaluation: r.evaluation,
          report: r.outputReport ? JSON.parse(r.outputReport) : null,
          traceCount: r.traceEvents.length,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        repetitions: experiment.repetitions,
        isDemo: experiment.isDemo,
        createdAt: experiment.createdAt,
        task: experiment.task,
        snapshot: experiment.snapshot,
        overallMetrics,
        agentComparisons,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
