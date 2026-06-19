import { NextResponse } from "next/server";
import { getBreedingById, updateBreeding, deleteBreeding } from "@/lib/data";
import type { BreedingRecord } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = getBreedingById(id);
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<BreedingRecord>;
    const updated = updateBreeding(id, body);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = deleteBreeding(id);
    if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
