import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.agentRun.findUnique({
      where: { id: params.id },
      include: {
        agent: true,
        agentVersion: true,
        experiment: {
          include: {
            task: true,
            snapshot: true,
          },
        },
        evaluation: true,
        traceEvents: {
          orderBy: { stepNumber: "asc" },
        },
        toolCalls: true,
      },
    });

    if (!run) {
      return NextResponse.json({ success: false, error: "Agent run not found." }, { status: 404 });
    }

    // Parse JSON fields safely
    let parsedReport = null;
    if (run.outputReport) {
      try {
        parsedReport = JSON.parse(run.outputReport);
      } catch {
        parsedReport = { raw: run.outputReport };
      }
    }

    const traces = run.traceEvents.map((t) => {
      let input = null;
      let output = null;
      try {
        if (t.inputPayload) input = JSON.parse(t.inputPayload);
      } catch {
        input = t.inputPayload;
      }
      try {
        if (t.outputPayload) output = JSON.parse(t.outputPayload);
      } catch {
        output = t.outputPayload;
      }

      return {
        id: t.id,
        stepNumber: t.stepNumber,
        eventType: t.eventType,
        name: t.name,
        status: t.status,
        durationMs: t.durationMs,
        tokenUsage: t.tokenUsage,
        errorDetails: t.errorDetails,
        timestamp: t.timestamp,
        input,
        output,
      };
    });

    return NextResponse.json({
      success: true,
      run: {
        id: run.id,
        status: run.status,
        durationMs: run.durationMs,
        totalTokens: run.totalTokens,
        promptTokens: run.promptTokens,
        completionTokens: run.completionTokens,
        estimatedCostUsd: run.estimatedCostUsd,
        toolCallCount: run.toolCallCount,
        retryCount: run.retryCount,
        isDemo: run.isDemo,
        createdAt: run.createdAt,
        agent: {
          id: run.agent.id,
          name: run.agent.name,
          framework: run.agent.framework,
          version: run.agentVersion.version,
          model: run.agentVersion.model,
          configHash: run.agentVersion.configHash,
        },
        experiment: {
          id: run.experiment.id,
          name: run.experiment.name,
          taskTitle: run.experiment.task.title,
          snapshotDigest: run.experiment.snapshot.digest,
        },
        evaluation: run.evaluation
          ? {
              ...run.evaluation,
              unsupportedClaims: JSON.parse(run.evaluation.unsupportedClaims || "[]"),
              verifiedCitations: JSON.parse(run.evaluation.verifiedCitations || "[]"),
            }
          : null,
        report: parsedReport,
        traces,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
