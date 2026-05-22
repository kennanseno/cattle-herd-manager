import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { writeCSV, writeSettings } from "@/lib/csv";
import type { Cattle, BreedingRecord, HealthRecord, FinanceRecord, FarmSettings } from "@/types";

const IMAGES_DIR = path.join(process.cwd(), "data", "images");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);

    // Extract data.json
    const dataEntry = zip.getEntry("data.json");
    if (!dataEntry) {
      return NextResponse.json({ error: "Invalid backup — missing data.json" }, { status: 400 });
    }
    const body = JSON.parse(dataEntry.getData().toString("utf-8"));

    if (!body || body.version !== "1") {
      return NextResponse.json({ error: "Invalid backup file — make sure it was exported from this app." }, { status: 400 });
    }

    // Restore data files (always reset all categories)
    writeCSV<Cattle>("cattle.csv", Array.isArray(body.cattle) ? body.cattle : []);
    writeCSV<BreedingRecord>("breeding.csv", Array.isArray(body.breeding) ? body.breeding : []);
    writeCSV<HealthRecord>("health.csv", Array.isArray(body.health) ? body.health : []);
    writeCSV<FinanceRecord>("finances.csv", Array.isArray(body.finances) ? body.finances : []);
    if (body.settings && typeof body.settings === "object") {
      writeSettings<FarmSettings>("settings.json", body.settings);
    }

    // Restore images
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    for (const entry of zip.getEntries()) {
      if (entry.entryName.startsWith("images/") && !entry.isDirectory) {
        const filename = path.basename(entry.entryName);
        if (filename) {
          fs.writeFileSync(path.join(IMAGES_DIR, filename), entry.getData());
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
