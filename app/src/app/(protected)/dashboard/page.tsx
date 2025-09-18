import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/ui/kpi-card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClipboardList, Wallet, Wallet2, Users, Receipt, QrCode } from "lucide-react";
import { formatYMD_HM } from "@/lib/date";

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard title="إجمالي الطلبات" value={ordersCount} icon={<ClipboardList size={18} />} />
        <KpiCard title="الإيراد المُحصّل" value={`${collected.toFixed(2)} ر.س`} icon={<Wallet size={18} />} />
        <KpiCard title="أجهزة قيد العمل" value={inProgressCount} icon={<Users size={18} />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard title="محصّل اليوم" value={`${collectedToday.toFixed(2)} ر.س`} icon={<Receipt size={18} />} />
        <KpiCard title="محصّل الشهر" value={`${collectedMonth.toFixed(2)} ر.س`} icon={<QrCode size={18} />} />
        <KpiCard title="الديون المتبقية" value={`${totalDebtRemaining.toFixed(2)} ر.س`} icon={<Wallet2 size={18} />} />
      </div>

      <section className="card tonal p-0">
        <div className="card-header">
          <h2 className="card-title">أحدث الطلبات</h2>
        </div>
        <div className="card-section overflow-x-auto">
          <Table className="glass-table">
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
                <TR key={o.id} className="glass-row rounded-xl">
                  <TD className="font-mono">
                    <a className="text-blue-600" href={`/track/${o.code}`}>{o.code}</a>
                  </TD>
                  <TD>{o.customer.name}</TD>
                  <TD>{o.service}</TD>
                  <TD><StatusBadge status={o.status as any} /></TD>
                  <TD>{formatYMD_HM(o.createdAt as any)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

//
