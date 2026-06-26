import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { getAllCattle, getAllBreeding, getAllHealth, getAllFinances, getSettings } from "@/lib/data";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const [settings, cattle, breeding, health, finances] = await Promise.all([
      getSettings(),
      getAllCattle(),
      getAllBreeding(),
      getAllHealth(),
      getAllFinances(),
    ]);

    const bundle = {
      version: "1",
      exportedAt: new Date().toISOString(),
      settings,
      cattle,
      breeding,
      health,
      finances,
    };

    const zip = new AdmZip();

    // Add structured data
    zip.addFile("data.json", Buffer.from(JSON.stringify(bundle, null, 2), "utf-8"));

    // Add images from storage
    const imageNames = await storage.listImages();
    for (const name of imageNames) {
      const image = await storage.getImage(name);
      if (image) zip.addFile(`images/${name}`, image.data);
    }

    const zipBuffer = zip.toBuffer();
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(zipBuffer), {
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
