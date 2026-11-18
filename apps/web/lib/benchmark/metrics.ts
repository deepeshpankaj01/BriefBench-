export interface RunMetricSummary {
  repetitionCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  meanDurationMs: number;
  stdDevDurationMs: number;
  meanTokens: number;
  meanCostUsd: number | null;
  meanToolCalls: number;
  meanRetries: number;
  meanOverallScore: number;
  meanFactualAccuracy: number;
  meanEvidenceSupport: number;
  reliabilityScore: number; // 0-100 composite index
}

export function calculateRunMetrics(runs: Array<{
  status: string;
  durationMs?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  toolCallCount?: number | null;
  retryCount?: number | null;
  evaluation?: {
    overallScore?: number | null;
    factualAccuracy?: number | null;
    evidenceSupport?: number | null;
  } | null;
}>): RunMetricSummary {
  const n = runs.length;
  if (n === 0) {
    return {
      repetitionCount: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      meanDurationMs: 0,
      stdDevDurationMs: 0,
      meanTokens: 0,
      meanCostUsd: null,
      meanToolCalls: 0,
      meanRetries: 0,
      meanOverallScore: 0,
      meanFactualAccuracy: 0,
      meanEvidenceSupport: 0,
      reliabilityScore: 0,
    };
  }

  const successRuns = runs.filter((r) => r.status === "SUCCESS");
  const successCount = successRuns.length;
  const failureCount = n - successCount;
  const successRate = successCount / n;

  const durations = runs.map((r) => r.durationMs || 0).filter((d) => d > 0);
  const meanDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  
  const variance = durations.length > 1
    ? durations.reduce((sum, d) => sum + Math.pow(d - meanDurationMs, 2), 0) / (durations.length - 1)
    : 0;
  const stdDevDurationMs = Math.round(Math.sqrt(variance));

  const tokens = runs.map((r) => r.totalTokens || 0).filter((t) => t > 0);
  const meanTokens = tokens.length > 0 ? Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length) : 0;

  const costs = runs.map((r) => r.estimatedCostUsd).filter((c): c is number => typeof c === "number");
  const meanCostUsd = costs.length > 0 ? Number((costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(5)) : null;

  const toolCalls = runs.map((r) => r.toolCallCount || 0);
  const meanToolCalls = toolCalls.length > 0 ? Number((toolCalls.reduce((a, b) => a + b, 0) / toolCalls.length).toFixed(1)) : 0;

  const retries = runs.map((r) => r.retryCount || 0);
  const meanRetries = retries.length > 0 ? Number((retries.reduce((a, b) => a + b, 0) / retries.length).toFixed(1)) : 0;

  const scores = runs.map((r) => r.evaluation?.overallScore || 0).filter((s) => s > 0);
  const meanOverallScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;

  const facts = runs.map((r) => r.evaluation?.factualAccuracy || 0).filter((s) => s > 0);
  const meanFactualAccuracy = facts.length > 0 ? Number((facts.reduce((a, b) => a + b, 0) / facts.length).toFixed(1)) : 0;

  const evidence = runs.map((r) => r.evaluation?.evidenceSupport || 0).filter((s) => s > 0);
  const meanEvidenceSupport = evidence.length > 0 ? Number((evidence.reduce((a, b) => a + b, 0) / evidence.length).toFixed(1)) : 0;

  // Composite reliability score penalizes high failure rate and high latency variance
  const reliabilityScore = Math.max(0, Math.min(100, Math.round(
    (successRate * 60) +
    (meanOverallScore * 0.3) -
    (stdDevDurationMs > 3000 ? 10 : 0)
  )));

  return {
    repetitionCount: n,
    successCount,
    failureCount,
    successRate,
    meanDurationMs: Math.round(meanDurationMs),
    stdDevDurationMs,
    meanTokens,
    meanCostUsd,
    meanToolCalls,
    meanRetries,
    meanOverallScore,
    meanFactualAccuracy,
    meanEvidenceSupport,
    reliabilityScore,
  };
}
