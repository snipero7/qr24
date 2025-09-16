import crypto from "node:crypto";
import QRCode from "qrcode";

const HMAC_SECRET = process.env.QR_HMAC_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret";

export function generateShortCode() {
  // 10-char base36 string
  const rnd = crypto.randomBytes(6).toString("hex");
  const num = BigInt("0x" + rnd);
  return num.toString(36).slice(0, 10);
}

export function signCode(code: string) {
  const h = crypto.createHmac("sha256", HMAC_SECRET).update(code).digest("hex");
  return h.slice(0, 16); // short tag
}

export async function makeQrPayload(code: string) {
  const t = signCode(code);
  const payload = { o: code, t };
  const text = JSON.stringify(payload);
  const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 256 });
  return { payload, dataUrl };
}

export function verifySignature(code: string, tag: string) {
  return signCode(code) === tag;
}

