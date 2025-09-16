import { prisma } from "@/server/db";
import { updateStatusSchema, errorResponse } from "@/server/validation";
import { requireAuth } from "@/server/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requireAuth(["ADMIN","CLERK","TECH"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { to, note } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return errorResponse("NOT_FOUND", "الطلب غير موجود");

    if (to === "DELIVERED") {
      return errorResponse("INVALID_TRANSITION", "استخدم مسار التسليم لإتمام التسليم");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({ where: { id }, data: { status: to } });
      await tx.orderStatusLog.create({ data: { orderId: id, from: order.status, to, note } });
      return u;
    });

    return Response.json({ id: updated.id, status: updated.status });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}
