import { prisma } from "@/server/db";

export async function GET() {
  const [ordersCount, collectedSumRaw, inProgressCount, debts] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { collectedPrice: true } }),
    prisma.order.count({ where: { status: { in: ["NEW", "IN_PROGRESS", "WAITING_PARTS", "READY"] } } }),
    prisma.debt.findMany({ include: { payments: true } }),
  ]);

  const collected = Number(collectedSumRaw._sum.collectedPrice || 0);
  const totalDebtRemaining = debts.reduce((acc, d) => {
    const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
    return acc + Math.max(0, Number(d.amount) - paid);
  }, 0);

  return Response.json({
    ordersCount,
    collected,
    inProgressCount,
    totalDebtRemaining,
  });
}

