تصميم واجهة RTL + Theme احترافي لـ Next.js + Tailwind + shadcn/ui
العنوان: طبّق تصميم واجهة RTL احترافي (Light/Dark) لمشروع Next.js باستخدام Tailwind + shadcn/ui
المطلوب (Goals)
واجهة عربية RTL بالكامل مع دعم Light/Dark.
Theme ألوان وهوية بصرية متناسقة.
مكوّنات جاهزة قابلة لإعادة الاستخدام: KPI Card, StatusBadge, DataTable, ActionBar, FormGrid.
صفحات مرتّبة: Dashboard, Orders (index/new/[id]), Debts, Track.
تحسينات بصرية: تباعد موحّد، ظلال لطيفة، شارات حالات ملوّنة، تجربة استخدام احترافية.
1) إعداد RTL و Theme
في app/layout.tsx:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
في globals.css أضف متغيرات الألوان (يمكن تعديلها لاحقًا):
:root{
  --color-primary: #1E3A8A;   /* indigo-900 */
  --color-primary-700:#1D4ED8;/* indigo-700 */
  --color-accent:  #38BDF8;   /* sky-400   */
  --surface: #FFFFFF;
  --text: #0B1220;
  --muted: #6B7280;
}
.dark{
  --surface: #0F172A; /* slate-900 */
  --text: #FFFFFF;
}
أزرار وأدوات جاهزة عبر كلاسّات Tailwind:
زر أساسي: bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white rounded-lg h-10 px-4
بطاقة: rounded-2xl border shadow-sm p-6 bg-[var(--surface)]
حقول: rounded-lg border bg-[var(--surface)]
تركيز: focus:ring-2 focus:ring-[color:rgb(30_58_138_/_.4)]
إن توفّر plugin RTL لـ Tailwind استخدمه، وإلا يكفي dir="rtl".
2) نظام الطباعة والمسافات
h1: text-2xl font-bold, h2: text-lg font-semibold.
النص الأساسي: text-sm sm:text-base.
أرقام/مبالغ: text-xl font-semibold.
مسافات موحّدة: استخدام container mx-auto max-w-7xl p-6 + gap-6 في الشبكات.
3) مكوّنات قابلة لإعادة الاستخدام (أنشئ ملفات TSX)
KPI Card: props: { title: string; value: string | number; icon?: ReactNode }
ستايل: بطاقة كبيرة مع أيقونة صغيرة يمين العنوان.
StatusBadge: props: { status: 'NEW'|'IN_PROGRESS'|'WAITING_PARTS'|'READY'|'DELIVERED'|'CANCELED' }
الألوان:
NEW: bg #DBEAFE, text #1E3A8A
IN_PROGRESS: #FEF3C7 / #B45309
WAITING_PARTS: #EDE9FE / #6D28D9
READY: #D1FAE5 / #065F46
DELIVERED: #E5E7EB / #374151
CANCELED: #FEE2E2 / #991B1B
كلاس: inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
DataTable (مبسّط): رأس ثابت، صفوف مع hover، حالة فارغة.
جدول: w-full text-sm, رأس: bg-black/5 dark:bg-white/5, صف: hover:bg-black/5 dark:hover:bg-white/5.
ActionBar: شريط أعلى الجداول (بحث + Select حالة + DateRange).
FormGrid: شبكة نموذج عمودين على الشاشات الواسعة (grid grid-cols-1 md:grid-cols-2 gap-4).
4) تخطيط الصفحات
/dashboard
شبكة 2×3 من KPI Card: (إجمالي الطلبات، الإيراد المحصّل، قيد العمل، الديون غير المسددة، دخل اليوم، دخل الشهر).
جدول “أحدث الطلبات”: أعمدة (code، العميل، الخدمة، الحالة StatusBadge، التاريخ، تفاصيل).
/orders
index: ActionBar (بحث، حالة) + DataTable.
new: FormGrid لحقول (اسم العميل/جوال/IMEI/موديل/الخدمة/السعر/ملاحظات) + زر أساسي يمين: “حفظ وإنشاء”.
[id]: بطاقة معلومات الطلب، سجل الحالات، أزرار يمين: READY / DELIVER (Dialog) / PRINT / WHATSAPP.
/debts
جدول رئيسي: (المحل، الخدمة، المبلغ، المدفوع، المتبقي، الحالة StatusBadge، تاريخ، تحكم).
Dialog “دفعة” + قائمة دفعات أسفل كل دين.
/track/[code]
صفحة بسيطة جدًا: حالة الطلب StatusBadge + ملخص مختصر.
5) تحسينات Dark Mode
الجذر يحتوي className={cn('min-h-screen', theme==='dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-white text-[#0B1220]')}
البطاقات: bg-[var(--surface)] تلقائيًا تتبدل عبر .dark.
6) أيقونات (lucide-react)
استخدم: ClipboardList, Receipt, Phone, Users, QrCode, Wallet, PiggyBank في البطاقات والأزرار.
7) معايير القبول (Acceptance)
كل الصفحات تعمل بوضوح في RTL (العناوين والمحاذاة إلى اليمين).
تظهر 6 بطاقات KPI في /dashboard بقيم وهمية إن لم تتوفر بيانات.
StatusBadge يستخدم ألوان الحالات المحددة أعلاه في كل الجداول.
الجداول تعرض حالة لا توجد بيانات عند الفراغ.
النماذج تعمل على عمودين على الشاشات الواسعة وعمود واحد على الجوال.
الوضع الداكن يظهر بخلفية داكنة واضحة ونص مقروء.
8) اختبار واجهة (اختياري لكن مفضل)
لقطة مرئية (story/Playwright) لـ /dashboard و/orders/new مع التحقّق من اتجاه RTL.
تحقق أن العنصر <html dir="rtl"> موجود.
تحقق من ظهور شارات الحالات بالألوان الصحيحة.
9) ملاحظات تنفيذية
التزم بـ Tailwind + shadcn/ui؛ لا تغيّر منطق البيانات أو الـ APIs.
الهدف تجميلي فقط: أي تغييرات كود يجب ألا تمسّ الأعمال (business logic).
اجعل الألوان قابلة للتعديل من متغيرات CSS.
المخرجات المتوقعة
كود واجهة مُحدّث: RTL + Theme + مكوّنات معاد استخدامها.
صفحات /dashboard, /orders, /debts, /track محسّنة بصريًا.
توثيق مختصر في README: كيفية تعديل الألوان، وكيفية تفعيل الوضع الداكن.