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

  let fileUrl = `/backups/${store}/${fileName}`;
  try {
    if ((s as any).gdriveAccessToken && (s as any).gdriveRefreshToken) {
      const token = await ensureDriveToken(s as any);
      const fileId = await uploadToDrive(token, fileName, gz);
      if (fileId) fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
    }
  } catch {}

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

async function ensureDriveToken(s: any): Promise<string> {
  const now = Date.now();
  if (s.gdriveExpiry && new Date(s.gdriveExpiry).getTime() > now + 60_000) {
    return s.gdriveAccessToken as string;
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: s.gdriveRefreshToken || '',
    grant_type: 'refresh_token',
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params.toString() } as any);
  const data = await resp.json() as any;
  if (!resp.ok) throw new Error('refresh failed');
  await (prisma as any).settings.update({ where: { id: s.id }, data: { gdriveAccessToken: data.access_token, gdriveExpiry: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000) : null } });
  return data.access_token as string;
}

async function uploadToDrive(accessToken: string, fileName: string, contentGz: Buffer): Promise<string | null> {
  const boundary = 'BOUNDARY' + Date.now();
  const delimiter = `--${boundary}`;
  const closeDelim = `--${boundary}--`;
  const metadata = { name: fileName, mimeType: 'application/gzip' } as any;
  const head = Buffer.from(`${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`);
  const mid = Buffer.from(`${delimiter}\r\nContent-Type: application/gzip\r\n\r\n`);
  const tail = Buffer.from(`\r\n${closeDelim}`);
  const body = Buffer.concat([head, mid, contentGz, tail]);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: body as any,
  } as any);
  const data = await res.json() as any;
  if (!(res as any).ok) return null;
  return data.id as string;
}
