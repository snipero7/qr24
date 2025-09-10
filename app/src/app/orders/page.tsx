import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeliverDialog } from "@/components/DeliverDialog";
import { QuickStatus } from "@/components/orders/QuickStatus";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELED"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string; status?: string; phone?: string; createdFrom?: string; createdTo?: string; priceMin?: string; priceMax?: string } }) {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const q = searchParams.q?.trim();
  const status = searchParams.status && statuses.includes(searchParams.status as any) ? searchParams.status : undefined;
  const phone = searchParams.phone?.trim();
  const createdFrom = searchParams.createdFrom;
  const createdTo = searchParams.createdTo;
  const priceMin = searchParams.priceMin;
  const priceMax = searchParams.priceMax;

  const where: any = {};
  if (status) where.status = status;
  if (q) where.OR = [{ code: { contains: q, mode: "insensitive" } }, { customer: { is: { phone: { contains: q } } } }];
  if (phone) where.customer = { is: { phone: { contains: phone } } };
  if (createdFrom || createdTo) {
    where.createdAt = {} as any;
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) { const d=new Date(createdTo); d.setHours(23,59,59,999); where.createdAt.lte = d; }
  }
  if (priceMin || priceMax) {
    where.originalPrice = {} as any;
    if (priceMin) where.originalPrice.gte = Number(priceMin);
    if (priceMax) where.originalPrice.lte = Number(priceMax);
  }

  const items = await prisma.order.findMany({ where, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الطلبات</h1>
      <form className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
        <input name="q" defaultValue={q} placeholder="بحث بالكود أو الجوال" className="border rounded p-2 sm:col-span-2" />
        <input name="phone" defaultValue={phone} placeholder="رقم الجوال" className="border rounded p-2" />
        <select name="status" defaultValue={status} className="border rounded p-2">
          <option value="">كل الحالات</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" name="createdFrom" defaultValue={createdFrom} className="border rounded p-2" />
        <input type="date" name="createdTo" defaultValue={createdTo} className="border rounded p-2" />
        <input type="number" name="priceMin" defaultValue={priceMin} placeholder="سعر من" className="border rounded p-2" />
        <input type="number" name="priceMax" defaultValue={priceMax} placeholder="سعر إلى" className="border rounded p-2" />
        <div className="flex gap-2 sm:col-span-2">
          <button className="bg-blue-600 text-white px-4 rounded">بحث</button>
          <a className="border px-3 rounded flex items-center" href={`/api/orders/export?${new URLSearchParams({ q: q||"", status: status||"", phone: phone||"", createdFrom: createdFrom||"", createdTo: createdTo||"", priceMin: priceMin||"", priceMax: priceMax||"" }).toString()}`}>تصدير CSV</a>
          <a className="border px-3 rounded flex items-center" href="/orders">إعادة تعيين</a>
        </div>
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
              <th className="p-2">سريع</th>
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
                <td className="p-2">
                  <QuickStatus orderId={o.id} current={o.status} />
                </td>
                <td className="p-2"><a className="text-blue-600" href={`/orders/${o.id}`}>تفاصيل</a></td>
                {o.status !== "DELIVERED" && (
                  <td className="p-2"><DeliverDialog orderId={o.id} /></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
