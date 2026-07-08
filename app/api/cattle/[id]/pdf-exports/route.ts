import { NextResponse } from "next/server";
import { getCattleByTag, getPdfExportsByTag, recordPdfExport } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exports = await getPdfExportsByTag(id);
    return NextResponse.json(exports);
  } catch {
    return NextResponse.json({ error: "Failed to fetch PDF export history" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cattle = await getCattleByTag(id);
    if (!cattle) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json() as { id?: string; generatedAt?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Missing certificate id" }, { status: 400 });
    }

    const record = await recordPdfExport({
      id: body.id,
      tagNumber: id,
      generatedAt: body.generatedAt,
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record PDF export" }, { status: 500 });
  }
}
