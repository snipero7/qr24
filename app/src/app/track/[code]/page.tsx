import { prisma } from "@/server/db";
import { getSettings } from "@/server/settings";
import { makeQrPayload, verifySignature } from "@/server/qr";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { STATUS_LABELS } from "@/lib/statusLabels";
import { TrackInfo } from "@/app/track/_components/TrackInfo";
import { toLatinDigits } from "@/lib/utils";
import { ThemeSetter } from "@/components/ThemeSetter";

const STATUS_FLOW = ["NEW", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED", "CANCELED"] as const;

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const p: any = await params;
  const sp: any = await searchParams;
  const code: string | undefined = p?.code ?? p?.params?.code;
  if (!code) {
    return renderNotFound();
  }
  const rawT = sp?.t;
  const signature = typeof (Array.isArray(rawT) ? rawT[0] : rawT) === "string" ? (Array.isArray(rawT) ? rawT[0] : rawT) : undefined;

  const order = await prisma.order.findUnique({
    where: { code },
    include: {
      customer: true,
      statusLogs: { orderBy: { at: "asc" } },
    },
  });

  if (!order) {
    return renderNotFound();
  }

  const verified = signature ? verifySignature(code, signature) : true;

  const settings = await getSettings();
  const { dataUrl, payload } = await makeQrPayload(order.code);

  const currentIndex = STATUS_FLOW.indexOf(order.status as any);
  const timeline = STATUS_FLOW.map((status, idx) => {
    const log = order.statusLogs.find((l) => l.to === status);
    const reached = idx <= currentIndex || order.status === "DELIVERED" || order.status === "CANCELED";
    return {
      status,
      reached,
      date: log?.at?.toISOString() ?? null,
      note: log?.note ?? null,
    };
  });

  if (order.status === "CANCELED") {
    const canceledLog = order.statusLogs.find((l) => l.to === "CANCELED");
    const entry = timeline.find((step) => step.status === "CANCELED");
    if (entry) {
      entry.reached = true;
      entry.date = canceledLog?.at?.toISOString() ?? order.updatedAt.toISOString();
      entry.note = canceledLog?.note ?? null;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const pathWithSignature = payload?.t ? `/track/${order.code}?t=${payload.t}` : `/track/${order.code}`;
  const shareUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}${pathWithSignature}` : pathWithSignature;

  const customerPhoneAscii = toLatinDigits(order.customer.phone || "");
  const whatsappLink = customerPhoneAscii
    ? buildWhatsAppLink(customerPhoneAscii, "مرحباً {customerName}، حالة طلبك {statusLabel} (#{code}). يمكنك المتابعة عبر {link}", {
        customerName: order.customer.name,
        statusLabel: STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ?? order.status,
        code: toLatinDigits(order.code),
        link: shareUrl,
      })
    : undefined;

  const rawCallInput = settings.storePhone || order.customer.phone || "";
  const rawCall = toLatinDigits(rawCallInput);
  const callDigits = rawCall.replace(/[^0-9+]/g, "");
  const callLink = callDigits ? `tel:${callDigits}` : undefined;

  const otherOrders = await prisma.order.findMany({
    where: { customerId: order.customerId, NOT: { id: order.id } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, code: true, status: true, createdAt: true },
  });

  return (
    <div className="container max-w-4xl py-6 space-y-4">
      <ThemeSetter theme={settings.uiTheme === "dark" ? "dark" : "light"} />
      {!verified ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          توقيع الرابط غير صالح، سيتم عرض المعلومات لأغراض مرجعية فقط.
        </div>
      ) : null}
      <TrackInfo
        order={{
          code: order.code,
          status: order.status,
          deviceModel: order.deviceModel,
          service: order.service,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          collectedPrice: order.collectedPrice ? Number(order.collectedPrice) : undefined,
          collectedAt: order.collectedAt ? order.collectedAt.toISOString() : undefined,
          receiptUrl: order.receiptUrl ?? undefined,
          customer: {
            name: order.customer.name,
            phone: order.customer.phone,
          },
        }}
        statusLogs={order.statusLogs.map((log) => ({
          id: log.id,
          from: log.from,
          to: log.to,
          note: log.note,
          at: log.at.toISOString(),
        }))}
        timeline={timeline}
        qrDataUrl={dataUrl}
        shareUrl={shareUrl}
        whatsappLink={whatsappLink || undefined}
        callLink={callLink}
        storeInfo={{
          name: settings.storeName,
          address: settings.storeAddress,
          phone: settings.storePhone,
        }}
        otherOrders={otherOrders.map((o) => ({
          id: o.id,
          code: o.code,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

function renderNotFound() {
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
