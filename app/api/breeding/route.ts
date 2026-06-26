import { NextResponse } from "next/server";
import { getAllBreeding, createBreeding } from "@/lib/data";
import type { BreedingRecord } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getAllBreeding());
  } catch {
    return NextResponse.json({ error: "Failed to fetch breeding records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<BreedingRecord, "id" | "possibleCalvingDate" | "createdAt" | "updatedAt">;
    if (!body.cowTagNumber || !body.breedDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const record = await createBreeding(body);
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create breeding record" }, { status: 500 });
  }
}
