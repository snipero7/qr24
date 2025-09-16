import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { errorResponse } from "@/server/validation";
import { makeQrPayload } from "@/server/qr";
import { generateThermalInvoicePdfNoVat } from "@/server/receipt";
import { saveReceipt } from "@/server/storage";
import path from "node:path";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);

  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
  if (!order) return errorResponse("NOT_FOUND", "الطلب غير موجود");
  // السماح بإعادة التوليد حتى لو لم يكن الطلب مسلّمًا بعد — نستعمل قيم افتراضية عند الحاجة

  try {
    const { dataUrl } = await makeQrPayload(order.code);
    const effective = Number(order.originalPrice || 0) + Number((order as any).extraCharge || 0);
    const collectedAt = (order.collectedAt as Date | null) || new Date();
    const collectedPrice = Number(order.collectedPrice ?? effective);
    const paymentMethod = (order as any).paymentMethod || undefined;

    const pdfBuf = await generateThermalInvoicePdfNoVat({
      code: order.code,
      service: order.service,
      deviceModel: order.deviceModel || undefined,
      status: order.status,
      collectedPrice,
      collectedAt,
      originalPrice: Number(order.originalPrice || 0),
      extraCharge: Number((order as any).extraCharge || 0),
      extraReason: (order as any).extraReason || undefined,
      paymentMethod,
      customer: { name: order.customer.name, phone: order.customer.phone },
      // @ts-ignore
      imei: (order as any).imei,
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
