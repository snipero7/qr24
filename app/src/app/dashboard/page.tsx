import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { StatCard, Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function Dashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  const startOfMonth = new Date(startOfDay);
  startOfMonth.setDate(1);

  const [summary, recent, inProgressCount, debts] = await Promise.all([
    prisma.order.aggregate({ _sum: { collectedPrice: true }, _count: { _all: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { customer: true } }),
    prisma.order.count({ where: { status: { in: ["NEW","IN_PROGRESS","WAITING_PARTS","READY"] } } }),
    prisma.debt.findMany({ include: { payments: true } }),
  ]);

  const ordersCount = summary._count._all;
  const collected = Number(summary._sum.collectedPrice || 0);
  const collectedToday = Number((await prisma.order.aggregate({ _sum: { collectedPrice: true }, where: { collectedAt: { gte: startOfDay } } }))._sum.collectedPrice || 0);
  const collectedMonth = Number((await prisma.order.aggregate({ _sum: { collectedPrice: true }, where: { collectedAt: { gte: startOfMonth } } }))._sum.collectedPrice || 0);
  const totalDebtRemaining = debts.reduce((acc, d) => {
    const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
    return acc + Math.max(0, Number(d.amount) - paid);
  }, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="إجمالي الطلبات" value={ordersCount} />
        <StatCard label="الإيراد المُحصّل" value={`${collected.toFixed(2)} ر.س`} />
        <StatCard label="أجهزة قيد العمل" value={inProgressCount} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="محصّل اليوم" value={`${collectedToday.toFixed(2)} ر.س`} />
        <StatCard label="محصّل الشهر" value={`${collectedMonth.toFixed(2)} ر.س`} />
        <StatCard label="الديون المتبقية" value={`${totalDebtRemaining.toFixed(2)} ر.س`} />
      </div>

      <section>
        <h2 className="font-semibold mb-3">أحدث الطلبات</h2>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>الكود</TH>
                <TH>العميل</TH>
                <TH>الخدمة</TH>
                <TH>الحالة</TH>
                <TH>تاريخ الإنشاء</TH>
              </TR>
            </THead>
            <TBody>
              {recent.map((o) => (
                <TR key={o.id} className="hover:bg-gray-50">
                  <TD className="font-mono">
                    <a className="text-blue-600" href={`/track/${o.code}`}>{o.code}</a>
                  </TD>
                  <TD>{o.customer.name}</TD>
                  <TD>{o.service}</TD>
                  <TD>{o.status}</TD>
                  <TD>{new Date(o.createdAt).toLocaleString()}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
