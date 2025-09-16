export type OrderStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "READY"
  | "DELIVERED"
  | "CANCELED";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد العمل",
  WAITING_PARTS: "بانتظار قطع",
  READY: "جاهز للتسليم",
  DELIVERED: "تم التسليم",
  CANCELED: "ملغي",
};

export type DebtStatus = "OPEN" | "PARTIAL" | "PAID";

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  OPEN: "مفتوح",
  PARTIAL: "مدفوع جزئياً",
  PAID: "مدفوع",
};

export function statusToArabic(status: string): string {
  return (STATUS_LABELS as any)[status] ?? (DEBT_STATUS_LABELS as any)[status] ?? status;
}
