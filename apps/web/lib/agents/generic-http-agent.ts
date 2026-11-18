import { BaseAgent, AgentTaskRequest, AgentTaskResponse, AgentTraceStep } from "./base-agent";

/**
 * Generic HTTP Agent Adapter
 * Connects arbitrary third-party agent frameworks (CrewAI, AutoGen, custom microservices)
 * using the BriefBench Versioned JSON Agent Contract.
 */
export class GenericHttpAgentAdapter implements BaseAgent {
  public name: string;
  public framework: "HTTP_CUSTOM" = "HTTP_CUSTOM";
  public version: string;
  private endpointUrl: string;

  constructor(name: string, endpointUrl: string, version: string = "1.0.0") {
    this.name = name;
    this.endpointUrl = endpointUrl;
    this.version = version;
  }

  async execute(request: AgentTaskRequest): Promise<AgentTaskResponse> {
    const startTime = Date.now();
    const traces: AgentTraceStep[] = [];

    traces.push({
      stepNumber: 1,
      eventType: "TASK_RECEIVED",
      name: "Dispatch to External HTTP Agent Adapter",
      status: "SUCCESS",
      inputPayload: {
        endpoint: this.endpointUrl,
        taskId: request.taskId,
      },
      durationMs: 10,
      timestamp: new Date().toISOString(),
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.executionLimits.timeoutMs || 30000);

      const response = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BriefBench-Version": "1.0.0",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP Agent responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const totalDuration = Date.now() - startTime;

      traces.push({
        stepNumber: 2,
        eventType: "RUN_COMPLETED",
        name: "External HTTP Agent Completed",
        status: "SUCCESS",
        outputPayload: {
          durationMs: totalDuration,
          tokens: data.totalTokens,
        },
        durationMs: totalDuration,
        timestamp: new Date().toISOString(),
      });

      return {
        agentName: this.name,
        framework: "HTTP_CUSTOM",
        version: this.version,
        status: data.status || "SUCCESS",
        durationMs: totalDuration,
        totalTokens: data.totalTokens ?? 1000,
        promptTokens: data.promptTokens ?? 500,
        completionTokens: data.completionTokens ?? 500,
        estimatedCostUsd: data.estimatedCostUsd ?? null,
        toolCallCount: data.toolCallCount ?? 1,
        retryCount: data.retryCount ?? 0,
        report: data.report || null,
        traces: [...traces, ...(data.traces || [])],
        isSimulated: false,
      };
    } catch (err: unknown) {
      const totalDuration = Date.now() - startTime;
      const errorMsg = (err as Error).message || "HTTP Agent request failed";

      traces.push({
        stepNumber: 2,
        eventType: "RUN_COMPLETED",
        name: "External HTTP Agent Failed",
        status: "ERROR",
        errorDetails: errorMsg,
        durationMs: totalDuration,
        timestamp: new Date().toISOString(),
      });

      return {
        agentName: this.name,
        framework: "HTTP_CUSTOM",
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
        traces,
        errorMessage: errorMsg,
        isSimulated: false,
      };
    }
  }
}
