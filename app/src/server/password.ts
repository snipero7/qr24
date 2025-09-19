import { prisma } from "@/server/db";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_EXP_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES ?? 30);
const db = prisma as any;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return { token: null };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { token: null };
  }
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXP_MINUTES * 60_000);
  await db.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });
  return { token: rawToken, user };
}

export async function validatePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!record || record.usedAt) {
    return { valid: false as const, reason: "invalid" };
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return { valid: false as const, reason: "expired" };
  }
  return { valid: true as const, record };
}

export async function consumePasswordResetToken(id: string) {
  await db.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
