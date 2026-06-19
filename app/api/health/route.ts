import { NextResponse } from "next/server";
import { getAllHealth, createHealth, createFinance } from "@/lib/data";
import type { HealthRecord } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(getAllHealth());
  } catch {
    return NextResponse.json({ error: "Failed to fetch health records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<HealthRecord, "id" | "createdAt" | "updatedAt">;
    if (!body.recordDate || !body.vaccinationType || !body.tagNumbers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const record = createHealth(body);

    // Auto-create finance expense when a cost is recorded
    const cost = parseFloat(body.cost);
    if (!isNaN(cost) && cost > 0) {
      const tagLabel = body.tagNumbers === "ALL" ? "All Cattle" : body.tagNumbers;
      const firstTag = body.tagNumbers === "ALL" ? "" : body.tagNumbers.split(",")[0].trim();
      createFinance({
        type: "expense",
        date: body.recordDate,
        category: "Veterinary",
        amount: String(cost),
        description: `${body.vaccinationType} – ${tagLabel}`,
        notes: body.notes || "",
        relatedTagNumber: firstTag,
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create health record" }, { status: 500 });
  }
}
