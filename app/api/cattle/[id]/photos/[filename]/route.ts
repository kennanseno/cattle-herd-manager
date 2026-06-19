import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllCattle, updateCattle } from "@/lib/data";

const IMAGES_DIR = path.join(process.cwd(), "data", "images");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id: rawId, filename: rawFilename } = await params;
    const tagNumber = decodeURIComponent(rawId);
    // Prevent path traversal — only use the basename
    const filename = path.basename(decodeURIComponent(rawFilename));

    if (!filename || filename.includes("..") || /[/\\]/.test(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const allCattle = getAllCattle();
    const cattle = allCattle.find((c) => c.tagNumber === tagNumber);
    if (!cattle) return NextResponse.json({ error: "Cattle not found" }, { status: 404 });

    const photoPath = `data/images/${filename}`;
    const remaining = (cattle.photos || "")
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p && p !== photoPath);

    updateCattle(tagNumber, { photos: remaining.join(",") });

    // Delete the file from disk
    const filepath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
