import { tavily } from "@tavily/core";
import { EvidenceSourcePayload } from "./evidence/hasher";

type TavilyClientInstance = ReturnType<typeof tavily>;

export interface TavilyResearchInput {
  companyName: string;
  meetingPurpose?: string;
  researchObjectives?: string[];
  competitors?: string[];
  industry?: string;
  keyQuestions?: string[];
}

export interface TavilyExtractResult {
  url: string;
  rawContent: string;
}

export interface TavilyResearchResult {
  sources: EvidenceSourcePayload[];
  queryCount: number;
  extractedCount: number;
  isSimulated: boolean;
  status: "SUCCESS" | "FAILED" | "SIMULATED";
  searchDurationMs: number;
}

/**
 * Tavily Research & Evidence Preparation Client
 * Uses official @tavily/core SDK for deep search and webpage extraction.
 * Guarantees server-side execution and strict credential hygiene.
 */
export class TavilyResearchService {
  private client: TavilyClientInstance | null = null;
  private currentApiKey: string = "";

  private getApiKey(): string {
    return process.env.TAVILY_API_KEY || "";
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(
      key &&
      key.trim().length > 0 &&
      !key.includes("your_new_tavily_api_key") &&
      !key.includes("placeholder")
    );
  }

  private getClient(): TavilyClientInstance | null {
    const key = this.getApiKey();
    if (!this.isConfigured()) {
      return null;
    }
    // Re-instantiate if key changed in runtime/environment
    if (!this.client || this.currentApiKey !== key) {
      try {
        this.client = tavily({ apiKey: key.trim() });
        this.currentApiKey = key;
      } catch (e) {
        console.error("[TavilyResearchService] Failed to initialize Tavily client:", e);
        this.client = null;
      }
    }
    return this.client;
  }

  public getStatus() {
    const configured = this.isConfigured();
    return {
      isConfigured: configured,
      provider: "Tavily AI Search & Extract API",
      sdkVersion: "@tavily/core",
      status: configured ? "CONNECTED" : "UNCONFIGURED (Demo Fallback Active)",
    };
  }

  /**
   * Official Tavily Search
   */
  async search(query: string, options: { maxResults?: number; searchDepth?: "basic" | "advanced" } = {}) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Tavily API key is not configured in environment.");
    }
    return await client.search(query, {
      searchDepth: options.searchDepth || "advanced",
      includeAnswer: false,
      maxResults: options.maxResults || 4,
    });
  }

  /**
   * Official Tavily Extract
   * Extracts raw markdown / full text from an array of URLs.
   */
  async extract(urls: string[]): Promise<{ results: TavilyExtractResult[]; failedResults: Array<{ url: string; error: string }> }> {
    const client = this.getClient();
    if (!client) {
      throw new Error("Tavily API key is not configured in environment.");
    }
    if (!urls || urls.length === 0) {
      return { results: [], failedResults: [] };
    }
    const response = await client.extract(urls);
    return {
      results: response.results.map((r: { url: string; rawContent: string }) => ({
        url: r.url,
        rawContent: r.rawContent || "",
      })),
      failedResults: response.failedResults || [],
    };
  }

  /**
   * Performs deep meeting research on the target company, competitors, and key objectives.
   * Gathers search results, executes Tavily Extract on top URLs for raw content,
   * and returns clean, structured evidence sources ready for snapshot freezing and SHA-256 hashing.
   */
  async conductMeetingResearch(input: TavilyResearchInput): Promise<TavilyResearchResult> {
    const startTime = Date.now();
    const client = this.getClient();

    if (client && this.isConfigured()) {
      try {
        const queries = [
          `${input.companyName} company overview business model customers`,
          `${input.companyName} recent developments news funding product announcements`,
          input.competitors && input.competitors.length > 0
            ? `${input.companyName} vs ${input.competitors.join(" ")} competitors market comparison`
            : `${input.companyName} market share competitors landscape`,
        ];

        const gatheredSources: EvidenceSourcePayload[] = [];
        const seenUrls = new Set<string>();

        // 1. Tavily Search phase
        for (const query of queries) {
          const response = await client.search(query, {
            searchDepth: "advanced",
            includeAnswer: false,
            maxResults: 3,
          });

          for (const res of response.results) {
            if (!seenUrls.has(res.url)) {
              seenUrls.add(res.url);
              gatheredSources.push({
                url: res.url,
                title: res.title,
                excerpt: res.content,
                fullContent: res.rawContent || res.content,
                domain: new URL(res.url).hostname.replace("www.", ""),
                publishedAt: res.publishedDate || new Date().toISOString(),
                metadata: {
                  score: res.score,
                  matchedQuery: query,
                },
              });
            }
          }
        }

        // 2. Tavily Extract phase (extract raw text for top sources where fullContent is short)
        const urlsToExtract = gatheredSources
          .filter((s) => !s.fullContent || s.fullContent.length < 300)
          .slice(0, 3)
          .map((s) => s.url);

        if (urlsToExtract.length > 0) {
          try {
            const extractResponse = await client.extract(urlsToExtract);
            const extractMap = new Map(extractResponse.results.map((r: { url: string; rawContent: string }) => [r.url, r.rawContent]));
            for (const source of gatheredSources) {
              if (extractMap.has(source.url)) {
                source.fullContent = extractMap.get(source.url) || source.fullContent;
              }
            }
          } catch (extractErr) {
            console.warn("[TavilyResearchService] Tavily Extract non-fatal warning:", extractErr);
          }
        }

        return {
          sources: gatheredSources,
          queryCount: queries.length,
          extractedCount: gatheredSources.length,
          isSimulated: false,
          status: "SUCCESS",
          searchDurationMs: Date.now() - startTime,
        };
      } catch (err: unknown) {
        console.error("[TavilyResearchService] Error executing live Tavily search:", err);
        throw new Error(`Tavily API execution failed: ${(err as Error).message}`);
      }
    }

    // High-fidelity deterministic meeting research packet for DEMO mode
    const demoSources = this.getDeterministicDemoSources(input);
    return {
      sources: demoSources,
      queryCount: 3,
      extractedCount: demoSources.length,
      isSimulated: true,
      status: "SIMULATED",
      searchDurationMs: 460,
    };
  }

  private getDeterministicDemoSources(input: TavilyResearchInput): EvidenceSourcePayload[] {
    const company = input.companyName || "Databricks";
    const compList = input.competitors?.join(", ") || "Snowflake, BigQuery, AWS Redshift";

    return [
      {
        url: `https://www.sec.gov/edgar/data/${encodeURIComponent(company.toLowerCase())}/q3-filing`,
        title: `${company} Enterprise Market Analysis & Financial Performance`,
        domain: "sec.gov",
        publishedAt: "2026-10-15T14:30:00Z",
        excerpt: `${company} demonstrated sustained customer adoption with 32% annual expansion in tier-1 enterprise accounts. Strategic focus centers on unified data lakehouse infrastructure and sovereign AI agent deployments.`,
        fullContent: `${company} reported continued acceleration across international markets, driven by demand for governance-first AI capabilities. The company expanded partnerships across major hyperscalers while maintaining multi-cloud portability. Net revenue retention stood at 134%, with significant uptake in financial services and healthcare sectors.`,
        metadata: { credibilityScore: 0.98, type: "regulatory_filing" },
      },
      {
        url: `https://techcrunch.com/2026/09/20/${encodeURIComponent(company.toLowerCase())}-expands-ai-agent-governance`,
        title: `How ${company} Is Tackling Enterprise AI Agent Reliability and Governance`,
        domain: "techcrunch.com",
        publishedAt: "2026-09-20T09:15:00Z",
        excerpt: `In an exclusive interview, leadership outlined their new unified agent evaluation framework designed to counter non-deterministic model drift and verify grounding citations before deploying to production.`,
        fullContent: `Enterprise CTOs have identified hallucination and lack of verifiable audit trails as the primary impediments to productionizing generative AI agents. ${company} responded by launching integrated tracing and frozen snapshot evaluation capabilities that guarantee repeatable agent benchmarking.`,
        metadata: { credibilityScore: 0.91, type: "industry_journalism" },
      },
      {
        url: `https://www.gartner.com/reviews/market/data-management-ai/${encodeURIComponent(company.toLowerCase())}-vs-competitors`,
        title: `Peer Insights: ${company} vs ${compList} Evaluation Report`,
        domain: "gartner.com",
        publishedAt: "2026-08-30T11:00:00Z",
        excerpt: `Gartner Peer Insights rates ${company} 4.7/5 in core processing speed and scalability, while noting that deployment complexity requires specialized engineering resources compared to simpler alternatives.`,
        fullContent: `Customer feedback highlights superior query optimization and open data formats as top differentiators. However, procurement teams frequently request more granular usage-based cost alerting to prevent unexpected monthly bill surges during heavy iterative benchmarking workloads.`,
        metadata: { credibilityScore: 0.95, type: "analyst_report" },
      },
      {
        url: `https://bloomberg.com/news/articles/2026-11-02/${encodeURIComponent(company.toLowerCase())}-announces-strategic-initiatives`,
        title: `Bloomberg: ${company} Previews Next-Gen Enterprise Automation and Strategic Roadmap`,
        domain: "bloomberg.com",
        publishedAt: "2026-11-02T16:45:00Z",
        excerpt: `Key upcoming initiatives include automated contract intelligence, deterministic benchmark verification, and zero-trust agentic security protocols for Fortune 100 enterprise deployments.`,
        fullContent: `At its annual customer summit, the company unveiled new enterprise-grade safeguards that ensure all automated insights are backed by cryptographic evidence digests. Executives emphasized that enterprise buyers are demanding measurable ROI and strict citation tracing.`,
        metadata: { credibilityScore: 0.94, type: "financial_news" },
      },
    ];
  }
}

export const tavilyService = new TavilyResearchService();
