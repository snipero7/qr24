import { prisma } from "@/server/db";
import { updateStatusSchema, errorResponse } from "@/server/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { to, note } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return errorResponse("NOT_FOUND", "الطلب غير موجود");

    if (to === "DELIVERED") {
      return errorResponse("INVALID_TRANSITION", "استخدم مسار التسليم لإتمام التسليم");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({ where: { id: params.id }, data: { status: to } });
      await tx.orderStatusLog.create({ data: { orderId: params.id, from: order.status, to, note } });
      return u;
    });

    return Response.json({ id: updated.id, status: updated.status });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

