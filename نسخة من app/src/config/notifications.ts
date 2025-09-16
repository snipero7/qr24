export const storeConfig = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "متجري",
  storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || "العنوان هنا",
};

export const templates = {
  // Order status updates
  "order.new": `مرحباً {customerName} 👋\nتم تسجيل طلبك رقم {orderCode} لخدمة ({service}).\nسنبدأ العمل ونوافيك بأي تحديث.\nمتجر {storeName} — {storeAddress}`,
  "order.in_progress": `تحديث طلبك 🛠️\nنعمل حالياً على جهازك (طلب {orderCode}) لخدمة ({service}).\nسنعلمك فور الانتهاء.\nمتجر {storeName}`,
  "order.waiting_parts": `تحديث طلبك ⏳\nطلب {orderCode} بانتظار وصول قطعة/قطع الغيار اللازمة لإكمال الخدمة ({service}).\nسنبلغك فور توفرها — شكراً لصبرك.\nمتجر {storeName}`,
  "order.ready": `مرحباً {customerName} 👋\nطلبك رقم {orderCode} ({service}) جاهز للاستلام.\nالعنوان: {storeAddress}.`,
  "order.canceled": `نأسف لإلغاء طلبك رقم {orderCode}.\nإن رغبت بالمساعدة أو إعادة الجدولة يسعدنا تواصلك معنا.\nمتجر {storeName} — {storeAddress}`,

  // Delivery follow-up
  "order.delivered": `شكراً {customerName} 🙏\nتم تسليم جهازك — المبلغ بعد الخصم: {collectedPrice} ر.س.\nالسعر الأساسي + الإضافات: {originalPrice} ر.س\nرسوم إضافية: {extraCharge} ر.س {extraReason}\nالخصم: {discount} ر.س.\nإيصالك: {receiptUrl}\nمتجر {storeName}.`,

  // Debts
  "debt.reminder": `السلام عليكم {shopName}،\nهذا تذكير بالمبلغ المتبقي {remaining} ر.س مقابل ({service}).`,
  "debt.open": `السلام عليكم {shopName}،\nإجمالي المبلغ {amount} ر.س مقابل ({service}).\nالمدفوع: {paid} ر.س — المتبقي: {remaining} ر.س.\nنقدّر تعاونكم وسعداء بخدمتكم دائمًا.`,
  "debt.partial": `تحديث الدفعات {shopName} 💳\nاستلمنا {paid} ر.س مقابل ({service}).\nالمتبقي الآن {remaining} ر.س من إجمالي {amount} ر.س.\nشاكرين لكم تعاونكم.`,
  "debt.paid": `تم إغلاق المبلغ المستحق ✅\nنشكر تعاونكم {shopName}.\nالخدمة: ({service}) — إجمالي {amount} ر.س وقد تم السداد بالكامل.\nمتجر {storeName}.`,
} as const;

export type TemplateKey = keyof typeof templates;

// Helper: choose order template by status
export function orderTemplateForStatus(status: string): TemplateKey {
  switch (status) {
    case "NEW":
      return "order.new";
    case "IN_PROGRESS":
      return "order.in_progress";
    case "WAITING_PARTS":
      return "order.waiting_parts";
    case "READY":
      return "order.ready";
    case "CANCELED":
      return "order.canceled";
    case "DELIVERED":
    default:
      return "order.delivered";
  }
}

// Helper: choose debt template by status
export function debtTemplateForStatus(status: string): TemplateKey {
  switch (status) {
    case "OPEN":
      return "debt.open";
    case "PARTIAL":
      return "debt.partial";
    case "PAID":
      return "debt.paid";
    default:
      return "debt.reminder";
  }
}

// Human-friendly descriptions for tooltips
export const templateDescriptions: Record<TemplateKey, string> = {
  "order.new": "إشعار تسجيل الطلب",
  "order.in_progress": "تحديث: قيد العمل",
  "order.waiting_parts": "تحديث: بانتظار القطع",
  "order.ready": "إشعار جاهزية للاستلام",
  "order.canceled": "إشعار إلغاء الطلب",
  "order.delivered": "شكر وتسليم مع إيصال",
  "debt.reminder": "تذكير بالمبلغ المتبقي",
  "debt.open": "تذكير حالة الدين (مفتوح)",
  "debt.partial": "تحديث دين: دفعة جزئية",
  "debt.paid": "إغلاق الدين (مدفوع)",
};

export function describeTemplate(key: TemplateKey): string {
  return templateDescriptions[key] || "إرسال واتساب";
}
