import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { toCsv } from "@/server/csv";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });

  const debts = await prisma.debt.findMany({ include: { payments: true }, orderBy: { createdAt: "desc" }, take: 5000 });
  const rows = debts.map(d => {
    const paid = d.payments.reduce((s,p)=>s+Number(p.amount),0);
    const remaining = Math.max(0, Number(d.amount) - paid);
    return {
      id: d.id,
      shopName: d.shopName,
      service: d.service,
      amount: Number(d.amount),
      paid,
      remaining,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    };
  });
  const csv = toCsv(rows, ["id","shopName","service","amount","paid","remaining","status","createdAt"]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=debts.csv`,
    },
  });
}

