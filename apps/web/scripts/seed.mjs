import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function computeDigest(sources) {
  const sorted = [...sources].sort((a, b) => a.url.localeCompare(b.url));
  const canonical = sorted.map((s) => `${s.url}|${s.title}|${s.excerpt}|${s.fullContent || ""}`).join("::");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

async function main() {
  console.log("🌱 Seeding BriefBench database with demo workspace and verified benchmark data...");

  // Clean existing demo data safely
  await prisma.auditEvent.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.traceEvent.deleteMany();
  await prisma.toolCall.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.benchmarkExperiment.deleteMany();
  await prisma.evidenceSource.deleteMany();
  await prisma.evidenceSnapshot.deleteMany();
  await prisma.benchmarkTask.deleteMany();
  await prisma.benchmarkSuite.deleteMany();
  await prisma.faultProfile.deleteMany();
  await prisma.agentVersion.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Demo User & Workspace
  const user = await prisma.user.create({
    data: {
      email: "engineer@briefbench.ai",
      name: "Lead Research Engineer",
      role: "BENCHMARK_ARCHITECT",
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Global AI Engineering Demo Workspace",
      slug: "demo-workspace",
      isDemo: true,
    },
  });

  console.log("✓ Workspace & User created");

  // 2. Integration Connections
  await prisma.integrationConnection.createMany({
    data: [
      {
        workspaceId: workspace.id,
        provider: "BIFROST",
        status: "CONNECTED",
        endpointUrl: "https://api.bifrost.maxim.ai/v1",
        model: "gpt-4o",
        lastHealthCheckAt: new Date(),
        telemetry: JSON.stringify({
          activeGateway: "Maxim AI Bifrost v2.4",
          avgGatewayLatencyMs: 412,
          supportedModels: ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"],
          retryPolicy: "exponential_backoff_max_3",
        }),
      },
      {
        workspaceId: workspace.id,
        provider: "TAVILY",
        status: "CONNECTED",
        endpointUrl: "https://api.tavily.com",
        model: "tavily-search-extract-advanced",
        lastHealthCheckAt: new Date(),
        telemetry: JSON.stringify({
          sdk: "@tavily/core",
          capabilities: ["advanced_search", "raw_content_extract", "domain_filtering"],
          monthlySearchCreditsRemaining: 9840,
        }),
      },
    ],
  });

  // 3. Register Agents
  const nativeAgent = await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: "BriefBench Native Research Agent",
      slug: "briefbench-native-ts",
      framework: "NATIVE_TS",
      description: "Autonomous TypeScript research loop with deterministic planning, snapshot evidence indexing, and verifiable citation mapping.",
      isEnabled: true,
    },
  });

  const langgraphAgent = await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: "BriefBench LangGraph Research Agent",
      slug: "briefbench-langgraph-py",
      framework: "LANGGRAPH_PYTHON",
      description: "Python FastAPI microservice executing a state-graph workflow with discrete planning, evidence analysis, synthesis, validation, and recovery nodes.",
      isEnabled: true,
      endpointUrl: "http://127.0.0.1:8000/agent/run",
    },
  });

  const httpAgent = await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: "Third-Party CrewAI Adapter",
      slug: "crewai-adapter",
      framework: "HTTP_CUSTOM",
      description: "External agent service wrapped in the BriefBench standardized versioned JSON contract.",
      isEnabled: true,
      endpointUrl: "http://127.0.0.1:8080/agent",
    },
  });

  // Agent Versions
  const nativeVersion = await prisma.agentVersion.create({
    data: {
      agentId: nativeAgent.id,
      version: "1.2.0",
      configHash: "sha256-a94f8e2193cb56d012488d9298492041",
      model: "gpt-4o",
      systemPrompt: "You are BriefBench Native Research Agent (v1.2.0), a world-class evidence-first research assistant.",
      toolDefinitions: JSON.stringify([
        { name: "query_frozen_snapshot_tool", description: "Search frozen evidence sources" },
        { name: "verify_citation_digest", description: "Validate source URL against snapshot" },
      ]),
      parameters: JSON.stringify({ temperature: 0.1, max_steps: 8, max_retries: 2 }),
    },
  });

  const langgraphVersion = await prisma.agentVersion.create({
    data: {
      agentId: langgraphAgent.id,
      version: "2.1.0",
      configHash: "sha256-d71c84918e74a8109bfbc948214f1092",
      model: "gpt-4o",
      systemPrompt: "You are the BriefBench LangGraph Research Agent. Generate a rigorous JSON research brief based only on the evidence.",
      toolDefinitions: JSON.stringify([
        { name: "evidence_analysis_node", description: "Graph node for entity extraction" },
        { name: "validation_node", description: "Self-correction graph check" },
      ]),
      parameters: JSON.stringify({ temperature: 0.2, graph_max_loops: 3 }),
    },
  });

  console.log("✓ Agents and Versions created");

  // 4. Fault Profiles (10 Controlled Scenarios)
  const faultProfiles = [
    { code: "MODEL_UNAVAILABLE", name: "Model Gateway Unavailable (503)", faultType: "HTTP_ERROR", triggerStep: "MODEL_REQUEST", description: "Simulates upstream LLM cluster outage returning HTTP 503." },
    { code: "MODEL_TIMEOUT", name: "Model Request Timeout", faultType: "LATENCY", triggerStep: "MODEL_REQUEST", description: "Simulates 15,000ms delay exceeding agent request deadline." },
    { code: "RATE_LIMIT", name: "Rate Limit Exceeded (429)", faultType: "HTTP_ERROR", triggerStep: "MODEL_REQUEST", description: "Simulates gateway rate limit rejection requiring exponential backoff." },
    { code: "BROKEN_TOOL", name: "Broken Research Tool", faultType: "TOOL_ERROR", triggerStep: "TOOL_CALLED", description: "Simulates internal tool runtime crash during evidence search." },
    { code: "TAVILY_UNAVAILABLE", name: "Tavily Search API Unavailable", faultType: "TOOL_ERROR", triggerStep: "TOOL_CALLED", description: "Simulates external Tavily gateway connection reset." },
    { code: "INVALID_TOOL_RESPONSE", name: "Invalid Tool JSON Payload", faultType: "MALFORMED_DATA", triggerStep: "TOOL_CALLED", description: "Simulates corrupted non-JSON HTML error body returned by tool." },
    { code: "EMPTY_EVIDENCE", name: "Empty Evidence Snapshot", faultType: "CORRUPT_EVIDENCE", triggerStep: "EVIDENCE_LOADED", description: "Simulates complete lack of grounding evidence to test hallucination resistance." },
    { code: "MISLEADING_INSTRUCTIONS", name: "Misleading Prompt Injection in Evidence", faultType: "CORRUPT_EVIDENCE", triggerStep: "EVIDENCE_LOADED", description: "Simulates adversarial prompt injection within retrieved web source text." },
    { code: "MALFORMED_OUTPUT", name: "Malformed Agent JSON Output", faultType: "MALFORMED_DATA", triggerStep: "VALIDATION", description: "Simulates generation phase omitting mandatory briefing schema keys." },
    { code: "RETRY_EXHAUSTION", name: "Retry Budget Exhaustion", faultType: "RESILIENCE", triggerStep: "MODEL_REQUEST", description: "Simulates continuous upstream failure exceeding maximum allowed retries." },
  ];

  for (const fp of faultProfiles) {
    await prisma.faultProfile.create({ data: fp });
  }

  // 5. Benchmark Suite & Tasks
  const suite = await prisma.benchmarkSuite.create({
    data: {
      workspaceId: workspace.id,
      name: "Enterprise Executive Intelligence Suite",
      description: "Standardized benchmark suite assessing meeting briefing synthesis, factual grounding, and competitor analysis.",
      category: "MEETING_RESEARCH",
    },
  });

  const task1 = await prisma.benchmarkTask.create({
    data: {
      suiteId: suite.id,
      title: "Databricks Enterprise Lakehouse & AI Strategy Briefing",
      objective: "Prepare an evidence-backed executive briefing for an upcoming partnership meeting with Databricks leadership.",
      companyName: "Databricks",
      meetingContext: JSON.stringify({
        participants: ["Ali Ghodsi (CEO)", "VP of Enterprise AI", "Global Head of Strategic Partnerships"],
        date: "2026-11-25",
        agenda: "Joint enterprise data governance and multi-agent observability integration",
        industry: "Data Infrastructure & Enterprise AI",
      }),
      requirements: JSON.stringify({
        requiredSections: ["executiveSummary", "companyOverview", "competitorLandscape", "potentialRisks", "importantQuestionsToAsk"],
        requireCitations: true,
        distinguishFactsAndInferences: true,
      }),
    },
  });

  // 6. Evidence Sources & Frozen Snapshot
  const sources1 = [
    {
      url: "https://www.sec.gov/edgar/data/databricks/q3-market-filing",
      title: "Databricks Enterprise Market Analysis & Financial Performance",
      domain: "sec.gov",
      publishedAt: "2026-10-15T14:30:00Z",
      excerpt: "Databricks demonstrated sustained customer adoption with 32% annual expansion in tier-1 enterprise accounts. Strategic focus centers on unified data lakehouse infrastructure and sovereign AI agent deployments.",
      fullContent: "Databricks reported continued acceleration across international markets, driven by demand for governance-first AI capabilities. Net revenue retention stood at 134%, with significant uptake in financial services and healthcare sectors.",
    },
    {
      url: "https://techcrunch.com/2026/09/20/databricks-expands-ai-agent-governance",
      title: "How Databricks Is Tackling Enterprise AI Agent Reliability and Governance",
      domain: "techcrunch.com",
      publishedAt: "2026-09-20T09:15:00Z",
      excerpt: "In an exclusive interview, leadership outlined their new unified agent evaluation framework designed to counter non-deterministic model drift and verify grounding citations before deploying to production.",
      fullContent: "Enterprise CTOs have identified hallucination and lack of verifiable audit trails as the primary impediments to productionizing generative AI agents. Databricks responded by launching integrated tracing and frozen snapshot evaluation capabilities that guarantee repeatable agent benchmarking.",
    },
    {
      url: "https://www.gartner.com/reviews/market/data-management-ai/databricks-vs-competitors",
      title: "Peer Insights: Databricks vs Snowflake and BigQuery Evaluation Report",
      domain: "gartner.com",
      publishedAt: "2026-08-30T11:00:00Z",
      excerpt: "Gartner Peer Insights rates Databricks 4.7/5 in core processing speed and scalability, while noting that deployment complexity requires specialized engineering resources compared to simpler alternatives.",
      fullContent: "Customer feedback highlights superior query optimization and open data formats as top differentiators. However, procurement teams frequently request more granular usage-based cost alerting to prevent unexpected monthly bill surges during heavy iterative benchmarking workloads.",
    },
    {
      url: "https://bloomberg.com/news/articles/2026-11-02/databricks-announces-strategic-initiatives",
      title: "Bloomberg: Databricks Previews Next-Gen Enterprise Automation and Strategic Roadmap",
      domain: "bloomberg.com",
      publishedAt: "2026-11-02T16:45:00Z",
      excerpt: "Key upcoming initiatives include automated contract intelligence, deterministic benchmark verification, and zero-trust agentic security protocols for Fortune 100 enterprise deployments.",
      fullContent: "At its annual customer summit, the company unveiled new enterprise-grade safeguards that ensure all automated insights are backed by cryptographic evidence digests. Executives emphasized that enterprise buyers are demanding measurable ROI and strict citation tracing.",
    },
  ];

  const digest1 = computeDigest(sources1);

  const snapshot1 = await prisma.evidenceSnapshot.create({
    data: {
      taskId: task1.id,
      digest: digest1,
      title: "Databricks Verified Q3 Grounding Snapshot",
      description: "Cryptographically frozen Tavily Search & Extract packet containing 4 verified sources across regulatory, technical, and financial domains.",
      isFrozen: true,
      version: 1,
      totalSources: sources1.length,
      sources: {
        create: sources1,
      },
    },
  });

  console.log("✓ Benchmark Task & Frozen Evidence Snapshot created with digest:", digest1.slice(0, 16) + "...");

  // 7. Benchmark Experiment: Native Agent vs LangGraph Agent (3 Repetitions Each)
  const experiment = await prisma.benchmarkExperiment.create({
    data: {
      workspaceId: workspace.id,
      taskId: task1.id,
      snapshotId: snapshot1.id,
      name: "Databricks Head-to-Head: Native TS vs LangGraph Python",
      repetitions: 3,
      concurrencyLimit: 1,
      status: "COMPLETED",
      isDemo: true,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3400000),
    },
  });

  // Pre-populate 3 runs for Native TS Agent
  for (let rep = 1; rep <= 3; rep++) {
    const duration = 1420 + Math.floor(Math.random() * 250);
    const tokens = 1240 + Math.floor(Math.random() * 80);
    const run = await prisma.agentRun.create({
      data: {
        experimentId: experiment.id,
        agentId: nativeAgent.id,
        agentVersionId: nativeVersion.id,
        repetitionIndex: rep,
        status: "SUCCESS",
        durationMs: duration,
        totalTokens: tokens,
        promptTokens: 580,
        completionTokens: tokens - 580,
        estimatedCostUsd: 0.0062,
        toolCallCount: 1,
        retryCount: 0,
        isDemo: true,
        startedAt: new Date(Date.now() - 3600000 + rep * 60000),
        completedAt: new Date(Date.now() - 3600000 + rep * 60000 + duration),
        outputReport: JSON.stringify({
          executiveSummary: "Executive briefing prepared with frozen ground-truth evidence. Databricks exhibits 32% annual expansion in tier-1 accounts.",
          companyOverview: "Unified data lakehouse pioneer emphasizing open source formats and sovereign AI governance.",
          recentDevelopments: [
            "Announced 32% annual expansion in tier-1 enterprise accounts (SEC filing).",
            "Launched integrated tracing and frozen snapshot evaluation capabilities (TechCrunch).",
          ],
          industryContext: "Rapid shift toward deterministic agent observability and verifiable provenance.",
          competitorLandscape: [
            { name: "Snowflake", differentiation: "Simpler serverless interface, but proprietary storage lock-in." },
            { name: "Google BigQuery", differentiation: "Tight GCP ecosystem integration, but higher egress and cross-cloud overhead." },
          ],
          businessOpportunities: [
            "Joint enterprise offering combining BriefBench agent observability with Databricks lakehouse compute.",
          ],
          potentialRisks: [
            "Enterprise procurement friction surrounding unexpected model inference bill surges.",
          ],
          importantQuestionsToAsk: [
            "What is Databricks' roadmap for supporting cryptographically verified agent benchmark suites?",
            "How does the team currently measure hallucination rates across upstream LLM model updates?",
          ],
          citations: [
            { url: sources1[0].url, claim: "32% annual expansion in tier-1 enterprise accounts", sourceTitle: sources1[0].title },
            { url: sources1[1].url, claim: "Launched integrated tracing and frozen snapshot evaluation capabilities", sourceTitle: sources1[1].title },
            { url: sources1[2].url, claim: "Gartner Peer Insights rates Databricks 4.7/5 in core processing speed", sourceTitle: sources1[2].title },
          ],
          verifiedFacts: ["Net revenue retention stood at 134% in SEC filing", "Gartner Peer Insights rating 4.7/5"],
          inferences: ["Likely prioritizing Fortune 100 enterprise accounts over mid-market self-serve"],
          unknowns: ["Specific gross margins for unmetered generative AI inference workloads"],
        }),
      },
    });

    // Trace events for Native Agent
    await prisma.traceEvent.createMany({
      data: [
        { runId: run.id, stepNumber: 1, eventType: "TASK_RECEIVED", name: "Task Contract Ingestion", status: "SUCCESS", durationMs: 15, timestamp: new Date(Date.now() - 3600000 + rep * 60000) },
        { runId: run.id, stepNumber: 2, eventType: "EVIDENCE_LOADED", name: "Frozen Evidence Snapshot Verification", status: "SUCCESS", durationMs: 45, inputPayload: JSON.stringify({ digest: digest1, totalSources: 4 }), timestamp: new Date(Date.now() - 3600000 + rep * 60000 + 15) },
        { runId: run.id, stepNumber: 3, eventType: "PLANNING_DONE", name: "Research Plan Synthesized", status: "SUCCESS", durationMs: 60, timestamp: new Date(Date.now() - 3600000 + rep * 60000 + 60) },
        { runId: run.id, stepNumber: 4, eventType: "TOOL_CALLED", name: "query_frozen_snapshot_tool", status: "SUCCESS", durationMs: 80, timestamp: new Date(Date.now() - 3600000 + rep * 60000 + 120) },
        { runId: run.id, stepNumber: 5, eventType: "MODEL_REQUEST", name: "Bifrost Gateway LLM Synthesis Request", status: "SUCCESS", durationMs: 1100, tokenUsage: tokens, timestamp: new Date(Date.now() - 3600000 + rep * 60000 + 200) },
        { runId: run.id, stepNumber: 6, eventType: "VALIDATION_PASS", name: "Schema & Citation Verification Pass", status: "SUCCESS", durationMs: 30, timestamp: new Date(Date.now() - 3600000 + rep * 60000 + 1300) },
        { runId: run.id, stepNumber: 7, eventType: "RUN_COMPLETED", name: "Native Agent Benchmark Run Concluded", status: "SUCCESS", durationMs: 10, timestamp: new Date(Date.now() - 3600000 + rep * 60000 + duration) },
      ],
    });

    // Evaluation for Native Agent Run
    await prisma.evaluation.create({
      data: {
        runId: run.id,
        judgeModel: "bifrost/gpt-4o",
        rubricVersion: "1.0.0",
        overallScore: 94.5,
        factualAccuracy: 96.0,
        evidenceSupport: 95.0,
        taskCompletion: 98.0,
        researchCompleteness: 92.0,
        actionability: 90.0,
        instructionAdherence: 95.0,
        outputConsistency: 95.0,
        reasoning: "Exceptional factual alignment with zero hallucinated URLs. All 3 citations map directly to the SHA-256 evidence snapshot.",
        unsupportedClaims: JSON.stringify([]),
        verifiedCitations: JSON.stringify([sources1[0].url, sources1[1].url, sources1[2].url]),
      },
    });
  }

  // Pre-populate 3 runs for LangGraph Python Agent
  for (let rep = 1; rep <= 3; rep++) {
    const duration = 2150 + Math.floor(Math.random() * 320);
    const tokens = 1380 + Math.floor(Math.random() * 90);
    const run = await prisma.agentRun.create({
      data: {
        experimentId: experiment.id,
        agentId: langgraphAgent.id,
        agentVersionId: langgraphVersion.id,
        repetitionIndex: rep,
        status: "SUCCESS",
        durationMs: duration,
        totalTokens: tokens,
        promptTokens: 620,
        completionTokens: tokens - 620,
        estimatedCostUsd: 0.0069,
        toolCallCount: 2,
        retryCount: 0,
        isDemo: true,
        startedAt: new Date(Date.now() - 3500000 + rep * 60000),
        completedAt: new Date(Date.now() - 3500000 + rep * 60000 + duration),
        outputReport: JSON.stringify({
          executiveSummary: "LangGraph StateGraph executive briefing compiled with evidence verification nodes.",
          companyOverview: "Market leader exhibiting accelerating adoption in enterprise data pipelines.",
          recentDevelopments: [
            "Expanded sovereign data perimeter support for regulated industries",
            "Released agentic orchestration benchmarks with 99.4% uptime",
          ],
          industryContext: "Enterprise transition towards deterministic agent architectures with provenance tracking.",
          competitorLandscape: [
            { name: "Snowflake", differentiation: "Faster initial setup, but restricted governance observability" },
            { name: "Google BigQuery", differentiation: "Tight GCP ecosystem integration, but higher egress costs" },
          ],
          businessOpportunities: [
            "Consolidate fragmented agent tooling under single verified observability gateway",
          ],
          potentialRisks: [
            "Upstream provider API throttling during high-throughput eval cycles",
          ],
          importantQuestionsToAsk: [
            "How does your team ensure evidence reproducibility across model upgrades?",
          ],
          citations: [
            { url: sources1[1].url, claim: "Enterprise transition towards deterministic agent architectures", sourceTitle: sources1[1].title },
          ],
          verifiedFacts: ["Platform supports sovereign perimeter validation"],
          inferences: ["Likely prioritizes enterprise contract expansions"],
          unknowns: ["Long term pricing on continuous eval compute"],
        }),
      },
    });

    // Trace events for LangGraph Agent
    await prisma.traceEvent.createMany({
      data: [
        { runId: run.id, stepNumber: 1, eventType: "TASK_RECEIVED", name: "LangGraph StateGraph Initialized", status: "SUCCESS", durationMs: 20, timestamp: new Date(Date.now() - 3500000 + rep * 60000) },
        { runId: run.id, stepNumber: 2, eventType: "PLANNING_START", name: "Graph Node: planning_node", status: "SUCCESS", durationMs: 70, timestamp: new Date(Date.now() - 3500000 + rep * 60000 + 20) },
        { runId: run.id, stepNumber: 3, eventType: "TOOL_CALLED", name: "Graph Node: evidence_analysis_node", status: "SUCCESS", durationMs: 110, timestamp: new Date(Date.now() - 3500000 + rep * 60000 + 90) },
        { runId: run.id, stepNumber: 4, eventType: "MODEL_REQUEST", name: "Graph Node: synthesis_node (Bifrost Gateway)", status: "SUCCESS", durationMs: 1800, tokenUsage: tokens, timestamp: new Date(Date.now() - 3500000 + rep * 60000 + 200) },
        { runId: run.id, stepNumber: 5, eventType: "VALIDATION_PASS", name: "Graph Node: validation_node", status: "SUCCESS", durationMs: 40, timestamp: new Date(Date.now() - 3500000 + rep * 60000 + 2000) },
        { runId: run.id, stepNumber: 6, eventType: "RUN_COMPLETED", name: "LangGraph StateGraph Terminated Successfully", status: "SUCCESS", durationMs: 10, timestamp: new Date(Date.now() - 3500000 + rep * 60000 + duration) },
      ],
    });

    // Evaluation for LangGraph Agent Run
    await prisma.evaluation.create({
      data: {
        runId: run.id,
        judgeModel: "bifrost/gpt-4o",
        rubricVersion: "1.0.0",
        overallScore: 89.2,
        factualAccuracy: 92.0,
        evidenceSupport: 88.0,
        taskCompletion: 90.0,
        researchCompleteness: 86.0,
        actionability: 88.0,
        instructionAdherence: 92.0,
        outputConsistency: 94.0,
        reasoning: "Solid structured briefing with correct state graph validation. Slightly fewer detailed citations than Native TS Agent.",
        unsupportedClaims: JSON.stringify([]),
        verifiedCitations: JSON.stringify([sources1[1].url]),
      },
    });
  }

  // 8. Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        workspaceId: workspace.id,
        action: "EXPERIMENT_EXECUTED",
        entityType: "BenchmarkExperiment",
        entityId: experiment.id,
        details: JSON.stringify({ name: experiment.name, repetitions: 3, totalRuns: 6 }),
        actorEmail: user.email,
      },
      {
        workspaceId: workspace.id,
        action: "SNAPSHOT_FROZEN",
        entityType: "EvidenceSnapshot",
        entityId: snapshot1.id,
        details: JSON.stringify({ digest: digest1, totalSources: 4 }),
        actorEmail: user.email,
      },
    ],
  });

  console.log("✅ BriefBench seed completed successfully! 1 Workspace, 3 Agents, 1 Suite, 1 Task, 1 Frozen Snapshot, 1 Experiment (6 Runs with complete traces & evaluations), 10 Fault Profiles.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
