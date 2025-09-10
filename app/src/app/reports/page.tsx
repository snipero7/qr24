import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatCard } from "@/components/ui/card";

export default async function ReportsPage() {
  const session = await getAuthSession();
  if (!session || (session.user as any).role === "TECH") redirect("/signin");

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const [collectedMonthAgg] = await Promise.all([
    prisma.order.aggregate({ _sum: { collectedPrice: true }, where: { collectedAt: { gte: startOfMonth } } }),
  ]);
  const collectedMonth = Number(collectedMonthAgg._sum.collectedPrice || 0);

  // آخر 30 يوم محصّل يوميًا
  const rows = await prisma.$queryRaw<{ day: Date; count: number; sum: number }[]>`
    SELECT DATE_TRUNC('day', "collectedAt") AS day,
           COUNT(*) AS count,
           COALESCE(SUM("collectedPrice"), 0) AS sum
    FROM "Order"
    WHERE "collectedAt" IS NOT NULL
      AND "collectedAt" >= NOW() - interval '30 days'
    GROUP BY day
    ORDER BY day DESC
  `;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="محصّل هذا الشهر" value={`${collectedMonth.toFixed(2)} ر.س`} />
        <StatCard label="أيام محسوبة" value={rows.length} />
        <StatCard label="متوسط يومي" value={`${(rows.reduce((a,r)=>a+Number(r.sum),0)/(rows.length||1)).toFixed(2)} ر.س`} />
      </div>

      <section>
        <h2 className="font-semibold mb-3">محصّل آخر 30 يوم</h2>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>اليوم</TH>
                <TH>عدد الطلبات المسلَّمة</TH>
                <TH>المحصّل</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map(r => (
                <TR key={String(r.day)}>
                  <TD>{new Date(r.day).toLocaleDateString()}</TD>
                  <TD>{Number(r.count)}</TD>
                  <TD>{Number(r.sum).toFixed(2)} ر.س</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <div className="mt-2">
          <a className="border rounded px-3 py-1" href="/api/reports/orders-by-day.csv">تصدير CSV</a>
        </div>
      </section>
    </div>
  );
}

