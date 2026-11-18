import prisma from "../db";
import { nativeAgent } from "../agents/native-agent";
import { langgraphAgentClient } from "../agents/langgraph-client";
import { GenericHttpAgentAdapter } from "../agents/generic-http-agent";
import { AgentTaskRequest, BaseAgent } from "../agents/base-agent";
import { benchmarkEvaluator } from "./evaluator";

export interface BenchmarkRunOptions {
  experimentId: string;
  agentIds: string[];
  repetitions: number;
  faultCode?: string;
}

export class BenchmarkEngine {
  /**
   * Orchestrates a multi-agent benchmark experiment across repeated executions
   * using a single, immutable, frozen evidence snapshot.
   */
  async runExperiment(options: BenchmarkRunOptions): Promise<void> {
    const experiment = await prisma.benchmarkExperiment.findUnique({
      where: { id: options.experimentId },
      include: {
        task: true,
        snapshot: {
          include: { sources: true },
        },
      },
    });

    if (!experiment) {
      throw new Error(`Experiment ${options.experimentId} not found`);
    }

    // Mark experiment as RUNNING
    await prisma.benchmarkExperiment.update({
      where: { id: options.experimentId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      const agents = await prisma.agent.findMany({
        where: { id: { in: options.agentIds } },
        include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      const sourcesPayload = experiment.snapshot.sources.map((s) => ({
        url: s.url,
        title: s.title,
        excerpt: s.excerpt,
        fullContent: s.fullContent,
        domain: s.domain,
        publishedAt: s.publishedAt || undefined,
      }));

      // Parse JSON contexts safely
      let meetingContext = {};
      try {
        meetingContext = JSON.parse(experiment.task.meetingContext);
      } catch {
        meetingContext = { agenda: experiment.task.meetingContext };
      }

      let requirements = {};
      try {
        requirements = JSON.parse(experiment.task.requirements);
      } catch {
        requirements = { requiredSections: ["executiveSummary", "citations"] };
      }

      // Execute runs across each agent and repetition
      for (const agentRecord of agents) {
        const latestVersion = agentRecord.versions[0] || {
          id: `v-${Date.now()}`,
          version: "1.0.0",
        };

        // Select Agent Driver
        let agentDriver: BaseAgent;
        if (agentRecord.framework === "NATIVE_TS") {
          agentDriver = nativeAgent;
        } else if (agentRecord.framework === "LANGGRAPH_PYTHON") {
          agentDriver = langgraphAgentClient;
        } else {
          agentDriver = new GenericHttpAgentAdapter(
            agentRecord.name,
            agentRecord.endpointUrl || "http://127.0.0.1:8080/agent"
          );
        }

        for (let rep = 1; rep <= options.repetitions; rep++) {
          const runRecord = await prisma.agentRun.create({
            data: {
              experimentId: experiment.id,
              agentId: agentRecord.id,
              agentVersionId: latestVersion.id,
              repetitionIndex: rep,
              status: "RUNNING",
              startedAt: new Date(),
              isDemo: experiment.isDemo,
            },
          });

          const taskRequest: AgentTaskRequest = {
            taskId: experiment.task.id,
            taskTitle: experiment.task.title,
            objective: experiment.task.objective,
            companyName: experiment.task.companyName || "Target Company",
            meetingContext,
            requirements,
            evidenceSnapshot: {
              id: experiment.snapshot.id,
              digest: experiment.snapshot.digest,
              totalSources: experiment.snapshot.totalSources,
              sources: sourcesPayload,
            },
            executionLimits: {
              timeoutMs: 30000,
              maxSteps: 10,
              maxRetries: 2,
            },
            faultInjection: options.faultCode
              ? {
                  faultCode: options.faultCode,
                  triggerStep: "MODEL_REQUEST",
                }
              : undefined,
          };

          const agentResponse = await agentDriver.execute(taskRequest);

          // Evaluate with BenchmarkEvaluator
          const evalResult = await benchmarkEvaluator.evaluate({
            task: taskRequest,
            report: agentResponse.report,
            agentFramework: agentRecord.framework,
            status: agentResponse.status,
          });

          // Save Run Results
          await prisma.agentRun.update({
            where: { id: runRecord.id },
            data: {
              status: agentResponse.status,
              durationMs: agentResponse.durationMs,
              totalTokens: agentResponse.totalTokens,
              promptTokens: agentResponse.promptTokens,
              completionTokens: agentResponse.completionTokens,
              estimatedCostUsd: agentResponse.estimatedCostUsd,
              toolCallCount: agentResponse.toolCallCount,
              retryCount: agentResponse.retryCount,
              outputReport: agentResponse.report ? JSON.stringify(agentResponse.report) : null,
              errorMessage: agentResponse.errorMessage,
              completedAt: new Date(),
            },
          });

          // Save Traces
          if (agentResponse.traces && agentResponse.traces.length > 0) {
            await prisma.traceEvent.createMany({
              data: agentResponse.traces.map((t) => ({
                runId: runRecord.id,
                stepNumber: t.stepNumber,
                eventType: t.eventType,
                name: t.name,
                status: t.status,
                inputPayload: t.inputPayload ? JSON.stringify(t.inputPayload) : null,
                outputPayload: t.outputPayload ? JSON.stringify(t.outputPayload) : null,
                errorDetails: t.errorDetails,
                durationMs: t.durationMs,
                tokenUsage: t.tokenUsage,
                timestamp: new Date(t.timestamp),
              })),
            });
          }

          // Save Evaluation
          await prisma.evaluation.create({
            data: {
              runId: runRecord.id,
              judgeModel: evalResult.judgeModel,
              rubricVersion: evalResult.rubricVersion,
              overallScore: evalResult.overallScore,
              factualAccuracy: evalResult.factualAccuracy,
              evidenceSupport: evalResult.evidenceSupport,
              taskCompletion: evalResult.taskCompletion,
              researchCompleteness: evalResult.researchCompleteness,
              actionability: evalResult.actionability,
              instructionAdherence: evalResult.instructionAdherence,
              outputConsistency: evalResult.outputConsistency,
              reasoning: evalResult.reasoning,
              unsupportedClaims: JSON.stringify(evalResult.unsupportedClaims),
              verifiedCitations: JSON.stringify(evalResult.verifiedCitations),
            },
          });
        }
      }

      // Mark experiment as COMPLETED
      await prisma.benchmarkExperiment.update({
        where: { id: options.experimentId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } catch (err: unknown) {
      console.error("[BenchmarkEngine] Experiment failed:", err);
      await prisma.benchmarkExperiment.update({
        where: { id: options.experimentId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }
}

export const benchmarkEngine = new BenchmarkEngine();
