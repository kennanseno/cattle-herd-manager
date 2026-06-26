import { NextResponse } from "next/server";
import { getAllCattle, createCattle, autoCreateBreedingForCalf } from "@/lib/data";
import type { Cattle } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const all = await getAllCattle();
    const cattle = includeArchived ? all : all.filter((c) => c.status !== "archived");
    return NextResponse.json(cattle);
  } catch {
    return NextResponse.json({ error: "Failed to fetch cattle" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<Cattle, "createdAt" | "updatedAt">;

    if (!body.tagNumber || !body.dateOfBirth || !body.sex || !body.breed) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check tag uniqueness
    const existing = await getAllCattle();
    if (existing.some((c) => c.tagNumber === body.tagNumber)) {
      return NextResponse.json({ error: "Tag number already exists" }, { status: 409 });
    }

    const cattle = await createCattle(body);

    // Auto-create breeding record if dam is known
    if (cattle.damTagNumber) {
      await autoCreateBreedingForCalf(cattle);
    }

    return NextResponse.json(cattle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create cattle" }, { status: 500 });
  }
}
