import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeliverDialog } from "@/components/DeliverDialog";
import { ChangeStatusForm } from "@/components/ChangeStatusForm";
import Link from "next/link";
import { formatYMD_HM } from "@/lib/date";
import { StatusBadge } from "@/components/ui/status-badge";
import { orderTemplateForStatus } from "@/config/notifications";
import { statusToArabic } from "@/lib/statusLabels";
import { DeliveryNotifier } from "@/components/orders/DeliveryNotifier";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { FileDown, Printer, Trash2 } from "lucide-react";
import { RegenerateReceiptButton } from "@/components/RegenerateReceiptButton";
import DeleteOrderButton from "@/components/orders/DeleteOrderButton";
import EditOrderDialog from "@/components/orders/EditOrderDialog";
import fs from "node:fs";
import path from "node:path";
import { toLatinDigits } from "@/lib/utils";

export default async function OrderShow({ params }: { params: Promise<{ id: string }> }) {
  const _params: any = await params;
  const id: string | undefined = _params?.id ?? _params?.params?.id;
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  if (!id) return <div className="p-6">لا يوجد طلب.</div>;
  const o = await prisma.order.findUnique({ where: { id }, include: { customer: true, statusLogs: { orderBy: { at: "desc" } } } });
  if (!o) return <div className="p-6">لا يوجد طلب.</div>;
  const isAdmin = ((session.user as any)?.role === 'ADMIN');
  // Compute a safe download URL only if the file exists
  let downloadUrl: string | undefined = undefined;
  if (o.receiptUrl) {
    downloadUrl = o.receiptUrl;
  } else {
    try {
      const filePath = path.join(process.cwd(), "public", "receipts", `${o.code}.pdf`);
      if (fs.existsSync(filePath)) downloadUrl = `/receipts/${o.code}.pdf`;
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">تفاصيل الطلب</h1>
          <DeliveryNotifier orderId={o.id} initialStatus={o.status} />
        </div>
        <Link className="btn-outline h-9" href={`/track/${o.code}`}>عرض تتبع</Link>
      </div>

      <section className="card tonal">
        <div className="card-header">
          <h2 className="card-title">بيانات الطلب</h2>
        </div>
        <div className="card-section grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="الكود" value={<code className="font-mono">{toLatinDigits(o.code)}</code>} />
          <Info label="الحالة" value={<StatusBadge status={o.status as any} />} />
          <Info label="العميل" value={`${o.customer.name} (${toLatinDigits(o.customer.phone)})`} />
          <Info label="الخدمة" value={o.service} />
        {o.deviceModel && <Info label="الجهاز" value={o.deviceModel} />}
        {o.imei && <Info label="IMEI" value={o.imei} />}
        <Info label="السعر الأساسي" value={toLatinDigits(Number(o.originalPrice))} />
        { (o as any).paymentMethod && (
          <Info
            label="وسيلة الدفع"
            value={ (o as any).paymentMethod === 'CASH' ? 'نقدًا' : 'تحويل' }
          />
        )}
        {typeof (o as any).extraCharge === 'number' && Number((o as any).extraCharge) > 0 && (
          <Info label={`رسوم إضافية${(o as any).extraReason ? ` (${(o as any).extraReason})` : ''}`}
                value={toLatinDigits(Number((o as any).extraCharge))} />
        )}
        {o.collectedPrice && (
          <>
            <Info label="الإجمالي قبل الخصم" value={toLatinDigits(Number(o.originalPrice) + Number((o as any).extraCharge || 0))} />
            <Info label="الخصم" value={`${toLatinDigits(Math.max(0, Number(o.originalPrice) + Number((o as any).extraCharge || 0) - Number(o.collectedPrice)).toFixed(2))} ر.س`} />
            <Info label="بعد الخصم" value={toLatinDigits(Number(o.collectedPrice))} />
          </>
        )}
          {downloadUrl ? (
            <Info
              label="الإيصال"
              value={
                <div className="flex items-center gap-2">
                  <a
                    className="icon-ghost"
                    title="تنزيل PDF"
                    aria-label="تنزيل PDF"
                    href={downloadUrl}
                    target="_blank"
                  >
                    <FileDown size={24} />
                  </a>
                  {isAdmin ? <RegenerateReceiptButton orderId={o.id} /> : null}
                </div>
              }
            />
          ) : (
            isAdmin ? (
              <Info
                label="الإيصال"
                value={<div className="flex items-center gap-2 text-sm text-gray-600"><span>لم يتم توليد الإيصال بعد</span><RegenerateReceiptButton orderId={o.id} /></div>}
              />
            ) : null
          )}
        <Info
          label="طباعة"
          value={
            <a
              className="icon-ghost"
              title="طباعة HTML"
              aria-label="طباعة HTML"
              href={`/orders/${o.id}/receipt`}
              target="_blank"
            >
              <Printer size={24} />
            </a>
          }
        />
        </div>
      </section>

      <div className="flex gap-4 items-center">
        <ChangeStatusForm orderId={o.id} current={o.status} />
        {(!(o.collectedPrice) && o.status !== "DELIVERED") ? (
          <EditOrderDialog order={{ id: o.id, service: o.service, deviceModel: o.deviceModel || undefined, imei: o.imei || undefined, originalPrice: Number(o.originalPrice) }} />
        ) : null}
        {isAdmin && <DeleteOrderButton orderId={o.id} />}
        {o.status !== "DELIVERED" && <DeliverDialog orderId={o.id} defaultAmount={Number(o.originalPrice)} phone={toLatinDigits(o.customer.phone)} customerName={o.customer.name} />}
        {(() => {
          const originalPrice = Number(o.originalPrice ?? 0);
          const collected = Number(o.collectedPrice ?? 0);
          const discount = Math.max(0, originalPrice - collected);
          return (
            <WhatsAppButton
              phone={toLatinDigits(o.customer.phone)}
              templateKey={orderTemplateForStatus(o.status) as any}
              params={{ customerName: o.customer.name, orderCode: toLatinDigits(o.code), service: o.service, collectedPrice: collected, originalPrice, discount, receiptUrl: o.receiptUrl || '' }}
              variant="icon"
            />
          );
        })()}
      </div>

      <section className="card tonal">
        <div className="card-header">
          <h2 className="card-title">سجل الحالات</h2>
        </div>
        <ul className="card-section space-y-1 text-sm">
          {o.statusLogs.map(l => (
            <li key={l.id} className="border rounded p-2">
              <div>
                من: {l.from ? statusToArabic(l.from) : "—"} ← إلى: <b>{statusToArabic(l.to as any)}</b>
              </div>
              <div className="text-gray-500">{formatYMD_HM(l.at as any)} {l.note?`— ${l.note}`:''}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-[var(--surface)] p-3 flex items-baseline justify-between gap-4">
      <div className="text-xs text-gray-500 shrink-0">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
