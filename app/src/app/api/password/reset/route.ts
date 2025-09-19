import { NextRequest } from "next/server";
import { errorResponse, resetPasswordSchema } from "@/server/validation";
import { consumePasswordResetToken, validatePasswordResetToken } from "@/server/password";
import { hash } from "bcrypt";
import { prisma } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("INVALID_INPUT", "يرجى التحقق من البيانات", parsed.error.flatten());
    }
    const { token, password } = parsed.data;
    const result = await validatePasswordResetToken(token);
    if (!result.valid) {
      const reason = result.reason === "expired" ? "انتهت صلاحية الرابط" : "الرابط غير صالح";
      return errorResponse("INVALID_TOKEN", reason);
    }

    const { record } = result;
    const hashedPassword = await hash(password, 10);
    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hashedPassword },
    });
    await consumePasswordResetToken(record.id);
    await (prisma as any).passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } });

    return Response.json({ ok: true });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ غير متوقع");
  }
}
