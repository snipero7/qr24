import { prisma } from "@/server/db";
import { getSettings } from "@/server/settings";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

function slugify(input: string) {
  return input
    .toString()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-+/g, "-")
    .toLowerCase();
}

export async function createBackupNow() {
  const s = await getSettings();
  const store = slugify(s.storeName || "store");
  const ts = new Date();
  const stamp = ts.toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${store}-${stamp}.json.gz`;
  const dir = path.join(process.cwd(), "public", "backups", store);
  await fs.mkdir(dir, { recursive: true });

  // Collect data
  const [orders, debts, payments] = await Promise.all([
    prisma.order.findMany({ include: { customer: true, statusLogs: true } }),
    prisma.debt.findMany({ include: { payments: true } }),
    prisma.debtPayment.findMany(),
  ]);
  const payload = { meta: { storeName: s.storeName, createdAt: ts.toISOString() }, orders, debts, payments };
  const json = Buffer.from(JSON.stringify(payload));
  const gz = zlib.gzipSync(json);
  const localPath = path.join(dir, fileName);
  await fs.writeFile(localPath, gz);

  const fileUrl = `/backups/${store}/${fileName}`;
  const log = await prisma.backupLog.create({ data: { fileName, fileUrl, status: "SUCCESS" } });
  return { fileUrl, log };
}

export async function listBackups(limit = 10) {
  return prisma.backupLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

