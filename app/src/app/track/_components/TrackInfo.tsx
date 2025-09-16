"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { STATUS_LABELS } from "@/lib/statusLabels";
import { toLatinDigits } from "@/lib/utils";

const STATUS_LABELS_EN: Record<string, string> = {
  NEW: "Received",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  READY: "Ready for Pickup",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
};

type StatusLog = {
  id: string;
  from?: string | null;
  to: string;
  note?: string | null;
  at: string;
};

type TimelineStep = {
  status: string;
  reached: boolean;
  date?: string | null;
  note?: string | null;
};

type OtherOrder = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
};

type TrackInfoProps = {
  order: {
    code: string;
    status: string;
    deviceModel?: string | null;
    service: string;
    createdAt: string;
    updatedAt: string;
    customer: { name: string; phone: string };
    collectedPrice?: number | null;
    receiptUrl?: string | null;
    collectedAt?: string | null;
  };
  statusLogs: StatusLog[];
  timeline: TimelineStep[];
  qrDataUrl: string;
  shareUrl: string;
  whatsappLink?: string;
  callLink?: string;
  storeInfo?: { name?: string | null; address?: string | null; phone?: string | null };
  otherOrders: OtherOrder[];
};

export function TrackInfo({
  order,
  statusLogs,
  timeline,
  qrDataUrl,
  shareUrl,
  whatsappLink,
  callLink,
  storeInfo,
  otherOrders,
}: TrackInfoProps) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const codeDisplay = useMemo(() => toLatinDigits(order.code), [order.code]);
  const customerPhoneDisplay = useMemo(() => toLatinDigits(order.customer.phone), [order.customer.phone]);

  const labels = useMemo(() => ({
    ar: {
      orderDetails: "تفاصيل الطلب",
      statusHistory: "سجل الحالات",
      otherDevices: "طلبات أخرى لهذا العميل",
      customer: "العميل",
      device: "الجهاز",
      service: "الخدمة",
      createdAt: "تاريخ الإنشاء",
      updatedAt: "آخر تحديث",
      collectedPrice: "المبلغ المحصّل",
      collectedAt: "تاريخ التحصيل",
      receipt: "إيصال التسليم",
      share: "مشاركة رابط التتبع",
      contact: "تواصل سريع",
      timelineTitle: "تقدّم الحالة",
      whatsapp: "واتساب",
      call: "اتصال",
      trackTitle: `تتبع الطلب ${codeDisplay}`,
      statusLabel: "الحالة الحالية",
      store: "المتجر",
      copySuccess: "تم نسخ الرابط",
    },
    en: {
      orderDetails: "Order Details",
      statusHistory: "Status History",
      otherDevices: "More Orders for this Customer",
      customer: "Customer",
      device: "Device",
      service: "Service",
      createdAt: "Created At",
      updatedAt: "Last Update",
      collectedPrice: "Collected Amount",
      collectedAt: "Collected At",
      receipt: "Delivery Receipt",
      share: "Share Tracking Link",
      contact: "Quick Contact",
      timelineTitle: "Status Timeline",
      whatsapp: "WhatsApp",
      call: "Call",
      trackTitle: `Tracking order ${codeDisplay}`,
      statusLabel: "Current Status",
      store: "Store",
      copySuccess: "Link copied",
    },
  }), [order.code]);

  function statusLabel(status: string) {
    return lang === "ar" ? STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status : STATUS_LABELS_EN[status] ?? status;
  }

  function formatDate(input?: string | null) {
    if (!input) return "—";
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "—";
    const baseOptions: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short", calendar: "gregory" };
    if (lang === "ar") {
      try {
        return new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", baseOptions).format(date);
      } catch {
        return toLatinDigits(date.toLocaleString("ar-SA", baseOptions));
      }
    }
    try {
      return new Intl.DateTimeFormat("en-US", baseOptions).format(date);
    } catch {
      return toLatinDigits(date.toLocaleString("en-US", baseOptions));
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Order ${codeDisplay}`,
          text: lang === "ar" ? "تابع حالة طلبك" : "Track your order",
          url: shareUrl,
        });
        return;
      }
    } catch {
      // fall back to copy below
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(labels[lang].copySuccess);
    } catch {
      alert(shareUrl);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{labels[lang].statusLabel}</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>{statusLabel(order.status)}</span>
            <span className="text-base text-gray-500">#{codeDisplay}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang("ar")}
            className={`btn-outline h-8 px-3 text-xs ${lang === "ar" ? "bg-[var(--surface)] font-semibold" : "opacity-60"}`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`btn-outline h-8 px-3 text-xs ${lang === "en" ? "bg-[var(--surface)] font-semibold" : "opacity-60"}`}
          >
            English
          </button>
        </div>
      </header>

      <section className="card tonal">
        <div className="card-header">
          <h2 className="card-title">{labels[lang].orderDetails}</h2>
          <p className="card-subtitle">{labels[lang].trackTitle}</p>
        </div>
        <div className="card-section grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InfoItem label={labels[lang].customer} value={`${order.customer.name} (${customerPhoneDisplay})`} />
          <InfoItem label={labels[lang].device} value={order.deviceModel || "—"} />
          <InfoItem label={labels[lang].service} value={order.service} />
          <InfoItem label={labels[lang].createdAt} value={formatDate(order.createdAt)} />
          <InfoItem label={labels[lang].updatedAt} value={formatDate(order.updatedAt)} />
          {order.collectedPrice ? (
            <>
              <InfoItem
                label={labels[lang].collectedPrice}
                value={`${Number(order.collectedPrice).toFixed(2)} ر.س`}
              />
              <InfoItem label={labels[lang].collectedAt} value={formatDate(order.collectedAt)} />
            </>
          ) : null}
        </div>
        <div className="card-section flex flex-wrap items-center gap-3">
          <button type="button" onClick={shareLink} className="btn-primary h-9 px-4 text-sm">
            {labels[lang].share}
          </button>
          {whatsappLink ? (
            <Link href={whatsappLink} className="btn-outline h-9 px-4 text-sm" target="_blank" rel="noreferrer">
              {labels[lang].whatsapp}
            </Link>
          ) : null}
          {callLink ? (
            <Link href={callLink} className="btn-outline h-9 px-4 text-sm">
              {labels[lang].call}
            </Link>
          ) : null}
          {order.receiptUrl ? (
            <Link href={order.receiptUrl} className="btn-outline h-9 px-4 text-sm" target="_blank" rel="noreferrer">
              {labels[lang].receipt}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="card tonal">
        <div className="card-header">
          <h2 className="card-title">{labels[lang].timelineTitle}</h2>
        </div>
        <div className="card-section">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  {timeline.map((step, idx) => (
                    <div key={step.status} className="flex-1 text-center">
                      <div
                        className={`mx-auto h-8 w-8 rounded-full border flex items-center justify-center text-xs font-semibold shadow-sm transition-colors ${
                          step.reached ? "bg-blue-600 text-white" : "bg-white text-gray-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="mt-2 text-[12px] text-gray-600">
                        {statusLabel(step.status)}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {step.date ? formatDate(step.date) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 p-2 shadow-sm">
                  <img src={qrDataUrl} alt="QR" className="h-28 w-28" />
                </div>
              </div>
            </div>
            <div className="border-t pt-3 space-y-2 text-sm text-gray-600">
              {statusLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-semibold">{statusLabel(log.to)}</span>
                  <span>{formatDate(log.at)}</span>
                  {log.note ? <span className="text-gray-500">{log.note}</span> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {otherOrders.length ? (
        <section className="card tonal">
          <div className="card-header">
            <h2 className="card-title">{labels[lang].otherDevices}</h2>
          </div>
          <div className="card-section">
            <ul className="space-y-2 text-sm">
              {otherOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 px-3 py-2">
                  <div>
                    <div className="font-semibold">#{toLatinDigits(o.code)}</div>
                    <div className="text-gray-500 text-xs">{formatDate(o.createdAt)}</div>
                  </div>
                  <div className="text-sm font-medium">{statusLabel(o.status)}</div>
                  <Link href={`/track/${o.code}`} className="text-blue-600 text-xs">
                    {lang === "ar" ? "عرض" : "View"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {storeInfo?.name || storeInfo?.address ? (
        <section className="card tonal">
          <div className="card-header">
            <h2 className="card-title">{labels[lang].store}</h2>
          </div>
          <div className="card-section text-sm text-gray-600 space-y-1">
            {storeInfo?.name ? <p>{toLatinDigits(storeInfo.name)}</p> : null}
            {storeInfo?.address ? <p>{toLatinDigits(storeInfo.address)}</p> : null}
            {storeInfo?.phone ? <p>{toLatinDigits(storeInfo.phone)}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  const display = toLatinDigits(value);
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-[var(--surface)] p-3 text-right">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-[var(--foreground)] break-words">{display}</div>
    </div>
  );
}
