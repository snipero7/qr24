import { prisma } from "@/server/db";
import { verifySignature } from "@/server/qr";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function TrackPage({ params, searchParams }: { params: { code: string }, searchParams: { t?: string } }) {
  const code = params.code;
  const t = typeof searchParams.t === "string" ? searchParams.t : undefined;
  const order = await prisma.order.findUnique({ where: { code }, select: { code: true, status: true, deviceModel: true, updatedAt: true } });

  if (!order) {
    return <div className="p-6">لا يوجد طلب بهذا الكود.</div>;
  }

  const verified = t ? verifySignature(code, t) : true; // نسمح بدون توقيع في التطوير

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">تتبع الطلب</h1>
      {!verified && <p className="text-red-600">توقيع غير صالح</p>}
      <div className="space-y-2">
        <p>كود الطلب: <b className="font-mono">{order.code}</b></p>
        <p className="flex items-center gap-2">الحالة الحالية: <StatusBadge status={order.status as any} /></p>
        {order.deviceModel && <p>نوع الجهاز: {order.deviceModel}</p>}
        <p className="text-sm text-gray-500">آخر تحديث: {new Date(order.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
