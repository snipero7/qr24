import { prisma } from "@/server/db";
import { makeQrPayload } from "@/server/qr";

export default async function ReceiptPrintPage({ params }: { params: { id: string } }) {
  const o = await prisma.order.findUnique({ where: { id: params.id }, include: { customer: true } });
  if (!o) return <div className="p-6">لا يوجد طلب.</div>;
  const { dataUrl } = await makeQrPayload(o.code);

  return (
    <div className="max-w-3xl mx-auto p-8 print:p-0">
      <div className="flex items-start justify-between mb-6">
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
        <Info label="السعر التقديري" value={String(o.originalPrice)} />
        {o.collectedPrice && <Info label="المبلغ المُحصّل" value={String(o.collectedPrice)} />}
        {o.collectedAt && <Info label="تاريخ التسليم" value={new Date(o.collectedAt).toLocaleString()} />}
      </div>
      <p className="text-xs text-gray-500">هذا الإيصال يحتوي رمز QR لتتبع الطلب دون كشف بيانات حساسة.</p>
      <div className="mt-6 no-print">
        <button onClick={() => window.print()} className="border rounded px-3 py-2">طباعة</button>
      </div>
      <style>{`@media print { .no-print { display:none } body { background: #fff } }`}</style>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded p-3 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
