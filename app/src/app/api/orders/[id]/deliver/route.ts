import { prisma } from "@/server/db";
import { deliverOrderSchema, errorResponse } from "@/server/validation";
import { makeQrPayload } from "@/server/qr";
import { generateReceiptPdf } from "@/server/receipt";
import path from "node:path";
import { requireAuth } from "@/server/auth";
import { saveReceipt } from "@/server/storage";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(["ADMIN","CLERK"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const body = await req.json();
    const parsed = deliverOrderSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { collectedPrice } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { customer: true } });
    if (!order) return errorResponse("NOT_FOUND", "الطلب غير موجود");

    if (order.status === "DELIVERED") {
      return errorResponse("ALREADY_DELIVERED", "تم تسليم الطلب مسبقًا");
    }

    const delivered = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const u = await tx.order.update({
        where: { id: params.id },
        data: {
          status: "DELIVERED",
          collectedPrice: collectedPrice,
          collectedAt: now,
        },
      });
      await tx.orderStatusLog.create({ data: { orderId: params.id, from: order.status, to: "DELIVERED", note: "Delivered" } });
      return u;
    });

    // Generate PDF receipt and save locally as mock storage
    const { dataUrl } = await makeQrPayload(order.code);
    const pdfBuf = await generateReceiptPdf({
      code: order.code,
      service: order.service,
      deviceModel: order.deviceModel,
      collectedPrice: Number(parsed.data.collectedPrice),
      collectedAt: delivered.collectedAt!,
      customer: { name: order.customer.name, phone: order.customer.phone },
    }, dataUrl);
    const fileName = `${order.code}.pdf`;
    const key = path.posix.join("receipts", fileName);
    const receiptUrl = await saveReceipt(pdfBuf, key, "application/pdf");

    await prisma.order.update({ where: { id: delivered.id }, data: { receiptUrl } });

    return Response.json({ status: "DELIVERED", collectedAt: delivered.collectedAt, collectedPrice: delivered.collectedPrice, receiptUrl });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}
