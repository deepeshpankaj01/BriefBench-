# BriefBench Technical Architecture

> **Product**: BriefBench — AI Agent Benchmarking & Evidence-First Research Platform  
> **Tagline**: *"Benchmark the Agent. Trust the Brief."*  
> **Primary Track**: Bifrost Problem Statement 02 (Benchmark AI Agents, Not Just Models)  
> **Secondary Track**: Tavily-Powered Meeting Research Integration  
> **Version**: 1.2.0  

---

## 1. System Overview & Philosophy

Modern AI evaluation has a critical blindspot: **evaluating foundation models in isolation fails to predict agent performance in production**. Two agents utilizing the identical foundation model (e.g. `gpt-4o` or `claude-3-5-sonnet`) through Bifrost yield vastly divergent accuracy, latency, tool efficiency, hallucination rates, and recovery behaviours depending on their scaffolding, prompt engineering, retrieval strategy, tool routing, and validation loops.

BriefBench solves this by providing an **evidence-first, reproducible benchmarking platform** that treats the entire agent architecture as the unit of evaluation.

```
                           ┌────────────────────────────┐
                           │    User / Researcher UI    │
                           │    (Next.js App Router)    │
                           └─────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │   Tavily Core SDK     │                       │  Evidence Vault &     │
     │  Search & Extraction  │──────────────────────▶│  SHA-256 Hasher       │
     └───────────────────────┘                       └───────────┬───────────┘
                                                                 │
                                             ┌───────────────────┴───────────────────┐
                                             │ Identical Frozen Evidence Snapshot    │
                                             │ (Immutable SHA-256 Digest)            │
                                             └───────────────────┬───────────────────┘
                                                                 │
                                 ┌───────────────────────────────┼───────────────────────────────┐
                                 │                               │                               │
                                 ▼                               ▼                               ▼
                     ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
                     │ Agent 1: Native TS    │       │ Agent 2: LangGraph    │       │ Agent 3: Generic HTTP │
                     │ Autonomous Research   │       │ Python State-Graph    │       │ REST Adapter          │
                     │ Loop (TypeScript)     │       │ Microservice (:8000)  │       │ (CrewAI / AutoGen)    │
                     └───────────┬───────────┘       └───────────┬───────────┘       └───────────┬───────────┘
                                 │                               │                               │
                                 └───────────────────────────────┼───────────────────────────────┘
                                                                 │
                                                                 ▼
                                                     ┌───────────────────────┐
                                                     │  Bifrost LLM Gateway  │
                                                     │   (Maxim AI Gateway)  │
                                                     └───────────┬───────────┘
                                                                 │
                                                                 ▼
                                                     ┌───────────────────────┐
                                                     │  7-Dimension Rubric   │
                                                     │   Evaluation Engine   │
                                                     └───────────┬───────────┘
                                                                 │
                                                                 ▼
                                                     ┌───────────────────────┐
                                                     │ Trace Viewer, Radar   │
                                                     │ Comparison & Leaderboard
                                                     └───────────────────────┘
```

---

## 2. Monorepo Structure

```
BriefBench/
├── apps/
│   ├── web/                         # Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui
│   │   ├── app/
│   │   │   ├── (auth)/              # Login, Signup, Session
│   │   │   ├── (dashboard)/         # Protected Platform Areas
│   │   │   │   ├── dashboard/       # Executive Observability Overview
│   │   │   │   ├── research/        # Meeting Research Studio (Tavily Search & Extract)
│   │   │   │   ├── evidence/        # Evidence Vault (SHA-256 Digests & Snapshot Storage)
│   │   │   │   ├── agents/          # Agent Registry & Management
│   │   │   │   ├── benchmarks/      # Benchmark Engine & Experiment Runner
│   │   │   │   │   └── [id]/        # Experiment Details & Run Diffs
│   │   │   │   ├── failure-lab/     # Controlled Failure Testing Laboratory (10 Scenarios)
│   │   │   │   ├── comparison/      # Side-by-Side Radar & Metric Comparison
│   │   │   │   ├── leaderboard/     # Verified Agent Leaderboard
│   │   │   │   ├── traces/[id]/     # Microsecond Execution Trace Viewer
│   │   │   │   └── settings/        # Bifrost Gateway & Tavily Telemetry
│   │   │   ├── api/                 # REST Endpoints for all capabilities
│   │   │   └── page.tsx             # Public SaaS Landing Page
│   │   ├── components/              # Design System, Recharts, Forms, Badges
│   │   ├── lib/
│   │   │   ├── agents/              # Native TS Agent, LangGraph Client, HTTP Adapter
│   │   │   ├── benchmark/           # Orchestrator, 7-Dimension Evaluator, Metrics
│   │   │   ├── evidence/            # Cryptographic Hasher & Integrity Verifier
│   │   │   ├── failure/             # Fault Injector Harness (10 scenarios)
│   │   │   ├── bifrost.ts           # Maxim AI Bifrost LLM Gateway Client
│   │   │   ├── tavily.ts            # Tavily Search & Extract SDK Client
│   │   │   └── db.ts                # Prisma ORM Singleton
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Local SQLite / Dev Schema
│   │   │   ├── schema.postgresql.prisma # Production Neon PostgreSQL Schema
│   │   │   └── seed.mjs             # Rich Demo Workspace Database Seeder
│   │   └── tests/                   # Automated Unit & Integration Test Suites
│   └── langgraph-agent/             # Python 3.11+ FastAPI LangGraph Microservice
│       ├── main.py                  # FastAPI Application (:8000)
│       ├── graph.py                 # LangGraph StateGraph Execution Pipeline
│       ├── bifrost_client.py        # Python Bifrost Client
│       ├── requirements.txt         # Dependencies (fastapi, langgraph, langchain)
│       └── Dockerfile               # Container Deployment
├── docs/                            # Architectural & Submission Documentation
├── docker-compose.yml               # Multi-Container Orchestration (Web, Agent, Postgres)
├── .env.example                     # Environment Configuration Template
└── README.md                        # Master Documentation
```

---

## 3. Core Subsystems

### 3.1. Evidence Vault & Cryptographic Hasher (`lib/evidence/hasher.ts`)
- **Problem Solved**: Benchmarking against dynamic live URLs introduces non-deterministic test drift (articles update, paywalls activate, pages 404).
- **Mechanism**: Tavily extracts raw text and metadata. The Hasher normalizes and orders sources deterministically, generating an immutable **SHA-256 cryptographic digest**.
- **Fairness Guarantee**: Every agent run in an experiment receives the identical frozen snapshot. If a single character changes, the digest verification fails.

### 3.2. Bifrost LLM Gateway (`lib/bifrost.ts`)
- **Role**: Maxim AI Bifrost serves as the centralized model gateway for all LLM calls.
- **Capabilities**:
  - OpenAI-compatible chat completion routing to `https://api.bifrost.maxim.ai/v1`.
  - Dynamic model selection (`gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`).
  - Model telemetry capture: Prompt tokens, completion tokens, duration in milliseconds, and actual reported cost.
  - Zero-config deterministic fallback simulator for offline evaluation.

### 3.3. Tavily Research Integration (`lib/tavily.ts`)
- **SDK**: Official `@tavily/core`.
- **Workflow**:
  1. Multi-query search across corporate overview, recent news, competitors, and regulatory filings.
  2. Deep semantic extraction of raw webpage contents.
  3. Deduplication and metadata enrichment (published timestamps, source domains).
  4. Packaging into a structured research packet for snapshot freezing.

### 3.4. Multi-Agent Implementations (`lib/agents/`)
- **Agent 1: BriefBench Native Research Agent (TypeScript)**
  - Pure autonomous loop with explicit planning, snapshot evidence querying, citation extraction, JSON schema validation, and backoff retries.
- **Agent 2: BriefBench LangGraph Research Agent (Python + FastAPI)**
  - State machine workflow: `planning_node` ➔ `evidence_analysis_node` ➔ `synthesis_node` ➔ `validation_node` ➔ conditional `recovery_node`.
- **Agent 3: Generic HTTP Agent Adapter**
  - Standardized JSON contract over REST, enabling zero-code integration of external frameworks (CrewAI, AutoGen, custom agents).

### 3.5. 7-Dimension Transparent Rubric Evaluation (`lib/benchmark/evaluator.ts`)
1. **Factual Accuracy (25%)**: Verifies claims against snapshot excerpts; penalizes fabricated facts.
2. **Evidence Support & Citations (20%)**: Deterministically validates that all citation URLs exist in the frozen evidence snapshot.
3. **Task Completion (15%)**: Assesses inclusion of required executive sections.
4. **Research Completeness (15%)**: Evaluates depth across competitors, risks, and financials.
5. **Actionability & Relevance (10%)**: Measures utility of critical executive questions.
6. **Instruction Adherence (10%)**: Enforces strict boundary between verified facts and inferences.
7. **Output Consistency (5%)**: Validates schema compliance across repeated iterations.

### 3.6. Controlled Failure Testing Laboratory (`lib/failure/fault-injector.ts`)
10 Deterministic Fault Scenarios:
1. `MODEL_UNAVAILABLE`: Upstream LLM cluster returns HTTP 503.
2. `MODEL_TIMEOUT`: Request exceeds latency deadline.
3. `RATE_LIMIT`: Gateway rejects with HTTP 429 Too Many Requests.
4. `BROKEN_TOOL`: Internal tool throws runtime exception.
5. `TAVILY_UNAVAILABLE`: Research search gateway connection reset.
6. `INVALID_TOOL_RESPONSE`: Malformed non-JSON response payload.
7. `EMPTY_EVIDENCE`: Snapshot with 0 sources to test hallucination resistance.
8. `MISLEADING_INSTRUCTIONS`: Adversarial prompt injection embedded in untrusted web evidence.
9. `MALFORMED_OUTPUT`: Agent generates corrupted JSON schema.
10. `RETRY_EXHAUSTION`: Persistent failure exceeding retry budget.

---

## 4. Security & Isolation Safeguards

- **SSRF Protection**: URL extraction is restricted to verified external domains gathered by Tavily.
- **Prompt Injection Defense**: All retrieved evidence text is sanitized and tagged as untrusted context; system instructions strictly enforce that untrusted web data cannot override platform guidelines.
- **Secret Redaction**: Environment secrets (`BIFROST_API_KEY`, `TAVILY_API_KEY`, `AUTH_SECRET`) are strictly maintained server-side and never exposed to the client bundle.
