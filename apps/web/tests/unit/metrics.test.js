import { test } from "node:test";
import assert from "node:assert/strict";

function calculateMetrics(runs) {
  const n = runs.length;
  const successRuns = runs.filter((r) => r.status === "SUCCESS");
  const successRate = successRuns.length / n;
  const durations = runs.map((r) => r.durationMs);
  const meanDuration = durations.reduce((a, b) => a + b, 0) / n;
  const scores = runs.map((r) => r.score);
  const meanScore = scores.reduce((a, b) => a + b, 0) / n;

  return {
    count: n,
    successRate,
    meanDuration,
    meanScore,
    reliability: Math.round(successRate * 70 + (meanScore / 100) * 30),
  };
}

test("Metrics calculator accurately computes means, success rates, and reliability", () => {
  const runs = [
    { status: "SUCCESS", durationMs: 1200, score: 95 },
    { status: "SUCCESS", durationMs: 1400, score: 91 },
    { status: "SUCCESS", durationMs: 1300, score: 96 },
  ];

  const m = calculateMetrics(runs);
  assert.equal(m.count, 3);
  assert.equal(m.successRate, 1.0);
  assert.equal(m.meanDuration, 1300);
  assert.equal(m.meanScore, 94);
  assert.ok(m.reliability >= 95);
});
