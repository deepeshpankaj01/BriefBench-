import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { FAULT_SCENARIOS, FaultCode } from "@/lib/failure/fault-injector";
import { benchmarkEngine } from "@/lib/benchmark/engine";

export async function GET() {
  try {
    const profiles = await prisma.faultProfile.findMany({
      orderBy: { createdAt: "asc" },
    });

    const scenarioList = Object.values(FAULT_SCENARIOS).map((scenario) => {
      const dbProfile = profiles.find((p) => p.code === scenario.code);
      return {
        ...scenario,
        id: dbProfile?.id || scenario.code,
        isSimulated: true,
      };
    });

    return NextResponse.json({ success: true, scenarios: scenarioList });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { faultCode, agentIds, repetitions = 1 } = body;

    if (!faultCode || !agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Missing faultCode or agentIds.",
      }, { status: 400 });
    }

    const scenario = FAULT_SCENARIOS[faultCode as FaultCode];
    if (!scenario) {
      return NextResponse.json({ success: false, error: `Invalid fault code: ${faultCode}` }, { status: 400 });
    }

    // Find first available task & snapshot
    const task = await prisma.benchmarkTask.findFirst({
      include: { snapshots: true },
    });

    if (!task || task.snapshots.length === 0) {
      return NextResponse.json({ success: false, error: "No benchmark tasks found to run fault injection on." }, { status: 404 });
    }

    const snapshot = task.snapshots[0];
    const workspace = await prisma.workspace.findFirst({ where: { slug: "demo-workspace" } });

    // Create Fault Experiment
    const experiment = await prisma.benchmarkExperiment.create({
      data: {
        workspaceId: workspace!.id,
        taskId: task.id,
        snapshotId: snapshot.id,
        name: `Controlled Fault Lab: ${scenario.name}`,
        repetitions: Math.max(1, Math.min(3, Number(repetitions))),
        status: "RUNNING",
        isDemo: true,
      },
    });

    // Run Experiment with Fault Injection
    await benchmarkEngine.runExperiment({
      experimentId: experiment.id,
      agentIds,
      repetitions: Math.max(1, Math.min(3, Number(repetitions))),
      faultCode,
    });

    const completed = await prisma.benchmarkExperiment.findUnique({
      where: { id: experiment.id },
      include: {
        runs: {
          include: { agent: true, evaluation: true, traceEvents: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      experiment: completed,
      scenario,
    });
  } catch (err: unknown) {
    console.error("[API Failure Lab Error]:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
