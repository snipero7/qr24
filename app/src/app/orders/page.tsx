import { prisma } from "@/server/db";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELED"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const q = searchParams.q?.trim();
  const status = searchParams.status && statuses.includes(searchParams.status as any) ? searchParams.status : undefined;

  const where: any = {};
  if (status) where.status = status;
  if (q) where.OR = [{ code: { contains: q, mode: "insensitive" } }, { customer: { is: { phone: { contains: q } } } }];

  const items = await prisma.order.findMany({ where, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الطلبات</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="بحث بالكود أو الجوال" className="border rounded p-2 flex-1" />
        <select name="status" defaultValue={status} className="border rounded p-2">
          <option value="">كل الحالات</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="bg-blue-600 text-white px-4 rounded">بحث</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">الكود</th>
              <th className="p-2">العميل</th>
              <th className="p-2">الجوال</th>
              <th className="p-2">الخدمة</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="p-2 font-mono"><a className="text-blue-600" href={`/track/${o.code}`}>{o.code}</a></td>
                <td className="p-2">{o.customer.name}</td>
                <td className="p-2">{o.customer.phone}</td>
                <td className="p-2">{o.service}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2"><a className="text-blue-600" href={`/orders/${o.id}`}>تفاصيل</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

