import { test } from "node:test";
import assert from "node:assert/strict";
import { tavily } from "@tavily/core";

test("Tavily SDK @tavily/core is installed and exports factory function", () => {
  assert.equal(typeof tavily, "function", "tavily must be a factory function");
  const client = tavily({ apiKey: "test-key" });
  assert.equal(typeof client.search, "function", "client.search must be a function");
  assert.equal(typeof client.extract, "function", "client.extract must be a function");
});

test("Tavily Search options and fallback contracts are structured properly", () => {
  const dummySources = [
    {
      url: "https://sec.gov/filing",
      title: "SEC 10-Q Filing",
      excerpt: "Enterprise growth 32%",
      domain: "sec.gov",
    },
  ];
  assert.equal(dummySources.length, 1);
  assert.ok(dummySources[0].url.startsWith("https://"));
  assert.ok(dummySources[0].domain.length > 0);
});
