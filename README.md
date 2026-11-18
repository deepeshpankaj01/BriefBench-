# BriefBench — AI Agent Benchmarking & Evidence-First Research Platform

<p align="center">
  <strong>"Benchmark the Agent. Trust the Brief."</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Track-Bifrost_Problem_Statement_02-6366F1?style=for-the-badge" alt="Bifrost PS02" />
  <img src="https://img.shields.io/badge/Secondary-Tavily_Meeting_Research-06B6D4?style=for-the-badge" alt="Tavily Secondary" />
  <img src="https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-LangGraph-yellow?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Tests-7%20Passed-emerald?style=for-the-badge" alt="Tests" />
</p>

---

## 🚀 Overview

**BriefBench** is an evidence-first AI agent benchmarking and executive meeting research platform built for the Global AI Hackathon.

Unlike conventional LLM benchmarks (which evaluate static models on isolated prompts), BriefBench evaluates the **complete agent system**:
- **Foundation Model** (routed through **Maxim AI Bifrost LLM Gateway**)
- **Scaffolding Architecture** (Native TypeScript autonomous loop vs Python LangGraph state machines)
- **Tool Selection & Efficiency**
- **Evidence Retrieval Strategy** (powered by **Tavily Search & Extract**)
- **Factual Grounding & Citation Integrity**
- **Self-Correction & Retry Resilience**
- **Controlled Fault Tolerance** (10 deterministic failure scenarios)

---

## 🎯 The Core Problem

Two agents utilizing the exact same foundation model (e.g. `gpt-4o` or `claude-3-5-sonnet`) can produce completely different results in production:
1. One agent retrieves concise evidence and verifies every claim against source URLs.
2. Another hallucinates citations, burns through token budgets with uncontrolled retries, or crashes when a tool throws a 429 or 503 error.

**BriefBench makes these operational differences measurable, explainable, and reproducible.**

---

## 🔑 Key Features

### 1. Evidence Vault & Cryptographic Freezing
- Every benchmark evaluates agents on **frozen, immutable SHA-256 evidence snapshots**.
- Eliminates live web test drift (articles updating, paywalls, network drops).
- Guarantees that every competing agent is evaluated on identical input data.

### 2. Maxim AI Bifrost LLM Gateway Integration
- Unified OpenAI-compatible gateway routing to `https://api.bifrost.maxim.ai/v1`.
- Captures millisecond request timing, input/output token counts, and actual reported model costs.
- Centralized rate-limiting fallback and telemetry observability.

### 3. Tavily Meeting Research Studio
- Integrates the official `@tavily/core` SDK.
- Automates deep company research, extracts raw webpage content, deduplicates sources, and generates structured meeting briefings.
- Clearly distinguishes between **Verified Facts**, **Analytical Inferences**, and **Unknowns**.

### 4. Multi-Agent Framework Diversity
- **Agent 1: BriefBench Native Research Agent** (Pure TypeScript autonomous loop with explicit planning, snapshot tool querying, and citation validation).
- **Agent 2: BriefBench LangGraph Research Agent** (Python FastAPI microservice executing a discrete StateGraph: `planning` ➔ `evidence_analysis` ➔ `synthesis` ➔ `validation` ➔ `recovery`).
- **Agent 3: Generic HTTP Agent Adapter** (REST contract for third-party frameworks like CrewAI and AutoGen).

### 5. 7-Dimension Transparent Rubric
1. **Factual Accuracy (25%)**: Validates claims against snapshot excerpts.
2. **Evidence Support & Citations (20%)**: Deterministically verifies citation URLs.
3. **Task Completion (15%)**: Assesses required executive sections.
4. **Research Completeness (15%)**: Measures competitive and risk coverage.
5. **Actionability & Questions (10%)**: Utility of meeting questions.
6. **Instruction Adherence (10%)**: Strict separation of facts vs inferences.
7. **Output Consistency (5%)**: Run-to-run schema uniformity.

### 6. Controlled Failure Testing Laboratory
10 deterministic fault scenarios safely simulated via an internal adapter:
- Model Gateway Unavailable (503)
- Model Request Timeout
- Gateway Rate Limit (429)
- Broken Research Tool
- Tavily API Connection Reset
- Invalid Tool JSON Payload
- Empty Evidence Snapshot
- Adversarial Prompt Injection in Evidence
- Malformed Agent JSON Output
- Retry Budget Exhaustion

### 7. Execution Trace Waterfall Viewer
- Microsecond-resolution timeline for every individual agent run.
- Expandable step details, input payloads, output transitions, duration, token usage, and error diagnostics.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Recharts, Framer Motion
- **Backend**: Next.js Server-Side API Routes, Prisma ORM, Node.js `node:crypto`
- **Database**: PostgreSQL (Neon-ready schema provided) and SQLite for zero-dependency instant local execution
- **Python Service**: Python 3.11+, FastAPI, LangGraph, Uvicorn
- **AI Gateway**: Maxim AI Bifrost (`https://api.bifrost.maxim.ai/v1`)
- **Research Engine**: Tavily AI Core SDK (`@tavily/core`)
- **Testing**: Node.js Native Test Runner (`node:test`, `node:assert/strict`)

---

## ⚡ Quick Start (Local Run in 60 Seconds)

### 1. Clone & Install
```bash
git clone <repo-url>
cd BriefBench
cd apps/web
npm install
```

### 2. Initialize Database & Demo Seed Data
```bash
npx prisma generate
npx prisma db push
node scripts/seed.mjs
```

### 3. Run Automated Tests
```bash
npm test
```
*Output: 7 passing tests validating snapshot digests, evaluator accuracy, metrics, and fault profiles.*

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Support

To run the entire multi-container stack (Next.js web app, Python LangGraph service, and PostgreSQL):

```bash
docker compose up --build
```

---

## 📋 Hackathon Evaluation Checklist

- [x] **Primary Challenge**: Bifrost Problem Statement 02 fully implemented with live gateway routing, token accounting, and telemetry settings.
- [x] **Secondary Track**: Tavily Meeting Research fully implemented with `@tavily/core` Search & Extract.
- [x] **Two Real Agents**: Native TypeScript Agent and Python LangGraph Agent independently implemented.
- [x] **Frozen Evidence**: SHA-256 cryptographic digest calculation and verification.
- [x] **7-Dimension Rubric**: Deterministic citation validation combined with LLM judging.
- [x] **10 Fault Scenarios**: Controlled failure laboratory with side-by-side recovery comparison.
- [x] **Observable Traces**: Step-by-step waterfall viewer with token and latency breakdowns.
- [x] **Zero Fake Metrics**: Averages calculated strictly from recorded database runs; missing usage displays "Not reported".
- [x] **Demo Mode**: Rich pre-seeded demo workspace clearly labeled `DEMO DATA`, runnable without API keys.

---

## 📄 License & Team

Built with ❤️ for the Global AI Hackathon.
Licensed under the Apache 2.0 License.
