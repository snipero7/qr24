import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { KpiCard } from "@/components/ui/kpi-card";
import { ActionBar } from "@/components/ui/action-bar";
import { Sparkline } from "@/components/ui/sparkline";

export default async function ReportsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const session = await getAuthSession();
  if (!session || (session.user as any).role === "TECH") redirect("/signin");

  // نطاق التاريخ
  const toParam = searchParams.to ? new Date(searchParams.to) : new Date();
  const fromParam = searchParams.from ? new Date(searchParams.from) : new Date(Date.now() - 29*24*3600*1000);
  const toDate = new Date(toParam); toDate.setHours(23,59,59,999);
  const fromDate = new Date(fromParam); fromDate.setHours(0,0,0,0);

  const collectedAgg = await prisma.order.aggregate({ _sum: { collectedPrice: true }, _count: { _all: true }, where: { collectedAt: { gte: fromDate, lte: toDate } } });
  const collectedTotal = Number(collectedAgg._sum.collectedPrice || 0);
  const deliveredCount = await prisma.order.count({ where: { collectedAt: { gte: fromDate, lte: toDate } } });

  // تجميع يومي ضمن النطاق
  const rows = await prisma.$queryRaw<{ day: Date; count: number; sum: number }[]>`
    SELECT DATE_TRUNC('day', "collectedAt") AS day,
           COUNT(*) AS count,
           COALESCE(SUM("collectedPrice"), 0) AS sum
    FROM "Order"
    WHERE "collectedAt" IS NOT NULL
      AND "collectedAt" >= ${fromDate}
      AND "collectedAt" <= ${toDate}
    GROUP BY day
    ORDER BY day DESC
  `;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير</h1>
      <ActionBar>
        <form className="contents">
          <div>
            <label className="block text-sm text-gray-600 mb-1">من</label>
            <input type="date" name="from" defaultValue={fromDate.toISOString().slice(0,10)} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">إلى</label>
            <input type="date" name="to" defaultValue={new Date(toParam).toISOString().slice(0,10)} className="border rounded p-2 w-full" />
          </div>
          <div className="flex items-end">
            <button className="btn-primary">تطبيق</button>
          </div>
          <div className="flex items-end">
            <a className="border rounded px-3 py-2" href={`/api/reports/orders-by-day.csv?from=${fromDate.toISOString().slice(0,10)}&to=${toDate.toISOString().slice(0,10)}`}>تصدير CSV</a>
          </div>
        </form>
      </ActionBar>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard title="المحصّل الكلي" value={`${collectedTotal.toFixed(2)} ر.س`} />
        <KpiCard title="عدد التسليمات" value={deliveredCount} />
        <KpiCard title="متوسط يومي" value={`${(rows.reduce((a,r)=>a+Number(r.sum),0)/(rows.length||1)).toFixed(2)} ر.س`} />
      </div>

      <section>
        <h2 className="font-semibold mb-3">محصّل آخر 30 يوم</h2>
        <div className="card">
          <Sparkline values={[...rows].reverse().map(r => Number(r.sum))} />
        </div>
        <div className="overflow-x-auto mt-4">
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
      </section>
    </div>
  );
}
