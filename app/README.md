هذا مشروع Next.js TypeScript لإدارة صيانة الجوالات وفق مستند System Design.md.

## التشغيل محليًا

المتطلبات: Node LTS + pnpm + Docker

1) شغّل قواعد البيانات:

```
docker compose up -d
```

2) عدّل ملف `app/.env` حسب بيئتك (DATABASE_URL/REDIS_URL ...).

3) ولّد عميل Prisma ثم ادفع المخطط:

```
pnpm db:generate
pnpm db:push
```

4) (اختياري) زرع بيانات تجريبية:

```
pnpm db:seed
```

5) شغّل الخادم:

```
pnpm dev
```

Endpoints مهمة:

- GET `/api/health` فحص الصحة
- POST `/api/orders` إنشاء طلب
- PATCH `/api/orders/:id/status` تحديث حالة
- POST `/api/orders/:id/deliver` تسليم مع تحصيل
- POST `/api/debts` إنشاء دين
- POST `/api/debts/:id/payments` إضافة دفعة
- GET `/api/reports/summary` ملخص الإحصاءات
- Page `/track/[code]` تتبع الطلب عبر الكود

## الدخول والصلاحيات

- صفحة الدخول: `/signin`
- مستخدم seed: بريد `admin@example.com` كلمة المرور `admin123`
- مستخدم TECH: بريد `tech@example.com` كلمة المرور `tech123`
- مستخدم CLERK: بريد `clerk@example.com` كلمة المرور `clerk123`
- الصلاحيات:
  - ADMIN: كامل الصلاحيات.
  - CLERK: إنشاء الطلبات، تحديث الحالة، التسليم.
  - TECH: الاطلاع وتحديث الحالة فقط (لا ديون ولا تسليم).
  - CLERK: إنشاء الطلبات والتسليم وتعديل الحالات، بلا صلاحيات ديون.

## إدارة المستخدمين

- صفحة: `/users` (ADMIN فقط)
  - إنشاء مستخدم جديد وتحديد الدور
  - تعديل دور المستخدم

## تخزين الإيصالات (S3/R2)

## إشعارات واتساب (روابط مباشرة)

## تصميم RTL + Theme

- اتجاه RTL مفعّل على الجذر (`html lang="ar" dir="rtl"`).
- متغيرات ألوان قابلة للتعديل في `app/src/app/globals.css`:
  - `--color-primary`, `--color-primary-700`, `--color-accent`, `--surface`, `--text`, `--muted`.
- الوضع الداكن عبر `ThemeToggle` يبدّل `data-theme` و/أو `class=dark` على `<html>`.
- مكونات قابلة لإعادة الاستخدام:
  - `KpiCard`: `app/src/components/ui/kpi-card.tsx`
  - `StatusBadge`: `app/src/components/ui/status-badge.tsx`
  - `DataTable`: `app/src/components/ui/data-table.tsx`
  - `ActionBar`: `app/src/components/ui/action-bar.tsx`
  - `FormGrid`: `app/src/components/ui/form-grid.tsx`
- صفحات محدّثة: Dashboard/Orders/Debts/Track تستخدم الشارات والجداول والبطاقات الجديدة.
- الأدوات: `src/lib/whatsapp.ts`
  - `toE164KSA`: يحوّل الأرقام السعودية إلى E.164 تلقائيًا (`05xxxxxxxx` أو `5xxxxxxxx` ⇒ `9665xxxxxxxx`).
  - `renderTemplate`: يحقن المتغيرات ويرمّز النص بـ `encodeURIComponent`.
  - `buildWhatsAppLink`: يبني رابط `wa.me` النهائي.
- القوالب: `src/config/notifications.ts`
  - `order.ready`, `order.delivered`, `debt.reminder`
  - يمكن تعديل نصوصها أو متغيرات `NEXT_PUBLIC_STORE_NAME` و`NEXT_PUBLIC_STORE_ADDRESS`.
- الاستخدام في الواجهة:
  - الطلبات: زر “واتساب” يظهر في الجدول. عند READY يستخدم تمبليت الجاهزية، وعند DELIVERED يستخدم تمبليت التسليم مع `collectedPrice` و`receiptUrl`.
  - الديون: زر “واتساب” يرسل تمبليت التذكير مع `{remaining}` (معطل إذا لا يوجد رقم صالح).
- ملاحظة: هذه الطريقة لا ترسل تلقائيًا؛ تفتح واتساب فقط وعلى المستخدم الضغط للإرسال.

- افتراضيًا تُحفَظ الإيصالات تحت `public/receipts/`.
- لتفعيل الرفع إلى S3/R2 (أو أي S3-compatible):
  - عيّن القيم في `.env`:
    - `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET`
    - `S3_ENDPOINT` (لـ R2/MinIO) اختياري
    - `S3_PUBLIC_BASE` (اختياري لروابط التحميل العامة). إن لم تُحدد، يحاول النظام استخدام نمط `https://<bucket>.s3.amazonaws.com/<key>`.
  - عند التسليم، يُرفَع PDF إلى `receipts/<code>.pdf` ويُحفظ الرابط في `receiptUrl`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
