import { getAuthSession } from "@/server/auth";
import { createBackupNow } from "@/server/backup";

export async function POST() {
  const auth = await getAuthSession();
  if (!auth) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const res = await createBackupNow();
    return Response.json(res);
  } catch (e: any) {
    return Response.json({ code: "BACKUP_FAILED", message: e?.message || "فشل النسخ" }, { status: 500 });
  }
}

