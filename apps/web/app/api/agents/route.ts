import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateRunMetrics } from "@/lib/benchmark/metrics";
import { createHash } from "crypto";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        versions: { orderBy: { createdAt: "desc" } },
        runs: {
          include: { evaluation: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const agentProfiles = agents.map((agent) => {
      const metrics = calculateRunMetrics(agent.runs);
      const latestVersion = agent.versions[0];
      return {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        framework: agent.framework,
        description: agent.description,
        endpointUrl: agent.endpointUrl,
        isEnabled: agent.isEnabled,
        latestVersion: latestVersion ? latestVersion.version : "1.0.0",
        configHash: latestVersion ? latestVersion.configHash : "N/A",
        model: latestVersion ? latestVersion.model : "gpt-4o",
        systemPrompt: latestVersion ? latestVersion.systemPrompt : "",
        totalRuns: agent.runs.length,
        metrics,
      };
    });

    return NextResponse.json({ success: true, agents: agentProfiles });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, framework, description, endpointUrl, model, systemPrompt } = body;

    if (!name || !framework) {
      return NextResponse.json({ success: false, error: "Name and framework are required." }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({ where: { slug: "demo-workspace" } });
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const configHash = createHash("sha256")
      .update(`${framework}|${model || "gpt-4o"}|${systemPrompt || ""}`)
      .digest("hex");

    const agent = await prisma.agent.create({
      data: {
        workspaceId: workspace.id,
        name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        framework,
        description,
        endpointUrl: endpointUrl || null,
        isEnabled: true,
        versions: {
          create: {
            version: "1.0.0",
            configHash,
            model: model || "gpt-4o",
            systemPrompt: systemPrompt || "You are an autonomous research agent.",
            toolDefinitions: JSON.stringify([{ name: "search_evidence", description: "Search frozen evidence" }]),
            parameters: JSON.stringify({ temperature: 0.1, max_steps: 6 }),
          },
        },
      },
      include: { versions: true },
    });

    return NextResponse.json({ success: true, agent });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isEnabled } = body;

    if (!id || typeof isEnabled !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid agent update payload" }, { status: 400 });
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: { isEnabled },
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
