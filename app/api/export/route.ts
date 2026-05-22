import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { getAllCattle, getAllBreeding, getAllHealth, getAllFinances, getSettings } from "@/lib/data";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET() {
  try {
    const bundle = {
      version: "1",
      exportedAt: new Date().toISOString(),
      settings: getSettings(),
      cattle: getAllCattle(),
      breeding: getAllBreeding(),
      health: getAllHealth(),
      finances: getAllFinances(),
    };

    const zip = new AdmZip();

    // Add structured data
    zip.addFile("data.json", Buffer.from(JSON.stringify(bundle, null, 2), "utf-8"));

    // Add images
    const imagesDir = path.join(DATA_DIR, "images");
    if (fs.existsSync(imagesDir)) {
      for (const file of fs.readdirSync(imagesDir)) {
        const filePath = path.join(imagesDir, file);
        if (fs.statSync(filePath).isFile()) {
          zip.addFile(`images/${file}`, fs.readFileSync(filePath));
        }
      }
    }

    const zipBuffer = zip.toBuffer();
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="cattle-herd-backup-${date}.zip"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
