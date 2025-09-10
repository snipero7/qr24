import { prisma } from "@/server/db";
import { addPaymentSchema, errorResponse } from "@/server/validation";
import { requireAuth } from "@/server/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const body = await req.json();
    const parsed = addPaymentSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { amount } = parsed.data;

    const debt = await prisma.debt.findUnique({ where: { id: params.id }, include: { payments: true } });
    if (!debt) return errorResponse("NOT_FOUND", "الدين غير موجود");

    const payment = await prisma.debtPayment.create({ data: { debtId: params.id, amount: new prisma.Prisma.Decimal(amount) } });

    const { totalPaid, remaining, status } = await recomputeDebt(params.id);

    return Response.json({ totalPaid, remaining, status, payment });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

async function recomputeDebt(debtId: string) {
  const d = await prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
  if (!d) throw new Error("Debt not found");
  const totalPaid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Math.max(0, Number(d.amount) - totalPaid);
  let status: "OPEN" | "PARTIAL" | "PAID" = "OPEN";
  if (totalPaid === 0) status = "OPEN";
  else if (totalPaid < Number(d.amount)) status = "PARTIAL";
  else status = "PAID";
  await prisma.debt.update({ where: { id: d.id }, data: { status } });
  return { totalPaid, remaining, status };
}
