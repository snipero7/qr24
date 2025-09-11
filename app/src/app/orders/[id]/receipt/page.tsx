import { prisma } from "@/server/db";
import { formatYMD_HM } from "@/lib/date";
import { makeQrPayload } from "@/server/qr";
import { PrintButton } from "@/components/PrintButton";

export default async function ReceiptPrintPage({ params }: { params: { id: string } }) {
  const o = await prisma.order.findUnique({ where: { id: params.id }, include: { customer: true } });
  if (!o) return (
    <div className="max-w-3xl mx-auto p-8 print:p-0">
      <section className="card">لا يوجد طلب.</section>
    </div>
  );
  const { dataUrl } = await makeQrPayload(o.code);

  return (
    <div className="max-w-3xl mx-auto p-8 print:p-0">
      <div className="flex items-start justify-between mb-6 border-b border-black/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold">إيصال تسليم</h1>
          <div className="text-sm text-gray-600">كود الطلب: <span className="font-mono">{o.code}</span></div>
        </div>
        <img src={dataUrl} alt="QR" className="w-32 h-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Info label="العميل" value={`${o.customer.name} (${o.customer.phone})`} />
        <Info label="الخدمة" value={o.service} />
        {o.deviceModel && <Info label="الجهاز" value={o.deviceModel} />}
        {o.imei && <Info label="IMEI" value={o.imei} />}
        <Info label="السعر" value={String(o.originalPrice)} />
        {o.collectedPrice && (
          <>
            <Info label="الخصم" value={`${Math.max(0, Number(o.originalPrice) - Number(o.collectedPrice)).toFixed(2)} ر.س`} />
            <Info label="المبلغ بعد الخصم" value={String(o.collectedPrice)} />
          </>
        )}
        {o.collectedAt && <Info label="تاريخ التسليم" value={formatYMD_HM(o.collectedAt as any)} />}
      </div>
      <div className="grid grid-cols-2 gap-6 mt-10">
        <div>
          <div className="text-sm text-gray-600 mb-2">توقيع العميل</div>
          <div className="h-16 border border-black/10 rounded" />
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-2">ختم المتجر</div>
          <div className="h-16 border border-black/10 rounded" />
        </div>
      </div>
      <p className="text-xs text-gray-500">هذا الإيصال يحتوي رمز QR لتتبع الطلب دون كشف بيانات حساسة.</p>
      <div className="mt-6 no-print">
        <PrintButton />
      </div>
      <style>{`@media print { .no-print { display:none } body { background: #fff } }`}</style>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-black/10 rounded-lg p-3 bg-[var(--surface)]">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
