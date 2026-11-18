# BriefBench Implementation Plan

> **Product**: BriefBench — AI Agent Benchmarking & Evidence-First Research Platform  
> **Tagline**: *"Benchmark the Agent. Trust the Brief."*  
> **Primary Challenge**: Bifrost Problem Statement 02 (Benchmark AI Agents, Not Just Models)  
> **Secondary Track**: Tavily-Powered Meeting Research Integration  
> **Date**: November 2026

---

## 1. Executive Summary & Architectural Overview

BriefBench solves the fundamental issue with conventional LLM benchmarks: **evaluating raw models fails to predict agent performance in production**. Two agents utilizing the identical foundation model (e.g. `gpt-4o` or `claude-3-5-sonnet`) through Bifrost yield vastly divergent accuracy, latency, tool efficiency, hallucination rates, and recovery behaviours depending on their scaffolding, prompt engineering, retrieval strategy, tool routing, and validation loops.

BriefBench provides:
1. **Evidence-First Reproducibility**: Benchmark tasks evaluate agents using **frozen, SHA-256 hashed evidence snapshots** (harvested via Tavily Search & Extract) so every agent is tested on identical grounding data without network drift or silent information modification.
2. **Multi-Agent Diversity**:
   - **Agent 1**: High-performance Native TypeScript Research Agent (pure autonomous loop with step planning, evidence retrieval, citation mapping, and structured validation).
   - **Agent 2**: Python LangGraph State-Graph Agent (FastAPI microservice executing a state machine with planning, analysis, synthesis, validation, and retry nodes).
   - **Agent 3**: Generic HTTP Agent Adapter (versioned JSON contract for arbitrary third-party agent frameworks).
3. **Bifrost LLM Gateway Integration**: Centralized LLM gateway routing, model selection, rate-limit resilience, retry fallback, and telemetry capture.
4. **Transparent Multi-Dimensional Evaluation Engine**: Deterministic citation & factual alignment checks combined with an LLM judge evaluating 7 weighted rubric criteria.
5. **Controlled Failure Lab**: 10 deterministic fault scenarios (rate limits, context truncation, broken tools, misleading evidence, tool timeout, etc.) to stress-test agent fault tolerance.
6. **Execution Trace Viewer & Comparison Studio**: Step-by-step observable timeline with millisecond-resolution telemetry, token consumption, radar comparison, and reproducible run exports.

---

## 2. Directory & Workspace Structure

```
briefbench/
├── apps/
│   ├── web/                         # Next.js 14/15 App Router Frontend & API Backend
│   │   ├── app/
│   │   │   ├── (auth)/login & signup
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/       # Executive metrics & health
│   │   │   │   ├── research/        # Tavily meeting research studio
│   │   │   │   ├── evidence/        # Evidence Vault (snapshots & digests)
│   │   │   │   ├── agents/          # Agent registry & configuration
│   │   │   │   ├── benchmarks/      # Benchmark suite & experiment runner
│   │   │   │   ├── failure-lab/     # 10 fault-injection scenarios
│   │   │   │   ├── comparison/      # Side-by-side radar & run diff
│   │   │   │   ├── leaderboard/     # Fair normalized agent ranking
│   │   │   │   ├── traces/[id]/     # Microsecond execution timeline
│   │   │   │   └── settings/        # Bifrost & Tavily configuration
│   │   │   └── api/                 # REST endpoints for all platform capabilities
│   │   ├── components/              # Radix/Tailwind components, charts, forms
│   │   ├── lib/
│   │   │   ├── agents/              # Native TS Agent, LangGraph client, HTTP adapter
│   │   │   ├── benchmark/           # Orchestrator, rubric evaluator, statistical metrics
│   │   │   ├── evidence/            # Hasher, snapshot engine, Tavily collector
│   │   │   ├── failure/             # Fault injection harness
│   │   │   ├── bifrost.ts           # Bifrost Gateway SDK client
│   │   │   ├── tavily.ts            # Tavily Search & Extract SDK client
│   │   │   └── db.ts                # Prisma ORM instance
│   │   └── prisma/                  # Schema, migrations, seed script
│   └── langgraph-agent/             # Python 3.11+ LangGraph FastAPI Microservice
│       ├── main.py                  # FastAPI server with standardized contract
│       ├── graph.py                 # LangGraph StateGraph workflow
│       ├── bifrost_client.py        # Python Bifrost client wrapper
│       ├── requirements.txt
│       └── Dockerfile
├── docs/                            # Documentation & Architecture
├── tests/                           # Unit, integration, and E2E tests
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Seven Implementation Phases

### Phase 1: Foundation & Infrastructure
- Scaffold Next.js TypeScript app with Tailwind CSS, Lucide icons, Recharts, and Framer Motion.
- Configure Prisma ORM with comprehensive models:
  `User`, `Workspace`, `Agent`, `AgentVersion`, `BenchmarkTask`, `BenchmarkSuite`, `EvidenceSnapshot`, `EvidenceSource`, `BenchmarkExperiment`, `AgentRun`, `TraceEvent`, `ToolCall`, `Evaluation`, `FaultProfile`, `IntegrationConnection`, `AuditEvent`.
- Initialize database with rich seed data for instant offline/demo capability.
- Setup authentication & session handling with demo mode workspace flag.

### Phase 2: Design System & Public Surface
- Build dark/light theme palette: deep charcoal/navy (`#0B0F19`, `#111827`) with electric indigo (`#6366F1`) and cyan (`#06B6D4`) accents.
- Premium SaaS Landing Page with interactive benchmark comparison preview, architecture breakdown, Bifrost/Tavily value explanation, and FAQ.
- Main dashboard with statistical metrics: success rate, average tool calls, execution time, token consumption, and failure distribution.

### Phase 3: Research Workspace & Evidence Vault
- Integration of `@tavily/core` for Search & Extract.
- Meeting research input: Company, participants, purpose, objectives, competitors, questions.
- Generation of structured, source-cited meeting briefing with explicit distinction between verified facts, inferences, and unknowns.
- Evidence Vault: Immutable snapshot storage, SHA-256 cryptographic digest calculation, source metadata, and JSON/CSV export.

### Phase 4: Agent Registry & Multi-Agent Implementations
- Standardized Agent Contract (versioned JSON schema).
- **Agent 1 (Native TypeScript)**: Step-based autonomous research agent with reasoning steps, tool invocation, snapshot querying, citation synthesis, and schema validation.
- **Agent 2 (Python LangGraph)**: FastAPI service hosting a StateGraph (Plan -> Retrieve/Analyze -> Synthesize -> Self-Validate -> Output).
- **Agent 3 (Generic HTTP Adapter)**: Connect any external agent endpoint conforming to the BriefBench contract.
- Bifrost integration: OpenAI-compatible SDK pointing to Bifrost gateway (`https://api.bifrost.maxim.ai/v1` or custom gateway) with telemetry and fallback mock.

### Phase 5: Benchmark Engine & Multi-Dimensional Evaluation
- Benchmark orchestrator supporting:
  - Multi-agent concurrent/queued runs.
  - Configurable repetitions (e.g. 3-5 runs for statistical variance).
  - Frozen evidence isolation: guaranteed identical SHA-256 snapshot across all runs.
  - Execution limits (max steps, timeout, max tokens).
- 7-Dimension Transparent Rubric Evaluation:
  1. Factual accuracy (25%)
  2. Evidence support & citations (20%)
  3. Task completion (15%)
  4. Research completeness (15%)
  5. Actionability & relevance (10%)
  6. Instruction adherence (10%)
  7. Output consistency (5%)
- Deterministic checks + Bifrost-routed LLM judge with explainability logs.

### Phase 6: Controlled Failure Lab & Deep Observability
- 10 Controlled Fault Scenarios:
  1. Model unavailable (503 Service Unavailable)
  2. Model latency timeout
  3. Rate limiting (429 Too Many Requests)
  4. Broken research tool (exception during tool execution)
  5. Tavily search failure
  6. Invalid tool JSON payload
  7. Empty evidence snapshot
  8. Misleading retrieved instructions (prompt injection defense)
  9. Malformed agent JSON output
  10. Retry exhaustion
- Execution Trace Viewer: Waterfall timeline of every step, prompt, tool call, error, and recovery with token & latency breakdown.
- Comparison Workspace: Multi-agent radar chart, metric diff tables, head-to-head run viewer.
- Leaderboard: Fair, sample-size-qualified ranking with verifiable evidence links.

### Phase 7: Verification, Documentation & Packaging
- Automated test suites: Unit tests for hash digests, evaluation scoring, metrics, and fault injection; integration tests for agent endpoints and database operations.
- Full Docker Compose setup for Next.js web app, PostgreSQL, and Python LangGraph service.
- Production documentation: README, ARCHITECTURE.md, HACKATHON_SUBMISSION.md, .env.example.

---

## 4. Non-Negotiable Quality Safeguards

1. **Deterministic Reproducibility**: Never benchmark agents on dynamic web scrapes; all tests run against frozen SHA-256 hashed evidence snapshots.
2. **Zero Fake Metrics**: When tokens or costs are not reported by the gateway or agent, display "Not reported" instead of fabricated numbers.
3. **Untrusted Evidence Sanitization**: Retrieved web text is sanitized and treated as untrusted data to prevent prompt injection from compromising agent instructions.
4. **All UI Actions Functional**: Every button, filter, export, rerun, and tab is backed by operational application logic.
