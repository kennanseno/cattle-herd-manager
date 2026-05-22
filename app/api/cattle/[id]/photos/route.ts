import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getAllCattle, updateCattle } from "@/lib/data";

const IMAGES_DIR = path.join(process.cwd(), "data", "images");
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const tagNumber = decodeURIComponent(rawId);

    const allCattle = getAllCattle();
    const cattle = allCattle.find((c) => c.tagNumber === tagNumber);
    if (!cattle) return NextResponse.json({ error: "Cattle not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF allowed." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)." }, { status: 400 });
    }

    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(await file.arrayBuffer()));

    const photoPath = `data/images/${filename}`;
    const existing = (cattle.photos || "").split(",").map((p) => p.trim()).filter(Boolean);
    existing.push(photoPath);
    updateCattle(tagNumber, { photos: existing.join(",") });

    return NextResponse.json({ path: photoPath, filename });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
