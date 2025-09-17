import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { errorResponse } from "@/server/validation";

type RouteParams = Promise<{ id: string }>;

export async function PATCH(req: Request, ctx: { params: RouteParams }) {
  try {
    const auth = await requireAuth(["ADMIN","CLERK"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const { id } = await ctx.params;
    const existing = await prisma.order.findUnique({ where: { id }, select: { status: true, collectedPrice: true } });
    if (!existing) return errorResponse("NOT_FOUND", "الطلب غير موجود");
    if (existing.status === "DELIVERED" || existing.collectedPrice !== null) {
      return errorResponse("LOCKED", "تم تحصيل مبلغ الطلب ولا يمكن تعديله");
    }
    const body = await req.json();
    const data: any = {};
    if (typeof body.deviceModel === 'string' || body.deviceModel === null) data.deviceModel = body.deviceModel || null;
    if (typeof body.imei === 'string' || body.imei === null) data.imei = body.imei || null;
    if (typeof body.service === 'string') data.service = body.service;
    if (body.originalPrice !== undefined) {
      const n = Number(body.originalPrice);
      if (!Number.isNaN(n) && n >= 0) data.originalPrice = n;
    }
    if (Object.keys(data).length === 0) return errorResponse("INVALID_INPUT", "لا توجد حقول صالحة للتعديل");
    const u = await prisma.order.update({ where: { id }, data, select: { id: true } });
    return Response.json({ ok: true, id: u.id });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

export async function DELETE(_req: Request, ctx: { params: RouteParams }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const { id } = await ctx.params;
    await prisma.$transaction(async (tx) => {
      await tx.orderStatusLog.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
    return Response.json({ ok: true });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}
