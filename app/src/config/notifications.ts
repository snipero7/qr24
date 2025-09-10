export const storeConfig = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "متجري",
  storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || "العنوان هنا",
};

export const templates = {
  "order.ready": `مرحباً {customerName} 👋\nطلبك رقم {orderCode} ({service}) جاهز للاستلام.\nالعنوان: {storeAddress}.`,
  "order.delivered": `شكراً {customerName} 🙏\nتم تسليم جهازك مقابل {collectedPrice} ر.س.\nإيصالك: {receiptUrl}\nمتجر {storeName}.`,
  "debt.reminder": `السلام عليكم {shopName}،\nهذا تذكير بالمبلغ المتبقي {remaining} ر.س مقابل ({service}).`,
} as const;

export type TemplateKey = keyof typeof templates;

