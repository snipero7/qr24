import { prisma } from "@/server/db";
import { DeliverDialog } from "@/components/DeliverDialog";
import { ChangeStatusForm } from "@/components/ChangeStatusForm";
import Link from "next/link";

export default async function OrderShow({ params }: { params: { id: string } }) {
  const o = await prisma.order.findUnique({ where: { id: params.id }, include: { customer: true, statusLogs: { orderBy: { at: "desc" } } } });
  if (!o) return <div className="p-6">لا يوجد طلب.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">تفاصيل الطلب</h1>
        <Link className="text-blue-600" href={`/track/${o.code}`}>عرض تتبع</Link>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Info label="الكود" value={<code className="font-mono">{o.code}</code>} />
        <Info label="الحالة" value={o.status} />
        <Info label="العميل" value={`${o.customer.name} (${o.customer.phone})`} />
        <Info label="الخدمة" value={o.service} />
        {o.deviceModel && <Info label="الجهاز" value={o.deviceModel} />}
        {o.imei && <Info label="IMEI" value={o.imei} />}
        <Info label="السعر التقديري" value={`${o.originalPrice}`} />
        {o.collectedPrice && <Info label="المحصّل" value={`${o.collectedPrice}`} />}
        {o.receiptUrl && <Info label="الإيصال" value={<a className="text-blue-600" href={o.receiptUrl} target="_blank">تنزيل PDF</a>} />}
      </section>

      <div className="flex gap-4 items-center">
        <ChangeStatusForm orderId={o.id} current={o.status} />
        {o.status !== "DELIVERED" && <DeliverDialog orderId={o.id} />}
      </div>

      <section>
        <h2 className="font-semibold mb-2">سجل الحالات</h2>
        <ul className="space-y-1 text-sm">
          {o.statusLogs.map(l => (
            <li key={l.id} className="border rounded p-2">
              <div>من: {l.from || "—"} → إلى: <b>{l.to}</b></div>
              <div className="text-gray-500">{new Date(l.at).toLocaleString()} {l.note?`— ${l.note}`:''}</div>
            </li>
          ))}
        </ul>
      </section>
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
