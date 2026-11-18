import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyEvidenceDigest } from "@/lib/evidence/hasher";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const snapshot = await prisma.evidenceSnapshot.findUnique({
        where: { id },
        include: {
          task: true,
          sources: true,
        },
      });

      if (!snapshot) {
        return NextResponse.json({ success: false, error: "Snapshot not found" }, { status: 404 });
      }

      const isDigestVerified = verifyEvidenceDigest(
        snapshot.sources.map((s) => ({
          url: s.url,
          title: s.title,
          excerpt: s.excerpt,
          fullContent: s.fullContent,
        })),
        snapshot.digest
      );

      return NextResponse.json({
        success: true,
        snapshot: {
          ...snapshot,
          isDigestVerified,
        },
      });
    }

    const snapshots = await prisma.evidenceSnapshot.findMany({
      include: {
        task: true,
        _count: {
          select: { sources: true, experiments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      snapshots,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
