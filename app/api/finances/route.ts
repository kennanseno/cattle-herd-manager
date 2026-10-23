import { NextResponse } from "next/server";
import { getAllFinances, createFinance } from "@/lib/data";
import { z } from "zod";

const financeSchema = z.object({
  date: z.iso.date("Enter a valid transaction date."),
  dateTo: z.union([z.iso.date(), z.literal("")]).optional(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1, "Choose a transaction category."),
  amount: z.coerce.number().finite("Enter a valid amount.").positive("Amount must be greater than zero."),
  description: z.string().trim().min(1, "Enter a transaction description."),
  notes: z.string().optional().default(""),
  relatedTagNumber: z.string().optional().default(""),
}).refine(
  (record) => !record.dateTo || record.dateTo >= record.date,
  { message: "End date must be on or after the start date.", path: ["dateTo"] },
);

export async function GET() {
  try {
    return NextResponse.json(await getAllFinances());
  } catch (error) {
    console.error("GET /api/finances failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load finance records." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must contain valid JSON." }, { status: 400 });
    }

    const parsed = financeSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Check the transaction details and try again." },
        { status: 400 },
      );
    }

    const record = await createFinance({
      ...parsed.data,
      dateTo: parsed.data.dateTo || undefined,
      amount: String(parsed.data.amount),
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/finances failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the transaction." },
      { status: 500 },
    );
  }
}
