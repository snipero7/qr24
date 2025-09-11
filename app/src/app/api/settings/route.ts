import { NextRequest } from "next/server";
import { getAuthSession } from "@/server/auth";
import { getSettings, updateSettings } from "@/server/settings";

export async function GET() {
  const auth = await getAuthSession();
  if (!auth) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const s = await getSettings();
  return Response.json(s);
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthSession();
  if (!auth) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  const s = await updateSettings(body);
  return Response.json(s);
}

