import OpenAI from "openai";

export interface BifrostCompletionOptions {
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

export interface BifrostCompletionResult {
  content: string;
  model: string;
  provider: string;
  durationMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
  isSimulated: boolean;
  gatewayMetadata?: {
    gatewayEndpoint: string;
    gatewayStatus: string;
    bifrostRequestId?: string;
    retryCount?: number;
    fallbackUsed?: boolean;
  };
}

/**
 * Bifrost LLM Gateway Client
 * Centralizes model routing, telemetry, token accounting, and fallback resilience.
 */
export class BifrostGatewayClient {
  private client: OpenAI | null = null;
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.BIFROST_API_KEY || "";
    this.baseURL = process.env.BIFROST_BASE_URL || "https://api.bifrost.maxim.ai/v1";
    this.defaultModel = process.env.BIFROST_MODEL || "gpt-4o";

    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        defaultHeaders: {
          "X-Bifrost-Client": "BriefBench-Benchmark-Engine",
          "X-Bifrost-Trace": "true",
        },
      });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getGatewayInfo() {
    return {
      isConfigured: this.isConfigured(),
      endpoint: this.baseURL,
      model: this.defaultModel,
      provider: "Bifrost (Maxim AI Gateway)",
    };
  }

  /**
   * Execute chat completion routed via Bifrost gateway
   */
  async createChatCompletion(options: BifrostCompletionOptions): Promise<BifrostCompletionResult> {
    const startTime = Date.now();
    const modelToUse = options.model || this.defaultModel;

    // Live Gateway Execution
    if (this.client && this.isConfigured()) {
      try {
        const response = await this.client.chat.completions.create({
          model: modelToUse,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.max_tokens ?? 2500,
          response_format: options.response_format,
        });

        const durationMs = Date.now() - startTime;
        const choice = response.choices[0];
        const content = choice?.message?.content || "";
        const usage = response.usage;

        // Calculate cost if standard pricing matches (e.g. gpt-4o approx $5/1M input, $15/1M output)
        let cost: number | null = null;
        if (usage && usage.prompt_tokens && usage.completion_tokens) {
          if (modelToUse.includes("gpt-4o")) {
            cost = (usage.prompt_tokens * 0.000005) + (usage.completion_tokens * 0.000015);
          } else if (modelToUse.includes("claude-3-5-sonnet")) {
            cost = (usage.prompt_tokens * 0.000003) + (usage.completion_tokens * 0.000015);
          }
        }

        return {
          content,
          model: response.model || modelToUse,
          provider: "bifrost-gateway",
          durationMs,
          promptTokens: usage?.prompt_tokens ?? null,
          completionTokens: usage?.completion_tokens ?? null,
          totalTokens: usage?.total_tokens ?? null,
          estimatedCostUsd: cost ? Number(cost.toFixed(6)) : null,
          isSimulated: false,
          gatewayMetadata: {
            gatewayEndpoint: this.baseURL,
            gatewayStatus: "200 OK",
            bifrostRequestId: response.id || `bifrost-${Date.now()}`,
            retryCount: 0,
            fallbackUsed: false,
          },
        };
      } catch (err: unknown) {
        const error = err as { message?: string; status?: number };
        console.error("[BifrostGatewayClient] Error routing through Bifrost:", error);
        throw new Error(`Bifrost Gateway Request Failed: ${error.message || "Unknown error"}`);
      }
    }

    // Deterministic High-Fidelity Mock for Offline / Demo Mode (No API key configured)
    const durationMs = 380 + Math.floor(Math.random() * 220);
    const lastUserPrompt = options.messages[options.messages.length - 1]?.content || "";

    return {
      content: this.generateDeterministicMockResponse(lastUserPrompt, options.response_format?.type === "json_object"),
      model: modelToUse,
      provider: "bifrost-simulator (DEMO MODE)",
      durationMs,
      promptTokens: 412,
      completionTokens: 648,
      totalTokens: 1060,
      estimatedCostUsd: 0.0052,
      isSimulated: true,
      gatewayMetadata: {
        gatewayEndpoint: this.baseURL,
        gatewayStatus: "200 Simulated (Demo Mode - Configure BIFROST_API_KEY for live calls)",
        bifrostRequestId: `sim-${Date.now()}`,
        retryCount: 0,
        fallbackUsed: false,
      },
    };
  }

  private generateDeterministicMockResponse(prompt: string, expectJson: boolean): string {
    if (expectJson) {
      return JSON.stringify({
        executiveSummary: "Executive briefing prepared with frozen ground-truth evidence. High priority initiatives identified with verifiable citations.",
        companyOverview: "Enterprise SaaS market leader with accelerating multi-cloud adoption and recent strategic expansion.",
        recentDevelopments: [
          "Announced Q3 revenue growth of 28% YoY driven by enterprise AI deployments.",
          "Closed strategic partnership expanding EMEA data center presence.",
        ],
        industryContext: "Market undergoing rapid consolidation around unified data and AI observability stacks.",
        competitorLandscape: [
          { name: "Competitor Alpha", differentiation: "Lower price point but lacking SOC-2 Type II and fine-grained RBAC." },
          { name: "Competitor Beta", differentiation: "Legacy on-premise installation base with slower release velocity." },
        ],
        businessOpportunities: [
          "Cross-sell unified agent observability into existing enterprise data engineering accounts.",
          "Target regulated banking clients requiring frozen audit trails and cryptographic proof.",
        ],
        potentialRisks: [
          "Prolonged enterprise procurement cycles in Fortune 500 accounts.",
          "Rate limit throttling on unmanaged upstream LLM endpoints.",
        ],
        importantQuestionsToAsk: [
          "What is the timeline for your multi-region data residency compliance?",
          "How are your agent teams managing non-deterministic retry budgets in production?",
        ],
        citations: [
          {
            url: "https://finance.yahoo.com/quote/enterprise-q3-results",
            claim: "Q3 revenue growth of 28% YoY driven by enterprise AI deployments.",
            sourceTitle: "Enterprise Q3 Earnings Report and Financial Overview",
          },
          {
            url: "https://techcrunch.com/2026/08/14/enterprise-observability-market-shift",
            claim: "Market consolidation around unified AI observability stacks.",
            sourceTitle: "TechCrunch: The Shift Toward Unified AI Agent Observability",
          },
        ],
        verifiedFacts: [
          "Enterprise reported 28% YoY growth in latest regulatory filing.",
          "Current platform supports SOC-2 Type II audit certifications.",
        ],
        inferences: [
          "Likely prioritizing enterprise expansion over mid-market churn mitigation.",
        ],
        unknowns: [
          "Exact gross margin impact of unmetered GPU inference tiers.",
        ],
      }, null, 2);
    }

    return `### Executive Briefing\nBased on the verified evidence snapshot, the subject enterprise demonstrates strong enterprise momentum with 28% YoY revenue growth. Critical discussion topics for the upcoming executive meeting include data governance, agent observability, and multi-tenant security architecture.`;
  }
}

export const bifrostClient = new BifrostGatewayClient();
