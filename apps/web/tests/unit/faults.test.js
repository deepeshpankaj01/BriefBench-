import { test } from "node:test";
import assert from "node:assert/strict";

const FAULTS = [
  "MODEL_UNAVAILABLE",
  "MODEL_TIMEOUT",
  "RATE_LIMIT",
  "BROKEN_TOOL",
  "TAVILY_UNAVAILABLE",
  "INVALID_TOOL_RESPONSE",
  "EMPTY_EVIDENCE",
  "MISLEADING_INSTRUCTIONS",
  "MALFORMED_OUTPUT",
  "RETRY_EXHAUSTION",
];

test("Controlled Failure Lab contains all 10 required fault scenarios", () => {
  assert.equal(FAULTS.length, 10);
  assert.ok(FAULTS.includes("MODEL_UNAVAILABLE"));
  assert.ok(FAULTS.includes("RATE_LIMIT"));
  assert.ok(FAULTS.includes("BROKEN_TOOL"));
  assert.ok(FAULTS.includes("TAVILY_UNAVAILABLE"));
  assert.ok(FAULTS.includes("MISLEADING_INSTRUCTIONS"));
  assert.ok(FAULTS.includes("RETRY_EXHAUSTION"));
});
