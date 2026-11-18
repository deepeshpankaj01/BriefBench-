import { createHash } from "crypto";

export interface EvidenceSourcePayload {
  url: string;
  title: string;
  excerpt: string;
  fullContent?: string;
  domain?: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Calculates a deterministic, cryptographic SHA-256 digest of an evidence snapshot.
 * Guarantees that every agent in a benchmark receives the identical immutable evidence set.
 */
export function calculateEvidenceDigest(sources: EvidenceSourcePayload[]): string {
  // Sort sources deterministically by URL to prevent order variance
  const sorted = [...sources].sort((a, b) => a.url.localeCompare(b.url));

  const canonicalString = sorted
    .map((s) => `${s.url}|${s.title.trim()}|${(s.excerpt || "").trim()}|${(s.fullContent || "").trim()}`)
    .join("::");

  return createHash("sha256").update(canonicalString, "utf8").digest("hex");
}

/**
 * Validates that an evidence snapshot has not suffered from data drift or tampering.
 */
export function verifyEvidenceDigest(sources: EvidenceSourcePayload[], expectedDigest: string): boolean {
  const actualDigest = calculateEvidenceDigest(sources);
  return actualDigest.toLowerCase() === expectedDigest.toLowerCase();
}
