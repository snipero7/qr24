import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeliverDialog } from "@/components/DeliverDialog";
import { QuickStatus } from "@/components/orders/QuickStatus";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FileDown, RotateCcw } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { orderTemplateForStatus } from "@/config/notifications";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionBar } from "@/components/ui/action-bar";
import { STATUS_LABELS } from "@/lib/statusLabels";
import { normalizeNumberInput } from "@/lib/utils";
import { getSettings } from "@/server/settings";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELED"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string; status?: string; phone?: string; createdFrom?: string; createdTo?: string; priceMin?: string; priceMax?: string; page?: string; take?: string } }) {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const settings = await getSettings();
  const qRaw = searchParams.q?.trim();
  const status = searchParams.status && statuses.includes(searchParams.status as any) ? searchParams.status : undefined;
  const phoneRaw = searchParams.phone?.trim();
  const createdFrom = searchParams.createdFrom;
  const createdTo = searchParams.createdTo;
  const priceMinStr = searchParams.priceMin;
  const priceMaxStr = searchParams.priceMax;
  const priceMin = priceMinStr ? Number(normalizeNumberInput(priceMinStr)) : undefined;
  const priceMax = priceMaxStr ? Number(normalizeNumberInput(priceMaxStr)) : undefined;
  const phoneNorm = phoneRaw ? normalizeNumberInput(phoneRaw) : undefined;
  const qNorm = qRaw ? normalizeNumberInput(qRaw) : undefined;
  const page = Number(searchParams.page || 1);
  const defaultTake = Number(settings.uiTableRows || 25);
  const parsedTake = searchParams.take ? Number(searchParams.take) : defaultTake;
  const take = Math.min(parsedTake || defaultTake, 100);

  const where: any = {};
  if (status) where.status = status;
  if (qRaw) {
    where.OR = [
      { code: { contains: qRaw, mode: "insensitive" } },
      ...(qNorm ? [{ customer: { is: { phone: { contains: qNorm } } } }] : []),
    ];
  }
  if (phoneRaw) where.customer = { is: { phone: { contains: phoneNorm || phoneRaw } } };
  if (createdFrom || createdTo) {
    where.createdAt = {} as any;
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) { const d=new Date(createdTo); d.setHours(23,59,59,999); where.createdAt.lte = d; }
  }
  if ((priceMin !== undefined && !isNaN(priceMin)) || (priceMax !== undefined && !isNaN(priceMax))) {
    where.originalPrice = {} as any;
    if (priceMin !== undefined && !isNaN(priceMin)) where.originalPrice.gte = priceMin;
    if (priceMax !== undefined && !isNaN(priceMax)) where.originalPrice.lte = priceMax;
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
      q: qRaw || "",
      phone: phoneRaw || "",
      status: status || "",
      createdFrom: createdFrom || "",
      createdTo: createdTo || "",
      priceMin: priceMinStr || "",
      priceMax: priceMaxStr || "",
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
      <ActionBar>
        <input type="search" inputMode="search" name="q" defaultValue={qRaw} placeholder="بحث بالكود أو الجوال" className="input sm:col-span-2" />
        <input type="text" inputMode="numeric" name="phone" defaultValue={phoneRaw} placeholder="رقم الجوال" className="input" />
        <select name="status" defaultValue={status} className="input">
          <option value="">كل الحالات</option>
          {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input type="date" name="createdFrom" defaultValue={createdFrom} className="input" />
        <input type="date" name="createdTo" defaultValue={createdTo} className="input" />
        <input type="text" inputMode="decimal" name="priceMin" defaultValue={priceMinStr} placeholder="سعر من (مثال: ١٠٠)" title="يمكن إدخال الأرقام العربية" className="input" />
        <input type="text" inputMode="decimal" name="priceMax" defaultValue={priceMaxStr} placeholder="سعر إلى (مثال: ٢٠٠٠)" title="يمكن إدخال الأرقام العربية" className="input" />
        <div className="flex gap-2 sm:col-span-2">
          <button className="icon-ghost" title="بحث" aria-label="بحث">
            <Search size={24} />
          </button>
          <a className="icon-ghost" title="تصدير CSV" aria-label="تصدير CSV" href={`/api/orders/export?${new URLSearchParams({ q: qRaw||"", status: status||"", phone: phoneRaw||"", createdFrom: createdFrom||"", createdTo: createdTo||"", priceMin: priceMinStr||"", priceMax: priceMaxStr||"" }).toString()}`}>
            <FileDown size={24} />
          </a>
          <a className="icon-ghost" title="إعادة تعيين" aria-label="إعادة تعيين" href="/orders">
            <RotateCcw size={24} />
          </a>
        </div>
      </ActionBar>

      <div className="card tonal p-0">
        <div className="card-header">
          <h2 className="card-title">قائمة الطلبات</h2>
        </div>
        <div className="card-section overflow-x-auto">
          <Table className="orders-table">
            <THead>
              <TR>
              <TH>الكود</TH>
              <TH>العميل</TH>
              <TH>الجوال</TH>
              <TH>الخدمة</TH>
              <TH>الحالة</TH>
              <TH>واتساب</TH>
              <TH>سريع</TH>
              <TH>إجراء</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((o) => (
                <TR key={o.id} className="orders-row rounded-xl transition-all">
                  <TD className="font-mono"><a className="text-blue-600" href={`/track/${o.code}`}>{o.code}</a></TD>
                  <TD>{o.customer.name}</TD>
                  <TD>{o.customer.phone}</TD>
                <TD>{o.service}</TD>
                <TD><StatusBadge status={o.status as any} /></TD>
                <TD>
                  {(() => {
                    const originalPrice = Number(o.originalPrice ?? 0);
                    const collected = Number(o.collectedPrice ?? 0);
                    const discount = Math.max(0, originalPrice - collected);
                    return (
                      <WhatsAppButton
                        phone={o.customer.phone}
                        templateKey={orderTemplateForStatus(o.status) as any}
                        params={{
                          customerName: o.customer.name,
                          orderCode: o.code,
                          service: o.service,
                          collectedPrice: collected,
                          originalPrice,
                          discount,
                          receiptUrl: o.receiptUrl || '',
                        }}
                        variant="icon"
                      />
                    );
                  })()}
                </TD>
                <TD><QuickStatus orderId={o.id} current={o.status} /></TD>
                <TD><a className="text-blue-600" href={`/orders/${o.id}`}>تفاصيل</a>{o.status !== "DELIVERED" && (<> · <DeliverDialog orderId={o.id} defaultAmount={Number(o.originalPrice)} phone={o.customer.phone} customerName={o.customer.name} /></>)}</TD>
              </TR>
            ))}
          </TBody>
          </Table>
        </div>
      </div>

      <div className="card tonal interactive flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">إجمالي: {total} — صفحة {page} من {pages}</div>
        <div className="flex items-center gap-2">
          <a className="btn-outline h-8 px-3 text-sm disabled:opacity-50" aria-disabled={page<=1} href={`/orders?${makeQS({ page: Math.max(1, page-1) })}`}>السابق</a>
          <a className="btn-outline h-8 px-3 text-sm disabled:opacity-50" aria-disabled={page>=pages} href={`/orders?${makeQS({ page: Math.min(pages, page+1) })}`}>التالي</a>
          <form className="flex items-center gap-1" action="/orders">
            {/** preserve filters */}
            <input type="hidden" name="q" value={qRaw} />
            <input type="hidden" name="phone" value={phoneRaw} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="createdFrom" value={createdFrom} />
            <input type="hidden" name="createdTo" value={createdTo} />
            <input type="hidden" name="priceMin" value={priceMinStr} />
            <input type="hidden" name="priceMax" value={priceMaxStr} />
            <label className="text-sm text-gray-600">لكل صفحة</label>
            <select name="take" defaultValue={String(take)} className="input h-8 py-0 text-sm">
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <Button size="sm">تطبيق</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
