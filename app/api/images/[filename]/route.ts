import { NextResponse } from "next/server";
import path from "path";
import { storage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent path traversal
    const sanitized = path.basename(filename);

    const image = await storage.getImage(sanitized);
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}
