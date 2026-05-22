import { NextResponse } from "next/server";
import { getAllFinances, createFinance } from "@/lib/data";
import type { FinanceRecord } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(getAllFinances());
  } catch {
    return NextResponse.json({ error: "Failed to fetch finance records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<FinanceRecord, "id" | "createdAt" | "updatedAt">;
    if (!body.date || !body.type || !body.amount || !body.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const record = createFinance(body);
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create finance record" }, { status: 500 });
  }
}
