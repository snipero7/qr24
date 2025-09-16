import { prisma } from "@/server/db";

export type SettingsPayload = {
  storeName: string;
  storePhone?: string | null;
  storeAddress?: string | null;
  storeLogoUrl?: string | null;
  receiptFooter?: string | null;
  receiptLang?: "AR" | "AR_EN";
  receiptQrEnabled?: boolean;
  receiptStampUrl?: string | null;
  waTemplates?: Record<string, any>;
  waEnabled?: boolean;
  debtReminderDays?: number;
  uiTheme?: "light" | "dark";
  uiTableRows?: number;
  gdriveAccessToken?: string | null;
  gdriveRefreshToken?: string | null;
  gdriveExpiry?: Date | null;
  backupAutoEnabled?: boolean;
  backupWeekday?: number;
  backupHour?: number;
};

const DEFAULT_TEMPLATES = {
  "order.ready": "مرحباً {customerName} 👋\\nطلبك رقم {orderCode} ({service}) جاهز للاستلام.\\nالعنوان: {storeAddress}.",
  "order.delivered": "شكراً {customerName} 🙏\\nتم تسليم جهازك — المبلغ بعد الخصم: {collectedPrice} ر.س.\\nإيصالك: {receiptUrl}",
  "debt.reminder": "السلام عليكم {shopName}،\\nهذا تذكير بالمبلغ المتبقي {remaining} ر.س مقابل ({service}).",
};

export async function getSettings() {
  const s = await prisma.settings.findFirst();
  if (s) return s;
  return prisma.settings.create({
    data: {
      storeName: process.env.NEXT_PUBLIC_STORE_NAME || "منصة الصيانة",
      storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || null,
      uiTheme: "light",
      uiTableRows: 25,
      waTemplates: DEFAULT_TEMPLATES as any,
    },
  });
}

export async function updateSettings(payload: SettingsPayload) {
  const current = await getSettings();
  return prisma.settings.update({
    where: { id: current.id },
    data: {
      ...payload,
      waTemplates: (payload.waTemplates as any) ?? (current.waTemplates as any),
    },
  });
}

export function shouldRunBackup(now: Date, weekday: number, hour: number) {
  return now.getUTCDay() === weekday && now.getUTCHours() === hour;
}

