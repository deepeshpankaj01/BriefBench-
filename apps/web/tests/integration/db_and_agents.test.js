import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("Database contains seeded demo workspace, agents, snapshots, and experiments", async () => {
  const workspace = await prisma.workspace.findFirst({ where: { slug: "demo-workspace" } });
  assert.ok(workspace, "Demo workspace must exist in DB");

  const agents = await prisma.agent.findMany();
  assert.ok(agents.length >= 2, "At least 2 distinct agents must be registered");

  const frameworks = agents.map((a) => a.framework);
  assert.ok(frameworks.includes("NATIVE_TS"), "Native TS Agent must be registered");
  assert.ok(frameworks.includes("LANGGRAPH_PYTHON"), "LangGraph Python Agent must be registered");

  const snapshots = await prisma.evidenceSnapshot.findMany({ include: { sources: true } });
  assert.ok(snapshots.length >= 1, "At least 1 frozen evidence snapshot must exist");
  assert.ok(snapshots[0].digest.length === 64, "Snapshot digest must be a valid 64-char hex SHA-256 string");
  assert.ok(snapshots[0].sources.length > 0, "Snapshot must contain verified sources");

  const experiments = await prisma.benchmarkExperiment.findMany({ include: { runs: true } });
  assert.ok(experiments.length >= 1, "At least 1 completed benchmark experiment must exist");
  assert.ok(experiments[0].runs.length >= 6, "Experiment must have recorded runs");

  await prisma.$disconnect();
});
