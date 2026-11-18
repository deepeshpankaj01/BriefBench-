import { BaseAgent, AgentTaskRequest, AgentTaskResponse, AgentTraceStep, AgentResearchBriefing } from "./base-agent";
import { bifrostClient } from "../bifrost";
import { FaultInjector, FaultCode } from "../failure/fault-injector";

export interface LangGraphHealthStatus {
  status: string;
  service: string;
  isAvailable: boolean;
  endpoint: string;
  latencyMs: number;
  error?: string;
}

/**
 * LangGraph Agent Client
 * Communicates with the Python LangGraph FastAPI microservice via Vercel service binding / REST contract.
 * URL is injected via LANGGRAPH_AGENT_URL environment variable.
 */
export class LangGraphAgentClient implements BaseAgent {
  public name = "BriefBench LangGraph Research Agent";
  public framework: "LANGGRAPH_PYTHON" = "LANGGRAPH_PYTHON";
  public version = "2.1.0";

  /**
   * Robust URL construction ensuring clean protocol and no trailing slashes.
   */
  public getBaseUrl(): string {
    let raw = process.env.LANGGRAPH_AGENT_URL || "http://127.0.0.1:8000";
    raw = raw.trim();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `http://${raw}`;
    }
    return raw.replace(/\/+$/, "");
  }

  /**
   * Health check for GET /health on the Python FastAPI microservice.
   */
  async checkHealth(): Promise<LangGraphHealthStatus> {
    const start = Date.now();
    const baseUrl = this.getBaseUrl();
    const endpoint = `${baseUrl}/health`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(endpoint, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || "healthy",
          service: data.service || "briefbench-langgraph-agent",
          isAvailable: true,
          endpoint,
          latencyMs,
        };
      }

      return {
        status: `HTTP_${res.status}`,
        service: "briefbench-langgraph-agent",
        isAvailable: false,
        endpoint,
        latencyMs,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: unknown) {
      return {
        status: "UNAVAILABLE",
        service: "briefbench-langgraph-agent",
        isAvailable: false,
        endpoint,
        latencyMs: Date.now() - start,
        error: (err as Error).message || "Connection refused",
      };
    }
  }

  async execute(request: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();
    const baseUrl = this.getBaseUrl();
    const targetEndpoint = `${baseUrl}/agent/run`;
    const isProduction = process.env.NODE_ENV === "production";

    // 1. Attempt to call real Python FastAPI LangGraph service
    let pythonError: string | null = null;
    try {
      const controller = new AbortController();
      const timeoutMs = request.executionLimits?.timeoutMs || 30000;
      const timeoutId = setTimeout(() => controller.abort(), Math.min(timeoutMs, 15000));

      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BriefBench-Client": "NextJS-Service-Binding",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          framework: "LANGGRAPH_PYTHON",
          agentName: this.name,
          isSimulated: false,
        };
      } else {
        const errorText = await res.text().catch(() => "");
        pythonError = `LangGraph service at ${targetEndpoint} returned HTTP ${res.status}: ${errorText || res.statusText}`;
      }
    } catch (err: unknown) {
      pythonError = `Failed to connect to LangGraph service at ${targetEndpoint}: ${(err as Error).message}`;
    }

    // 2. Strict Production Guard: Do NOT silently emulate in production!
    if (isProduction) {
      const totalDuration = Date.now() - startTime;
      const errorMsg = pythonError || `LangGraph service is unreachable at ${targetEndpoint}`;

      const failureTrace: AgentTraceStep = {
        stepNumber: 1,
        eventType: "TASK_RECEIVED",
        name: "LangGraph Service Dispatch Failed",
        status: "ERROR",
        errorDetails: errorMsg,
        durationMs: totalDuration,
        timestamp: new Date().toISOString(),
      };

      return {
        agentName: this.name,
        framework: this.framework,
        version: this.version,
        status: "FAILED",
        durationMs: totalDuration,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: null,
        toolCallCount: 0,
        retryCount: 0,
        report: null,
        traces: [failureTrace],
        errorMessage: errorMsg,
        isSimulated: false,
      };
    }

    // 3. Local Development Demo Emulation (Non-Production Only)
    // Follows the exact state machine nodes and explicitly flags isSimulated: true
    const traces: AgentTraceStep[] = [];
    let stepNumber = 1;
    let retryCount = 0;
    const toolCallCount = 2;

    const addTrace = (
      eventType: AgentTraceStep["eventType"],
      name: string,
      status: AgentTraceStep["status"],
      inputPayload?: unknown,
      outputPayload?: unknown,
      errorDetails?: string,
      durationMs: number = 35
    ) => {
      traces.push({
        stepNumber: stepNumber++,
        eventType,
        name,
        status,
        inputPayload,
        outputPayload,
        errorDetails,
        durationMs,
        timestamp: new Date().toISOString(),
      });
    };

    try {
      // Node 1: Task Input
      addTrace("TASK_RECEIVED", "LangGraph StateGraph Initialized (Local Emulation)", "SUCCESS", {
        workflow: "BriefBenchMeetingResearchGraph",
        stateSchema: "ResearchState(task, evidence, plan, draft, review)",
        note: `Python microservice not reachable at ${targetEndpoint}; local emulation active for development`,
      });

      // Node 2: Planning Node
      addTrace("PLANNING_START", "Graph Node: planning_node", "SUCCESS", {
        company: request.companyName,
        agenda: request.meetingContext?.agenda,
      }, {
        graphStep: 1,
        activeNode: "planning_node",
        plan: "Structured meeting packet synthesis with section-level source constraints",
      }, undefined, 45);

      // Node 3: Evidence Analysis Node
      if (request.faultInjection && FaultInjector.shouldInject(request.faultInjection.faultCode, "TOOL_CALLED")) {
        const fault = FaultInjector.applyFault(request.faultInjection.faultCode as FaultCode);
        addTrace("FAULT_INJECTED", `LangGraph State Exception: ${request.faultInjection.faultCode}`, "ERROR", undefined, undefined, fault.error.message);
        retryCount++;
        addTrace("RETRY_ATTEMPT", "Graph Node: state_recovery_node", "RETRY", {
          resiliencePolicy: "LANGGRAPH_CONDITIONAL_EDGE_RECOVERY",
          attempt: 1,
        });
      }

      addTrace("TOOL_CALLED", "Graph Node: evidence_analysis_node", "SUCCESS", {
        sourcesCount: request.evidenceSnapshot.sources.length,
        digest: request.evidenceSnapshot.digest,
      }, {
        extractedEntities: [request.companyName, "Competitors", "Financials", "Executive Strategy"],
      }, undefined, 65);

      // Node 4: Synthesis Node (Bifrost Gateway)
      addTrace("MODEL_REQUEST", "Graph Node: synthesis_node (Bifrost Gateway)", "SUCCESS", {
        gateway: "Bifrost (Maxim AI)",
        model: "gpt-4o",
      });

      if (request.faultInjection && FaultInjector.shouldInject(request.faultInjection.faultCode, "MODEL_REQUEST")) {
        const fault = FaultInjector.applyFault(request.faultInjection.faultCode as FaultCode);
        addTrace("FAULT_INJECTED", `Bifrost Error in synthesis_node: ${request.faultInjection.faultCode}`, "ERROR", undefined, undefined, fault.error.message);
        if (request.faultInjection.faultCode === "RETRY_EXHAUSTION") {
          throw fault.error;
        }
        retryCount++;
        addTrace("RETRY_ATTEMPT", "LangGraph Conditional Retry Edge", "RETRY", {
          retryTarget: "synthesis_node",
        });
      }

      const completion = await bifrostClient.createChatCompletion({
        messages: [
          {
            role: "system",
            content: "You are the BriefBench LangGraph Research Agent. Generate a rigorous JSON research brief based only on the evidence.",
          },
          {
            role: "user",
            content: `Analyze enterprise: ${request.companyName}. Evidence sources: ${JSON.stringify(request.evidenceSnapshot.sources)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      addTrace("MODEL_RESPONSE", "Graph Node: synthesis_node Complete", "SUCCESS", undefined, {
        tokens: completion.totalTokens,
        duration: completion.durationMs,
      }, undefined, completion.durationMs);

      // Node 5: Validation Node
      let parsedReport: AgentResearchBriefing;
      try {
        parsedReport = JSON.parse(completion.content) as AgentResearchBriefing;
      } catch (e) {
        throw new Error(`LangGraph validation_node parse failure: ${(e as Error).message}`);
      }

      addTrace("VALIDATION_PASS", "Graph Node: validation_node", "SUCCESS", {
        rubricChecks: ["citation_density", "unsupported_claims", "hallucination_boundary"],
      }, {
        result: "CONDITIONAL_EDGE_ROUTED_TO_END",
      }, undefined, 30);

      const totalDuration = Date.now() - startTime;
      addTrace("RUN_COMPLETED", "LangGraph StateGraph Terminated Successfully", "SUCCESS");

      return {
        agentName: this.name,
        framework: this.framework,
        version: this.version,
        status: "SUCCESS",
        durationMs: totalDuration,
        totalTokens: completion.totalTokens ?? 1150,
        promptTokens: completion.promptTokens ?? 580,
        completionTokens: completion.completionTokens ?? 570,
        estimatedCostUsd: completion.estimatedCostUsd ?? 0.0055,
        toolCallCount,
        retryCount,
        report: parsedReport,
        traces,
        isSimulated: true, // Explicitly marked as simulated in fallback
      };
    } catch (err: unknown) {
      const totalDuration = Date.now() - startTime;
      const errorMsg = (err as Error).message || "LangGraph run failed";

      addTrace("RUN_COMPLETED", "LangGraph StateGraph Terminated with Error", "ERROR", undefined, undefined, errorMsg);

      return {
        agentName: this.name,
        framework: this.framework,
        version: this.version,
        status: "FAILED",
        durationMs: totalDuration,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: null,
        toolCallCount,
        retryCount,
        report: null,
        traces,
        errorMessage: errorMsg,
        isSimulated: true,
      };
    }
  }
}

export const langgraphAgentClient = new LangGraphAgentClient();
