import { NextRequest } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { saveUpload } from "@/server/storage";

function extForType(t: string) {
  if (t.includes("png")) return ".png";
  if (t.includes("jpeg")) return ".jpg";
  if (t.includes("jpg")) return ".jpg";
  if (t.includes("svg")) return ".svg";
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as any as File | null;
    if (!file) return Response.json({ code: "NO_FILE" }, { status: 400 });
    const type = (file as any).type || "application/octet-stream";
    if (!/(png|jpeg|jpg|svg)/i.test(type)) {
      return Response.json({ code: "UNSUPPORTED_TYPE" }, { status: 400 });
    }
    const ab = await (file as any).arrayBuffer();
    const buf = Buffer.from(ab);
    const hash = crypto.createHash("sha1").update(buf).digest("hex");
    const filename = `${Date.now()}_${hash.slice(0, 8)}${extForType(type)}`;
    const key = path.posix.join("uploads", filename);
    const url = await saveUpload(buf, key, type);
    return Response.json({ url });
  } catch (e: any) {
    return Response.json({ code: "UPLOAD_FAILED", message: e?.message || "failed" }, { status: 500 });
  }
}

