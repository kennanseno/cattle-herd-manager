import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "data", "images");

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent path traversal
    const sanitized = path.basename(filename);
    const filepath = path.join(IMAGES_DIR, sanitized);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = fs.readFileSync(filepath);
    const ext = sanitized.split(".").pop()?.toLowerCase() || "jpg";
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    const contentType = contentTypeMap[ext] || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}
