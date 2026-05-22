import { NextResponse } from "next/server";
import { getCattleByTag, updateCattle, softDeleteCattle, getAllCattle } from "@/lib/data";
import type { Cattle } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cattle = getCattleByTag(id);
    if (!cattle) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(cattle);
  } catch {
    return NextResponse.json({ error: "Failed to fetch cattle" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<Cattle>;

    // If changing tag number, check uniqueness
    if (body.tagNumber && body.tagNumber !== id) {
      const all = getAllCattle();
      if (all.some((c) => c.tagNumber === body.tagNumber && c.tagNumber !== id)) {
        return NextResponse.json({ error: "Tag number already exists" }, { status: 409 });
      }
    }

    const updated = updateCattle(id, body);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update cattle" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = softDeleteCattle(id);
    if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete cattle" }, { status: 500 });
  }
}
