import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import path from "path";
import { storage, isGoogleConfigured } from "@/lib/storage";
import { mimeFromFilename } from "@/lib/storage/types";
import type { Cattle, BreedingRecord, HealthRecord, FinanceRecord, FarmSettings } from "@/types";

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

    // Restore data tables (always reset all categories)
    await storage.writeTable<Cattle>("cattle", Array.isArray(body.cattle) ? body.cattle : []);
    await storage.writeTable<BreedingRecord>("breeding", Array.isArray(body.breeding) ? body.breeding : []);
    await storage.writeTable<HealthRecord>("health", Array.isArray(body.health) ? body.health : []);
    await storage.writeTable<FinanceRecord>("finances", Array.isArray(body.finances) ? body.finances : []);
    if (body.settings && typeof body.settings === "object") {
      await storage.writeSettings<FarmSettings>(body.settings);
    }

    // Restore images (not supported on the Google Sheets backend).
    if (!isGoogleConfigured()) {
      for (const entry of zip.getEntries()) {
        if (entry.entryName.startsWith("images/") && !entry.isDirectory) {
          const filename = path.basename(entry.entryName);
          if (filename) {
            await storage.uploadImage(filename, mimeFromFilename(filename), entry.getData());
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
