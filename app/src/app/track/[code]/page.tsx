import { prisma } from "@/server/db";
import { verifySignature } from "@/server/qr";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatYMD_HM } from "@/lib/date";

export default async function TrackPage({ params, searchParams }: { params: Promise<{ code: string }>, searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const p: any = await params;
  const sp: any = await searchParams;
  const code: string | undefined = p?.code ?? p?.params?.code;
  const rawT = sp?.t;
  const t = typeof (Array.isArray(rawT) ? rawT[0] : rawT) === "string" ? (Array.isArray(rawT)? rawT[0]: rawT) : undefined;
  const order = await prisma.order.findUnique({ where: { code }, select: { code: true, status: true, deviceModel: true, updatedAt: true } });

  if (!order) {
    return (
      <div className="container max-w-xl mx-auto">
        <section className="card tonal p-0">
          <div className="card-header">
            <h2 className="card-title">تتبع الطلب</h2>
          </div>
          <div className="card-section text-sm">لا يوجد طلب بهذا الكود.</div>
        </section>
      </div>
    );
  }

  const verified = t ? verifySignature(code, t) : true; // نسمح بدون توقيع في التطوير

  return (
    <div className="container max-w-xl mx-auto">
      <section className="card tonal p-0">
        <div className="card-header">
          <h2 className="card-title">تتبع الطلب</h2>
        </div>
        <div className="card-section space-y-2">
          {!verified && <p className="text-red-600">توقيع غير صالح</p>}
          <p>كود الطلب: <b className="font-mono">{order.code}</b></p>
          <p className="flex items-center gap-2">الحالة الحالية: <StatusBadge status={order.status as any} /></p>
          {order.deviceModel && <p>نوع الجهاز: {order.deviceModel}</p>}
          <p className="text-sm text-gray-500">آخر تحديث: {formatYMD_HM(order.updatedAt as any)}</p>
        </div>
      </section>
    </div>
  );
}
