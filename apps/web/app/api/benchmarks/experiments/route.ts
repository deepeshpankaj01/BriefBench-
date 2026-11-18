import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { benchmarkEngine } from "@/lib/benchmark/engine";
import { calculateRunMetrics } from "@/lib/benchmark/metrics";

export async function GET() {
  try {
    const experiments = await prisma.benchmarkExperiment.findMany({
      include: {
        task: true,
        snapshot: true,
        runs: {
          include: {
            agent: true,
            evaluation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = experiments.map((exp) => {
      const metrics = calculateRunMetrics(exp.runs);
      const participatingAgents = Array.from(new Set(exp.runs.map((r) => r.agent.name)));

      return {
        id: exp.id,
        name: exp.name,
        status: exp.status,
        taskId: exp.taskId,
        taskTitle: exp.task.title,
        companyName: exp.task.companyName,
        snapshotId: exp.snapshotId,
        snapshotDigest: exp.snapshot.digest,
        repetitions: exp.repetitions,
        totalRuns: exp.runs.length,
        participatingAgents,
        metrics,
        isDemo: exp.isDemo,
        startedAt: exp.startedAt,
        completedAt: exp.completedAt,
        createdAt: exp.createdAt,
      };
    });

    return NextResponse.json({ success: true, experiments: formatted });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, taskId, snapshotId, agentIds, repetitions = 3, faultCode } = body;

    if (!taskId || !snapshotId || !agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: taskId, snapshotId, and at least one agentId.",
      }, { status: 400 });
    }

    const task = await prisma.benchmarkTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({ where: { slug: "demo-workspace" } });
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found." }, { status: 404 });
    }

    // Create Experiment in DB
    const experiment = await prisma.benchmarkExperiment.create({
      data: {
        workspaceId: workspace.id,
        taskId,
        snapshotId,
        name: name || `${task.companyName || "Enterprise"} Benchmark Evaluation`,
        repetitions: Math.max(1, Math.min(5, Number(repetitions))),
        status: "PENDING",
        isDemo: false,
      },
    });

    // Execute the benchmark engine synchronously or asynchronously
    // We execute with await so the UI receives the completed run results!
    await benchmarkEngine.runExperiment({
      experimentId: experiment.id,
      agentIds,
      repetitions: Math.max(1, Math.min(5, Number(repetitions))),
      faultCode,
    });

    const completed = await prisma.benchmarkExperiment.findUnique({
      where: { id: experiment.id },
      include: {
        task: true,
        snapshot: true,
        runs: {
          include: { agent: true, evaluation: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      experiment: completed,
    });
  } catch (err: unknown) {
    console.error("[API Benchmark Experiment Error]:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
