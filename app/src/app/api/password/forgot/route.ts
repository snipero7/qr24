import { NextRequest } from "next/server";
import { forgotPasswordSchema, errorResponse } from "@/server/validation";
import { createPasswordResetToken } from "@/server/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("INVALID_INPUT", "يرجى إدخال بريد إلكتروني صالح", parsed.error.flatten());
    }
    const { email } = parsed.data;
    const { token, user } = await createPasswordResetToken(email);

    if (token && user) {
      const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const resetUrl = `${origin}/reset/${token}`;
      if (process.env.NODE_ENV !== "production") {
        console.log("[Password Reset]", resetUrl);
      }
      // TODO: إرسال رسالة بريد إلكتروني حقيقية حاملة للرابط resetUrl
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ غير متوقع");
  }
}
