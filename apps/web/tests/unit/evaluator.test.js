import { test } from "node:test";
import assert from "node:assert/strict";

function evaluateDeterministic(report, snapshotSources) {
  const validUrlMap = new Map(snapshotSources.map((s) => [s.url, s]));
  const verifiedCitations = [];
  const unsupportedClaims = [];

  for (const c of report.citations || []) {
    if (validUrlMap.has(c.url)) {
      verifiedCitations.push(c.url);
    } else {
      unsupportedClaims.push(`Hallucinated URL: ${c.url}`);
    }
  }

  const factualAccuracy = unsupportedClaims.length === 0 ? 95 : 40;
  const citationIntegrityRatio = (report.citations?.length || 0) > 0
    ? verifiedCitations.length / report.citations.length
    : 0;
  const evidenceSupport = Math.round(citationIntegrityRatio * 95);

  const overallScore = Number((
    (factualAccuracy * 0.25) +
    (evidenceSupport * 0.20) +
    (90 * 0.15) + // completion
    (90 * 0.15) + // research
    (90 * 0.10) + // actionability
    (90 * 0.10) + // adherence
    (90 * 0.05)   // consistency
  ).toFixed(1));

  return { overallScore, factualAccuracy, evidenceSupport, unsupportedClaims, verifiedCitations };
}

test("Evaluator verifies ground-truth citations against frozen snapshot", () => {
  const snapshotSources = [
    { url: "https://verified.org/source-1", title: "Source 1" },
    { url: "https://verified.org/source-2", title: "Source 2" },
  ];

  const validReport = {
    citations: [
      { url: "https://verified.org/source-1", claim: "Valid fact" },
    ],
  };

  const evalResult = evaluateDeterministic(validReport, snapshotSources);
  assert.equal(evalResult.unsupportedClaims.length, 0);
  assert.equal(evalResult.verifiedCitations.length, 1);
  assert.ok(evalResult.overallScore > 90);
});

test("Evaluator penalizes hallucinated citation URLs not in snapshot", () => {
  const snapshotSources = [
    { url: "https://verified.org/source-1", title: "Source 1" },
  ];

  const hallucinatedReport = {
    citations: [
      { url: "https://fake-hallucination.com/source-x", claim: "Fabricated fact" },
    ],
  };

  const evalResult = evaluateDeterministic(hallucinatedReport, snapshotSources);
  assert.equal(evalResult.unsupportedClaims.length, 1);
  assert.equal(evalResult.factualAccuracy, 40);
  assert.ok(evalResult.overallScore < 80);
});
