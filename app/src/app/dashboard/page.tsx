import { prisma } from "@/server/db";

export default async function Dashboard() {
  const [summary, recent] = await Promise.all([
    prisma.order.aggregate({
      _sum: { collectedPrice: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: true },
    }),
  ]);

  const ordersCount = summary._count._all;
  const collected = Number(summary._sum.collectedPrice || 0);
  const inProgressCount = await prisma.order.count({ where: { status: { in: ["NEW","IN_PROGRESS","WAITING_PARTS","READY"] } } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="إجمالي الطلبات" value={ordersCount} />
        <Card title="الإيراد المُحصّل" value={`${collected.toFixed(2)} ر.س`} />
        <Card title="أجهزة قيد العمل" value={inProgressCount} />
      </div>

      <section>
        <h2 className="font-semibold mb-3">أحدث الطلبات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">الكود</th>
                <th className="p-2">العميل</th>
                <th className="p-2">الخدمة</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono">
                    <a className="text-blue-600" href={`/track/${o.code}`}>{o.code}</a>
                  </td>
                  <td className="p-2">{o.customer.name}</td>
                  <td className="p-2">{o.service}</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

