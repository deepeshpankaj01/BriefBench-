import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experimentId = searchParams.get("experimentId");
    const format = searchParams.get("format") || "json"; // json or csv

    if (!experimentId) {
      return NextResponse.json({ success: false, error: "experimentId parameter is required." }, { status: 400 });
    }

    const experiment = await prisma.benchmarkExperiment.findUnique({
      where: { id: experimentId },
      include: {
        task: true,
        snapshot: { include: { sources: true } },
        runs: {
          include: {
            agent: true,
            agentVersion: true,
            evaluation: true,
            traceEvents: true,
          },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json({ success: false, error: "Experiment not found." }, { status: 404 });
    }

    if (format === "csv") {
      const headers = [
        "Run ID",
        "Agent Name",
        "Framework",
        "Version",
        "Repetition",
        "Status",
        "Overall Score",
        "Factual Accuracy",
        "Evidence Support",
        "Task Completion",
        "Duration (ms)",
        "Tokens",
        "Cost (USD)",
        "Tool Calls",
        "Retries",
        "Snapshot Digest",
      ];

      const rows = experiment.runs.map((r) => [
        r.id,
        `"${r.agent.name}"`,
        r.agent.framework,
        r.agentVersion.version,
        r.repetitionIndex,
        r.status,
        r.evaluation?.overallScore ?? "N/A",
        r.evaluation?.factualAccuracy ?? "N/A",
        r.evaluation?.evidenceSupport ?? "N/A",
        r.evaluation?.taskCompletion ?? "N/A",
        r.durationMs ?? "N/A",
        r.totalTokens ?? "N/A",
        r.estimatedCostUsd ?? "Not reported",
        r.toolCallCount,
        r.retryCount,
        `"${experiment.snapshot.digest}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="briefbench-experiment-${experimentId}.csv"`,
        },
      });
    }

    // JSON export
    return new NextResponse(JSON.stringify(experiment, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="briefbench-experiment-${experimentId}.json"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
