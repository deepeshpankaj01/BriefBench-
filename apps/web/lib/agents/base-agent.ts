import { EvidenceSourcePayload } from "../evidence/hasher";

export interface AgentTaskRequest {
  taskId: string;
  taskTitle: string;
  objective: string;
  companyName: string;
  meetingContext: {
    participants?: string[];
    date?: string;
    agenda?: string;
    industry?: string;
  };
  requirements: {
    requiredSections?: string[];
    maxTokens?: number;
    requireCitations?: boolean;
    distinguishFactsAndInferences?: boolean;
  };
  evidenceSnapshot: {
    id: string;
    digest: string;
    totalSources: number;
    sources: EvidenceSourcePayload[];
  };
  executionLimits: {
    timeoutMs: number;
    maxSteps: number;
    maxRetries: number;
  };
  faultInjection?: {
    faultCode: string;
    triggerStep: string;
  };
}

export interface AgentResearchBriefing {
  executiveSummary: string;
  companyOverview: string;
  recentDevelopments: string[];
  industryContext: string;
  competitorLandscape: Array<{ name: string; differentiation: string }>;
  businessOpportunities: string[];
  potentialRisks: string[];
  importantQuestionsToAsk: string[];
  citations: Array<{
    url: string;
    claim: string;
    sourceTitle: string;
  }>;
  verifiedFacts: string[];
  inferences: string[];
  unknowns: string[];
}

export interface AgentTraceStep {
  stepNumber: number;
  eventType:
    | "TASK_RECEIVED"
    | "EVIDENCE_LOADED"
    | "PLANNING_START"
    | "PLANNING_DONE"
    | "MODEL_REQUEST"
    | "MODEL_RESPONSE"
    | "TOOL_CALLED"
    | "TOOL_RETURNED"
    | "RETRY_ATTEMPT"
    | "VALIDATION_PASS"
    | "VALIDATION_FAIL"
    | "RUN_COMPLETED"
    | "FAULT_INJECTED";
  name: string;
  inputPayload?: unknown;
  outputPayload?: unknown;
  durationMs: number;
  tokenUsage?: number;
  status: "SUCCESS" | "ERROR" | "RETRY" | "SKIPPED";
  errorDetails?: string;
  timestamp: string;
}

export interface AgentTaskResponse {
  agentName: string;
  framework: "NATIVE_TS" | "LANGGRAPH_PYTHON" | "HTTP_CUSTOM";
  version: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  durationMs: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number | null;
  toolCallCount: number;
  retryCount: number;
  report: AgentResearchBriefing | null;
  traces: AgentTraceStep[];
  errorMessage?: string;
  isSimulated: boolean;
}

export interface BaseAgent {
  name: string;
  framework: "NATIVE_TS" | "LANGGRAPH_PYTHON" | "HTTP_CUSTOM";
  version: string;
  execute(request: AgentTaskRequest): Promise<AgentTaskResponse>;
}
