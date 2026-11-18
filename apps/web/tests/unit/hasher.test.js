import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function calculateEvidenceDigest(sources) {
  const sorted = [...sources].sort((a, b) => a.url.localeCompare(b.url));
  const canonicalString = sorted
    .map((s) => `${s.url}|${s.title.trim()}|${(s.excerpt || "").trim()}|${(s.fullContent || "").trim()}`)
    .join("::");
  return createHash("sha256").update(canonicalString, "utf8").digest("hex");
}

function verifyEvidenceDigest(sources, expectedDigest) {
  return calculateEvidenceDigest(sources).toLowerCase() === expectedDigest.toLowerCase();
}

test("Evidence Snapshot SHA-256 Digest is deterministic and order-invariant", () => {
  const sourcesA = [
    { url: "https://sec.gov/filing-1", title: "SEC Q3 Filing", excerpt: "Growth 28%" },
    { url: "https://techcrunch.com/article-2", title: "TechCrunch Article", excerpt: "New Agents" },
  ];

  const sourcesB = [
    { url: "https://techcrunch.com/article-2", title: "TechCrunch Article", excerpt: "New Agents" },
    { url: "https://sec.gov/filing-1", title: "SEC Q3 Filing", excerpt: "Growth 28%" },
  ];

  const digestA = calculateEvidenceDigest(sourcesA);
  const digestB = calculateEvidenceDigest(sourcesB);

  assert.equal(digestA, digestB, "Digests must match regardless of source ordering");
  assert.equal(digestA.length, 64, "SHA-256 hex digest must be 64 characters");
  assert.ok(verifyEvidenceDigest(sourcesA, digestA), "Verification should pass for untouched evidence");
});

test("Evidence Snapshot Digest detects tampering or text modification", () => {
  const original = [
    { url: "https://sec.gov/filing-1", title: "SEC Q3 Filing", excerpt: "Growth 28%" },
  ];
  const tampered = [
    { url: "https://sec.gov/filing-1", title: "SEC Q3 Filing", excerpt: "Growth 50%" },
  ];

  const originalDigest = calculateEvidenceDigest(original);
  assert.equal(verifyEvidenceDigest(tampered, originalDigest), false, "Tampered evidence must fail digest check");
});
