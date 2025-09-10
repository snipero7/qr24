import fs from "node:fs/promises";
import path from "node:path";

let s3Client: any;
async function getS3() {
  if (s3Client) return s3Client;
  const { S3Client } = await import("@aws-sdk/client-s3");
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle: !!endpoint, // for R2/MinIO
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET || "",
    },
  });
  return s3Client;
}

export function isS3Enabled() {
  return !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET);
}

export async function saveReceipt(buffer: Buffer, key: string, contentType = "application/pdf") {
  if (isS3Enabled()) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3();
    const Bucket = process.env.S3_BUCKET as string;
    const Key = key;
    await client.send(new PutObjectCommand({ Bucket, Key, Body: buffer, ContentType: contentType }));
    const base = process.env.S3_PUBLIC_BASE || process.env.S3_ENDPOINT;
    if (base) {
      const normalized = base.replace(/\/$/, "");
      return `${normalized}/${Bucket}/${Key}`;
    }
    // Fallback public URL style (may vary per provider)
    return `https://${Bucket}.s3.amazonaws.com/${Key}`;
  }

  const receiptsDir = path.join(process.cwd(), "public", "receipts");
  await fs.mkdir(receiptsDir, { recursive: true });
  const filePath = path.join(receiptsDir, path.basename(key));
  await fs.writeFile(filePath, buffer);
  return `/receipts/${path.basename(key)}`;
}

