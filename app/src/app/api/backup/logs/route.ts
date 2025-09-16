import { getAuthSession } from "@/server/auth";
import { listBackups } from "@/server/backup";
import { prisma } from "@/server/db";
import path from "node:path";
import fs from "node:fs/promises";

export async function GET() {
  const auth = await getAuthSession();
  if (!auth) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const rows = await listBackups(10);
  return Response.json(rows);
}

export async function DELETE(req: Request) {
  const auth = await getAuthSession();
  if (!auth || (auth.user as any)?.role !== 'ADMIN') return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ code: 'INVALID_INPUT', message: 'missing id' }, { status: 400 });
  const row = await prisma.backupLog.findUnique({ where: { id } });
  if (!row) return Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  try {
    if (row.fileUrl && row.fileUrl.startsWith('/backups/')) {
      const p = path.join(process.cwd(), 'public', row.fileUrl.replace(/^\//, ''));
      try { await fs.unlink(p); } catch {}
    }
    await prisma.backupLog.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ code: 'SERVER_ERROR', message: e?.message || 'failed' }, { status: 500 });
  }
}
