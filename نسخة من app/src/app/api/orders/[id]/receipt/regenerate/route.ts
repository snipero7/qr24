import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { errorResponse } from "@/server/validation";
import { makeQrPayload } from "@/server/qr";
import { generateThermalInvoicePdfNoVat } from "@/server/receipt";
import { saveReceipt } from "@/server/storage";
import path from "node:path";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);

  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
  if (!order) return errorResponse("NOT_FOUND", "الطلب غير موجود");
  if (order.status !== "DELIVERED" || !order.collectedAt || !order.collectedPrice) {
    return errorResponse("NOT_DELIVERED", "لا يمكن توليد الإيصال قبل التسليم");
  }

  try {
    const { dataUrl } = await makeQrPayload(order.code);
    const pdfBuf = await generateThermalInvoicePdfNoVat({
      code: order.code,
      service: order.service,
      deviceModel: order.deviceModel || undefined,
      collectedPrice: Number(order.collectedPrice),
      collectedAt: order.collectedAt as Date,
      originalPrice: Number(order.originalPrice || 0),
      extraCharge: Number((order as any).extraCharge || 0),
      extraReason: (order as any).extraReason || undefined,
      paymentMethod: (order as any).paymentMethod || undefined,
      customer: { name: order.customer.name, phone: order.customer.phone },
    }, dataUrl);

    const fileName = `${order.code}.pdf`;
    const key = path.posix.join("receipts", fileName);
    const receiptUrl = await saveReceipt(pdfBuf, key, "application/pdf");
    await prisma.order.update({ where: { id: order.id }, data: { receiptUrl } });
    return Response.json({ receiptUrl });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "فشل إعادة التوليد");
  }
}
