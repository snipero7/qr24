import { prisma } from "@/server/db";
import { deliverOrderSchema, errorResponse } from "@/server/validation";
import { makeQrPayload } from "@/server/qr";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
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
          collectedPrice: new prisma.Prisma.Decimal(collectedPrice),
          collectedAt: now,
        },
      });
      await tx.orderStatusLog.create({ data: { orderId: params.id, from: order.status, to: "DELIVERED", note: "Delivered" } });
      return u;
    });

    // Generate a simple receipt placeholder (PNG QR saved locally) as mock storage
    const { dataUrl } = await makeQrPayload(order.code);
    const b64 = dataUrl.split(",")[1] ?? "";
    const buf = Buffer.from(b64, "base64");
    const receiptsDir = path.join(process.cwd(), "public", "receipts");
    await fs.mkdir(receiptsDir, { recursive: true });
    const fileName = `${order.code}.png`;
    const filePath = path.join(receiptsDir, fileName);
    await fs.writeFile(filePath, buf);
    const receiptUrl = `/receipts/${fileName}`;

    await prisma.order.update({ where: { id: delivered.id }, data: { receiptUrl } });

    return Response.json({ status: "DELIVERED", collectedAt: delivered.collectedAt, collectedPrice: delivered.collectedPrice, receiptUrl });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

