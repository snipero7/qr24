import { getAuthSession } from "@/server/auth";
import { listBackups } from "@/server/backup";

export async function GET() {
  const auth = await getAuthSession();
  if (!auth) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const rows = await listBackups(10);
  return Response.json(rows);
}

