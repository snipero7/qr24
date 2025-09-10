import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeliverDialog } from "@/components/DeliverDialog";
import { QuickStatus } from "@/components/orders/QuickStatus";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELED"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string; status?: string; phone?: string; createdFrom?: string; createdTo?: string; priceMin?: string; priceMax?: string; page?: string; take?: string } }) {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const q = searchParams.q?.trim();
  const status = searchParams.status && statuses.includes(searchParams.status as any) ? searchParams.status : undefined;
  const phone = searchParams.phone?.trim();
  const createdFrom = searchParams.createdFrom;
  const createdTo = searchParams.createdTo;
  const priceMin = searchParams.priceMin;
  const priceMax = searchParams.priceMax;
  const page = Number(searchParams.page || 1);
  const take = Math.min(Number(searchParams.take || 20), 100);

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

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take,
      skip: (page - 1) * take,
    }),
    prisma.order.count({ where })
  ]);
  const pages = Math.max(1, Math.ceil(total / take));
  const makeQS = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams({
      q: q || "",
      phone: phone || "",
      status: status || "",
      createdFrom: createdFrom || "",
      createdTo: createdTo || "",
      priceMin: priceMin || "",
      priceMax: priceMax || "",
      take: String(take),
      page: String(page),
    });
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    return params.toString();
  };

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
        <Table>
          <THead>
            <TR>
              <TH>الكود</TH>
              <TH>العميل</TH>
              <TH>الجوال</TH>
              <TH>الخدمة</TH>
              <TH>الحالة</TH>
              <TH>سريع</TH>
              <TH>إجراء</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((o) => (
              <TR key={o.id}>
                <TD className="font-mono"><a className="text-blue-600" href={`/track/${o.code}`}>{o.code}</a></TD>
                <TD>{o.customer.name}</TD>
                <TD>{o.customer.phone}</TD>
                <TD>{o.service}</TD>
                <TD>{o.status}</TD>
                <TD><QuickStatus orderId={o.id} current={o.status} /></TD>
                <TD><a className="text-blue-600" href={`/orders/${o.id}`}>تفاصيل</a>{o.status !== "DELIVERED" && (<> · <DeliverDialog orderId={o.id} /></>)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">إجمالي: {total} — صفحة {page} من {pages}</div>
        <div className="flex items-center gap-2">
          <a className="border rounded px-3 py-1 text-sm disabled:opacity-50" aria-disabled={page<=1} href={`/orders?${makeQS({ page: Math.max(1, page-1) })}`}>السابق</a>
          <a className="border rounded px-3 py-1 text-sm disabled:opacity-50" aria-disabled={page>=pages} href={`/orders?${makeQS({ page: Math.min(pages, page+1) })}`}>التالي</a>
          <form className="flex items-center gap-1" action="/orders">
            {/** preserve filters */}
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="createdFrom" value={createdFrom} />
            <input type="hidden" name="createdTo" value={createdTo} />
            <input type="hidden" name="priceMin" value={priceMin} />
            <input type="hidden" name="priceMax" value={priceMax} />
            <label className="text-sm text-gray-600">لكل صفحة</label>
            <select name="take" defaultValue={String(take)} className="border rounded p-1 text-sm">
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <Button size="sm">تطبيق</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
