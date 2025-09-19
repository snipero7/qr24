import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeliverDialog } from "@/components/DeliverDialog";
import { QuickStatus } from "@/components/orders/QuickStatus";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FileDown, RotateCcw, FileSpreadsheet, Eye } from "lucide-react";
import EditOrderDialog from "@/components/orders/EditOrderDialog";
import DeleteOrderButton from "@/components/orders/DeleteOrderButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { orderTemplateForStatus } from "@/config/notifications";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionBar } from "@/components/ui/action-bar";
import { STATUS_LABELS } from "@/lib/statusLabels";
import { Input } from "@/components/ui/input";
import { normalizeNumberInput, toLatinDigits } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { getSettings } from "@/server/settings";
import Link from "next/link";

const statuses = ["NEW","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELED"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const settings = await getSettings();
  const sp: any = await searchParams;
  const get = (k: string) => {
    const v = sp?.[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const qRaw = get('q')?.trim();
  const statusCandidate = get('status');
  const status = statusCandidate && statuses.includes(statusCandidate as any) ? statusCandidate : undefined;
  const phoneRaw = get('phone')?.trim();
  const createdFromRaw = get('createdFrom');
  const createdToRaw = get('createdTo');
  const priceMinRaw = get('priceMin');
  const priceMaxRaw = get('priceMax');

  const qDisplay = qRaw ? toLatinDigits(qRaw) : "";
  const qNorm = qRaw ? normalizeNumberInput(qRaw) : "";
  const phoneNorm = phoneRaw ? normalizeNumberInput(phoneRaw) : "";
  const phoneDisplay = phoneRaw ? (phoneNorm || toLatinDigits(phoneRaw)) : "";
  const createdFrom = createdFromRaw ? toLatinDigits(createdFromRaw) : "";
  const createdTo = createdToRaw ? toLatinDigits(createdToRaw) : "";
  const priceMinStr = priceMinRaw ? normalizeNumberInput(priceMinRaw) : "";
  const priceMaxStr = priceMaxRaw ? normalizeNumberInput(priceMaxRaw) : "";
  const priceMin = priceMinStr ? Number(priceMinStr) : undefined;
  const priceMax = priceMaxStr ? Number(priceMaxStr) : undefined;

  const defaultTake = Number(settings.uiTableRows || 25);
  const pageRaw = get('page');
  const parsedPage = pageRaw ? Number(normalizeNumberInput(pageRaw)) : NaN;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const takeRaw = get('take');
  const parsedTakeCandidate = takeRaw ? Number(normalizeNumberInput(takeRaw)) : defaultTake;
  const parsedTake = Number.isFinite(parsedTakeCandidate) && parsedTakeCandidate > 0 ? parsedTakeCandidate : defaultTake;
  const take = Math.min(parsedTake || defaultTake, 100);

  const where: any = {};
  if (status) where.status = status;
  if (qRaw) {
    const or: any[] = [];
    const codeTerm = qDisplay || qRaw;
    if (codeTerm) {
      or.push({ code: { contains: codeTerm, mode: "insensitive" } });
    }
    if (qNorm && qNorm !== codeTerm) {
      or.push({ code: { contains: qNorm, mode: "insensitive" } });
    }
    if (qNorm) {
      or.push({ customer: { is: { phone: { contains: qNorm } } } });
    }
    if (or.length) where.OR = or;
  }
  if (phoneRaw) {
    const phoneFilter = phoneNorm || phoneDisplay;
    if (phoneFilter) {
      where.customer = { is: { phone: { contains: phoneFilter } } };
    }
  }
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
      q: qDisplay,
      phone: phoneNorm,
      status: status || "",
      createdFrom,
      createdTo,
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
        <form action="/orders" method="get" className="contents">
          <Input type="search" inputMode="search" name="q" defaultValue={qDisplay} placeholder="بحث بالكود أو الجوال" className="input sm:col-span-2" />
          <PhoneInput name="phone" defaultValue={phoneNorm} placeholder="رقم الجوال" className="input" />
          <select name="status" defaultValue={status} className="input">
            <option value="">كل الحالات</option>
            {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Input type="date" name="createdFrom" defaultValue={createdFrom} className="input" />
          <Input type="date" name="createdTo" defaultValue={createdTo} className="input" />
          <Input type="text" inputMode="decimal" name="priceMin" defaultValue={priceMinStr} placeholder="سعر من (مثال: 100)" title="يتم تحويل الأرقام تلقائيًا إلى الإنجليزية" className="input" />
          <Input type="text" inputMode="decimal" name="priceMax" defaultValue={priceMaxStr} placeholder="سعر إلى (مثال: 2000)" title="يتم تحويل الأرقام تلقائيًا إلى الإنجليزية" className="input" />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="icon-ghost" title="بحث" aria-label="بحث" data-label="بحث">
              <Search size={24} />
            </button>
            {(() => {
              const params = new URLSearchParams({
                q: qDisplay,
                status: status || "",
                phone: phoneNorm,
                createdFrom,
                createdTo,
                priceMin: priceMinStr || "",
                priceMax: priceMaxStr || "",
              });
              const csvHref = `/api/orders/export?${params.toString()}`;
              const excelParams = new URLSearchParams(params);
              excelParams.set("format", "excel");
              const excelHref = `/api/orders/export?${excelParams.toString()}`;
              return (
                <>
                  <a className="icon-ghost" title="تصدير CSV" aria-label="تصدير CSV" data-label="تصدير CSV" href={csvHref}>
                    <FileDown size={24} />
                  </a>
                  <a className="icon-ghost" title="تصدير Excel" aria-label="تصدير Excel" data-label="تصدير Excel" href={excelHref}>
                    <FileSpreadsheet size={24} />
                  </a>
                </>
              );
            })()}
            <a className="icon-ghost" title="إعادة تعيين" aria-label="إعادة تعيين" data-label="إعادة" href="/orders">
              <RotateCcw size={24} />
            </a>
          </div>
        </form>
      </ActionBar>

      <div className="card tonal p-0">
        <div className="card-header">
          <h2 className="card-title">قائمة الطلبات</h2>
        </div>
        <div className="card-section overflow-x-auto">
          <Table className="orders-table">
            <THead>
              <TR>
                <TH className="whitespace-nowrap text-right">الكود</TH>
                <TH className="text-right">العميل</TH>
                <TH className="whitespace-nowrap text-right">الجوال</TH>
                <TH className="text-right">الخدمة</TH>
                <TH className="text-center">الحالة</TH>
                <TH className="text-center">واتساب</TH>
                <TH className="text-center">سريع</TH>
                <TH className="text-center">إجراء</TH>
              </TR>
            </THead>
          <TBody>
            {items.map((o) => (
                <TR key={o.id} className="orders-row rounded-xl transition-all">
                  <TD className="font-mono whitespace-nowrap text-right"><a className="text-blue-600" href={`/track/${o.code}`}>{toLatinDigits(o.code)}</a></TD>
                  <TD className="text-right">{o.customer.name}</TD>
                  <TD className="whitespace-nowrap text-right">{toLatinDigits(o.customer.phone)}</TD>
                <TD className="text-right">{o.service}</TD>
                <TD className="text-center"><StatusBadge status={o.status as any} /></TD>
                <TD className="text-center">
                  {(() => {
                    const originalPrice = Number(o.originalPrice ?? 0);
                    const collected = Number(o.collectedPrice ?? 0);
                    const discount = Math.max(0, originalPrice - collected);
                    return (
                      <WhatsAppButton
                        phone={toLatinDigits(o.customer.phone)}
                        templateKey={orderTemplateForStatus(o.status) as any}
                        params={{
                          customerName: o.customer.name,
                          orderCode: toLatinDigits(o.code),
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
                <TD className="text-center"><QuickStatus orderId={o.id} current={o.status} /></TD>
                <TD className="text-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link href={`/orders/${o.id}`} className="action-pill" title="تفاصيل الطلب" aria-label="تفاصيل الطلب">
                      <Eye size={18} />
                      <span>تفاصيل</span>
                    </Link>
                    {(!(o.collectedPrice) && o.status !== "DELIVERED") ? (
                      <EditOrderDialog
                        order={{ id: o.id, service: o.service, deviceModel: (o as any).deviceModel || undefined, imei: (o as any).imei || undefined, originalPrice: Number(o.originalPrice) }}
                        variant="pill"
                      />
                    ) : null}
                    <DeleteOrderButton orderId={o.id} variant="pill" />
                    {o.status !== "DELIVERED" && (
                      <DeliverDialog
                        orderId={o.id}
                        defaultAmount={Number(o.originalPrice)}
                        phone={toLatinDigits(o.customer.phone)}
                        customerName={o.customer.name}
                        variant="pill"
                      />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
          </Table>
        </div>
      </div>

      <div className="card tonal interactive flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">إجمالي: {toLatinDigits(total)} — صفحة {toLatinDigits(page)} من {toLatinDigits(pages)}</div>
        <div className="flex items-center gap-2">
          <a className="btn-outline h-8 px-3 text-sm disabled:opacity-50" aria-disabled={page<=1} href={`/orders?${makeQS({ page: Math.max(1, page-1) })}`}>السابق</a>
          <a className="btn-outline h-8 px-3 text-sm disabled:opacity-50" aria-disabled={page>=pages} href={`/orders?${makeQS({ page: Math.min(pages, page+1) })}`}>التالي</a>
          <form className="flex items-center gap-1" action="/orders">
            {/** preserve filters */}
            <input type="hidden" name="q" value={qDisplay} />
            <input type="hidden" name="phone" value={phoneNorm} />
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
