import { prisma } from "@/server/db";
import { deliverOrderSchema, errorResponse } from "@/server/validation";
import { makeQrPayload } from "@/server/qr";
import { generateThermalInvoicePdfNoVat } from "@/server/receipt";
import path from "node:path";
import { requireAuth } from "@/server/auth";
import { saveReceipt } from "@/server/storage";
import { logger } from "@/server/logger";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN","CLERK"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const body = await req.json();
    const parsed = deliverOrderSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { collectedPrice, extraCharge = 0, extraReason, paymentMethod } = parsed.data as any;

    const { id } = await ctx.params;
    const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
    if (!order) return errorResponse("NOT_FOUND", "الطلب غير موجود");

    if (order.status === "DELIVERED") {
      return errorResponse("ALREADY_DELIVERED", "تم تسليم الطلب مسبقًا");
    }

    const delivered = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const u = await tx.order.update({
        where: { id },
        data: {
          status: "DELIVERED",
          collectedPrice: collectedPrice,
          collectedAt: now,
          extraCharge: extraCharge || 0,
          extraReason: (extraCharge || 0) > 0 ? (extraReason || '') : null,
          paymentMethod: paymentMethod || null,
        },
      });
      await tx.orderStatusLog.create({ data: { orderId: id, from: order.status, to: "DELIVERED", note: "تم التسليم" } });
      return u;
    });

    // Generate PDF receipt and save — but do not fail delivery if receipt fails
    let receiptUrl: string | null = null;
    try {
      const { dataUrl } = await makeQrPayload(order.code);
      const pdfBuf = await generateThermalInvoicePdfNoVat({
        code: order.code,
        service: order.service,
        deviceModel: order.deviceModel,
        status: 'DELIVERED',
        collectedPrice: Number(parsed.data.collectedPrice),
        collectedAt: delivered.collectedAt!,
        originalPrice: Number(order.originalPrice),
        extraCharge: Number(delivered.extraCharge || 0),
        extraReason: delivered.extraReason || undefined,
        paymentMethod,
        customer: { name: order.customer.name, phone: order.customer.phone },
        // @ts-ignore
        imei: (order as any).imei,
      }, dataUrl);
      const fileName = `${order.code}.pdf`;
      const key = path.posix.join("receipts", fileName);
      receiptUrl = await saveReceipt(pdfBuf, key, "application/pdf");
      if (delivered && delivered.id) {
        await prisma.order.update({ where: { id: delivered.id }, data: { receiptUrl } });
      } else {
        await prisma.order.update({ where: { id }, data: { receiptUrl } });
      }
    } catch (err: any) {
      logger.warn({ err: String(err?.message || err) }, "receipt_generation_failed");
    }

    return Response.json({ status: "DELIVERED", collectedAt: delivered.collectedAt, collectedPrice: delivered.collectedPrice, receiptUrl });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}
