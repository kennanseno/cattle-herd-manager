import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/data";
import type { FarmSettings } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(getSettings());
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as FarmSettings;
    const saved = saveSettings(body);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
