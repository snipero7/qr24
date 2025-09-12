import { prisma } from "@/server/db";
import { getSettings } from "@/server/settings";
import { getRedis } from "@/server/redis";
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

// Check schedule and run at the configured weekday/hour in Asia/Riyadh (UTC+3)
export async function maybeRunScheduledBackup(now: Date = new Date()) {
  const s = await getSettings();
  if (!s.backupAutoEnabled) return { skipped: true, reason: "disabled" } as any;
  // Convert to KSA time (UTC+3, no DST)
  const ksa = new Date(now.getTime() + 3 * 3600 * 1000);
  const weekday = ksa.getUTCDay();
  const hour = ksa.getUTCHours();
  if (weekday !== s.backupWeekday || hour !== s.backupHour) return { skipped: true, reason: "schedule_mismatch" } as any;
  // Prevent duplicate within the same hour using Redis NX key
  const key = `backup:lock:${ksa.getUTCFullYear()}-${ksa.getUTCMonth() + 1}-${ksa.getUTCDate()}-${hour}`;
  try {
    const redis = getRedis() as any;
    const set = await redis.set(key, "1", "NX", "EX", 3600);
    if (set !== "OK") return { skipped: true, reason: "locked" } as any;
  } catch (e) {
    // If Redis unavailable, continue but still run once per request
  }
  const res = await createBackupNow();
  return { skipped: false, ...res } as any;
}
