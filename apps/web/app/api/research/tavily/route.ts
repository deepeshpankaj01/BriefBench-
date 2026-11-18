import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { tavilyService } from "@/lib/tavily";
import { calculateEvidenceDigest } from "@/lib/evidence/hasher";
import { bifrostClient } from "@/lib/bifrost";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      meetingParticipants,
      meetingPurpose,
      meetingDate,
      researchObjectives,
      competitors,
      industry,
      importantQuestions,
    } = body;

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json({ success: false, error: "Company name is required." }, { status: 400 });
    }

    // 1. Execute Tavily Search & Extract
    const researchResult = await tavilyService.conductMeetingResearch({
      companyName: companyName.trim(),
      meetingPurpose,
      researchObjectives: Array.isArray(researchObjectives) ? researchObjectives : [researchObjectives].filter(Boolean),
      competitors: Array.isArray(competitors) ? competitors : [competitors].filter(Boolean),
      industry,
      keyQuestions: Array.isArray(importantQuestions) ? importantQuestions : [importantQuestions].filter(Boolean),
    });

    const sources = researchResult.sources;
    if (sources.length === 0) {
      return NextResponse.json({ success: false, error: "Tavily returned no verifiable sources." }, { status: 422 });
    }

    // 2. Compute Deterministic SHA-256 Evidence Digest
    const digest = calculateEvidenceDigest(sources);

    // 3. Find or Create Demo Workspace
    let workspace = await prisma.workspace.findFirst({ where: { slug: "demo-workspace" } });
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: { name: "Default Engineering Workspace", slug: "demo-workspace", isDemo: true },
      });
    }

    // 4. Find or Create Suite
    let suite = await prisma.benchmarkSuite.findFirst({ where: { workspaceId: workspace.id } });
    if (!suite) {
      suite = await prisma.benchmarkSuite.create({
        data: {
          workspaceId: workspace.id,
          name: "Executive Meeting Intelligence Suite",
          description: "Production meeting research tasks and evidence packages.",
          category: "MEETING_RESEARCH",
        },
      });
    }

    // 5. Create BenchmarkTask & Frozen EvidenceSnapshot in DB
    const meetingContext = {
      participants: meetingParticipants || [],
      date: meetingDate || new Date().toISOString().split("T")[0],
      purpose: meetingPurpose || "Strategic partnership & executive review",
      industry: industry || "Technology / Enterprise Software",
      competitors: competitors || [],
      keyQuestions: importantQuestions || [],
    };

    const task = await prisma.benchmarkTask.create({
      data: {
        suiteId: suite.id,
        title: `${companyName.trim()} Executive Meeting Briefing Task`,
        objective: `Analyze ${companyName.trim()} strategic positioning, market landscape, and recent developments for upcoming executive review.`,
        companyName: companyName.trim(),
        meetingContext: JSON.stringify(meetingContext),
        requirements: JSON.stringify({
          requiredSections: [
            "executiveSummary",
            "companyOverview",
            "recentDevelopments",
            "industryContext",
            "competitorLandscape",
            "businessOpportunities",
            "potentialRisks",
            "importantQuestionsToAsk",
            "citations",
          ],
          requireCitations: true,
          distinguishFactsAndInferences: true,
        }),
      },
    });

    const snapshot = await prisma.evidenceSnapshot.create({
      data: {
        taskId: task.id,
        digest,
        title: `${companyName.trim()} Frozen Ground-Truth Evidence Packet`,
        description: `Frozen snapshot containing ${sources.length} sources extracted via Tavily. Cryptographic digest SHA-256: ${digest}.`,
        isFrozen: true,
        version: 1,
        totalSources: sources.length,
        sources: {
          create: sources.map((s) => ({
            url: s.url,
            title: s.title,
            excerpt: s.excerpt,
            fullContent: s.fullContent || s.excerpt,
            domain: s.domain || "web",
            publishedAt: s.publishedAt,
            metadata: s.metadata ? JSON.stringify(s.metadata) : null,
          })),
        },
      },
      include: { sources: true },
    });

    // 6. Generate Grounded Meeting Briefing via Bifrost Gateway
    const systemPrompt = `You are BriefBench Lead Intelligence Researcher.
Rely ONLY on the provided verified sources. Never hallucinate claims.
Provide citations for every claim with exact URLs.
Output strictly valid JSON with keys:
executiveSummary, companyOverview, recentDevelopments, industryContext, competitorLandscape, businessOpportunities, potentialRisks, importantQuestionsToAsk, citations, verifiedFacts, inferences, unknowns.`;

    const userPrompt = `TARGET: ${companyName}
MEETING CONTEXT: ${JSON.stringify(meetingContext)}
VERIFIED SOURCES (${sources.length}):
${sources.map((s, i) => `[${i + 1}] (${s.url}) ${s.title}: ${s.excerpt}`).join("\n\n")}`;

    const completion = await bifrostClient.createChatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    let briefing;
    try {
      briefing = JSON.parse(completion.content);
    } catch {
      briefing = {
        executiveSummary: completion.content,
        citations: sources.map((s) => ({ url: s.url, claim: s.title, sourceTitle: s.title })),
        verifiedFacts: [],
        inferences: [],
        unknowns: [],
      };
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      snapshotId: snapshot.id,
      digest,
      totalSources: sources.length,
      isSimulated: researchResult.isSimulated,
      sources,
      briefing,
    });
  } catch (err: unknown) {
    console.error("[API Tavily Research Error]:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
