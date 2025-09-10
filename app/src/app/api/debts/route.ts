import { prisma } from "@/server/db";
import { createDebtSchema, errorResponse } from "@/server/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { shopName, service, amount, notes } = parsed.data;
    const debt = await prisma.debt.create({
      data: { shopName, service, amount: new prisma.Prisma.Decimal(amount), notes, status: "OPEN" },
    });
    return Response.json(debt);
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

export async function GET() {
  const items = await prisma.debt.findMany({ include: { payments: true }, orderBy: { createdAt: "desc" } });
  return Response.json(items);
}

