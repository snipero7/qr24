# منصة إدارة صيانة الجوالات — سستم ديزاين + برومبت تنفيذي (جاهز لـ VS Code)

> هذا الملف يحدد التقنية، المعمارية، المخططات، الواجهات البرمجية، نموذج البيانات، وخطوات التشغيل محليًا وإطلاق MVP. في آخره ستجد **برومبت تنفيذي** جاهز لتمريره إلى وكيل الذكاء الاصطناعي ليولد المشروع كاملًا.

---

## 1) أهداف MVP

* تسجيل الطلبات + توليد QR لكل جهاز.
* تتبع الحالات: (جديد → قيد الإصلاح → بانتظار قطع → جاهز للاستلام → مُسلَّم/ملغى).
* التسليم يُسجِّل **المحصّل فعليًا** مع ختم وقت التحصيل.
* ديون بين المحلات مع **تسديد جزئي** وسجل دفعات (تاريخ/مبلغ) وحساب المتبقي تلقائيًا.
* لوحة معلومات: إجمالي الطلبات، الإيراد المُحصّل، الأجهزة قيد العمل، إجمالي الديون غير المسددة.
* إشعارات SMS/واتساب عند تغيّر الحالة (اختياري في مرحلة 2).

## 2) التِقنيات المقترحة (Stable, واقعية)

* **الواجهة/السيرفر**: Next.js (App Router) + TypeScript — Monolith أولًا (API Routes للحاجة الخلفية).
* **الـ ORM/قاعدة البيانات**: Prisma + PostgreSQL.
* **الجلسات والتوثيق**: Auth.js (NextAuth سابقًا) مع Email/كلمة مرور وOTP SMS (لاحقًا).
* **الكاش والطوابير**: Redis (لجلسات، Rate Limit، وBullMQ للوظائف المؤجلة).
* **ملفات/صور** (صور الأجهزة/الإيصالات PDF): تخزين S3-compatible (AWS S3/Cloudflare R2).
* **الرسائل النصية**: تكامل عبر مزود محلي (مثل Unifonic) أو دولي (Twilio). نترك طبقة مزود عامة.
* **المراقبة والأخطاء**: Sentry + Logger بسيط (pino) + Health checks.
* **الستايل UI**: TailwindCSS + shadcn/ui + lucide-react.
* **الباركود/QR**: `qrcode` لتوليد PNG/SVG في السيرفر.
* **PDF**: `@react-pdf/renderer` أو `pdfkit` لتوليد إيصال بالعربية.
* **الاختبارات**: Vitest + Testing Library + Playwright (E2E).
* **إدارة الحزم**: pnpm.
* **التحزيم والبيئة**: Docker Compose للتطوير (db/redis/app)، ونشر على (Vercel للتطبيق + Neon/Render/Postgres + Upstash/Redis) أو خادم واحد بـ Docker.

> ملاحظة: نبدأ Monolith لسرعة الإنجاز. عند نمو الحمل: فصل خدمة Notifications (worker) وخدمة Reports.

## 3) مخطط معماري (نصي)

* **Client (Next.js)**: صفحات الإدارة + واجهة العميل (تتبع حالة الطلب عبر QR/ID).
* **API Routes**: `/api/orders`, `/api/debts`, `/api/payments`, `/api/notifications`, `/api/reports`.
* **DB (Postgres)**: جداول أساسية أدناه.
* **Redis**: Queue (BullMQ) لرسائل SMS/واتساب، وإرسال الإيصالات.
* **Storage (S3)**: حفظ الإيصالات PDF وصور الأجهزة.

## 4) نموذج البيانات (Prisma Schema مختصر)

```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  passwordHash String
  role        Role     @default(ADMIN)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  ADMIN
  TECH
  CLERK
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String
  notes     String?  
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id            String   @id @default(cuid())
  code          String   @unique // short id لتضمينه في QR
  customer      Customer  @relation(fields: [customerId], references: [id])
  customerId    String
  deviceModel   String?
  imei          String?
  service       String
  originalPrice Decimal   @default(0)
  collectedPrice Decimal? // المحصّل فعليًا
  status        OrderStatus @default(NEW)
  collectedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  statusLogs    OrderStatusLog[]
  receiptUrl    String? // PDF في S3
}

enum OrderStatus {
  NEW
  IN_PROGRESS
  WAITING_PARTS
  READY
  DELIVERED
  CANCELED
}

model OrderStatusLog {
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String
  from      OrderStatus?
  to        OrderStatus
  at        DateTime @default(now())
  note      String?
}

model Debt {
  id        String   @id @default(cuid())
  shopName  String
  service   String
  amount    Decimal  // المبلغ الكلي للدين
  status    DebtStatus @default(OPEN)
  notes     String?
  createdAt DateTime @default(now())
  payments  DebtPayment[]
}

enum DebtStatus {
  OPEN
  PARTIAL
  PAID
}

model DebtPayment {
  id        String   @id @default(cuid())
  debt      Debt     @relation(fields: [debtId], references: [id])
  debtId    String
  amount    Decimal
  at        DateTime @default(now())
}
```

### قواعد العمل (Business Rules)

* `Order.collectedPrice` يملأ فقط عند الحالة `DELIVERED`.
* تحديث حالة `Debt` تلقائيًا:

  * إذا مجموع الدفعات = 0 ⇒ `OPEN`
  * 0 < مجموع الدفعات < `amount` ⇒ `PARTIAL`
  * مجموع الدفعات ≥ `amount` ⇒ `PAID`

## 5) واجهات برمجية (REST) — نماذج

* `POST /api/orders`

```json
{
  "customer": {"name": "علي", "phone": "0550000000"},
  "deviceModel": "iPhone 12",
  "imei": "123456789",
  "service": "تغيير شاشة",
  "originalPrice": 350
}
```

**200** ⇒ `{ id, code, status: "NEW" }`

* `PATCH /api/orders/:id/status`

```json
{ "to": "READY", "note": "تم الاختبار" }
```

* `POST /api/orders/:id/deliver`

```json
{ "collectedPrice": 320 }
```

**200** ⇒ `{ status: "DELIVERED", collectedAt, collectedPrice }`

* `GET /api/orders?query=055..&status=READY&page=1`

* `POST /api/debts`

```json
{ "shopName": "محل التقانة", "service": "سوفت وير", "amount": 100 }
```

* `POST /api/debts/:id/payments`

```json
{ "amount": 50 }
```

**200** ⇒ `{ totalPaid, remaining, status }`

> التحقق من المدخلات باستخدام zod + طبقة أخطاء موحدة `{ code, message, details? }`.

## 6) QR/باركود وإثبات الاستلام

* توليد `code` قصير (UUIDv7 مختصر أو nanoid) + `hmac` توقيع للتحقق.
* QR payload (JSON مضغوط أو URL):

```json
{
  "o": "order_code",
  "t": "hmac256"
}
```

* صفحة `/track/[code]` تسمح للعميل بالتحقق من الحالة دون إظهار بيانات حساسة.

## 7) الإيصالات PDF

* عند التسليم: توليد PDF يحتوي: شعار المتجر، بيانات الطلب، **المحصّل فعليًا**، QR للتحقق، توقيت التسليم.
* حفظ في S3 وإرجاع `receiptUrl`.

## 8) الصلاحيات (RBAC)

* **ADMIN**: كل شيء.
* **TECH**: تعديل الحالات وإضافة ملاحظات، لا يطلع على الديون.
* **CLERK**: إنشاء/تعديل طلبات، تسليم وتحصيل، لا يحذف.

## 9) القياس والمراقبة

* Sentry للأخطاء.
* Health endpoint: `/api/health` لقاعدة البيانات/الرديس.
* Structured logs (pino) مع request id.

## 10) الإشعارات (مرحلة 2)

* Job Queue (BullMQ) يطلق رسائل SMS/واتساب عند الانتقال إلى `READY`، وعند التسليم.
* موحِّد مزود (Adapter) لدعم Unifonic/Twilio.

## 11) خطة اختبار (Test Plan)

### Unit

* حساب الحالة للديون مع دفعات متعددة.
* الانتقال بين الحالات للطلب وتسجيل السجل.
* منع التسليم بدون مبلغ محصّل صالح.

### Integration

* إنشاء طلب → تغيير حالة → تسليم مع تحصيل → توليد PDF.
* إنشاء دين → إضافة دفعة جزئية → إضافة دفعة تكمل المبلغ → تأكيد الحالة.

### E2E (Playwright)

* سيناريو مدير: تسجيل طلب، تغييرات، بحث، تسليم، تنزيل إيصال.
* سيناريو ديون: إنشاء دين، دفعة جزئية، التحقق من المتبقي.

## 12) تشغيل محليًا (VS Code)

```bash
# المتطلبات: Node LTS, pnpm, Docker
pnpm create next-app app --ts --eslint --tailwind --src-dir --app
cd app
pnpm add @prisma/client prisma zod next-auth @auth/core bcrypt
pnpm add @tanstack/react-query @hookform/resolvers react-hook-form
pnpm add lucide-react class-variance-authority tailwind-merge
pnpm add qrcode @react-pdf/renderer
pnpm add bullmq ioredis pino
pnpm add -D vitest @testing-library/react @testing-library/jest-dom playwright prisma@latest

# Docker Compose لخدمات التطوير (db/redis)
```

`docker-compose.yml` (مختصر):

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: workshop
    ports: ["5432:5432"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

ثم:

```bash
pnpm dlx prisma init # عدّل datasource إلى postgres
pnpm dlx prisma migrate dev
pnpm dev
```

### .env (عينات)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workshop
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=changeme
SMS_PROVIDER=mock
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET=...
S3_ENDPOINT=...
```

## 13) واجهات الشاشة (مختصر)

* `/dashboard` بطاقات الإحصاء وجدول الطلبات.
* `/orders/new` نموذج سريع.
* `/orders/:id` تفاصيل + سجل الحالة + زر تسليم (تحصيل).
* `/debts` قائمة + نافذة دفعات + سجل دفعات.
* `/track/[code]` للعميل.

## 14) خارطة طريق (MVP ثم تحسينات)

* **الأسبوع 1**: هيكلة المشروع + Prisma + صفحات أساسية + CRUD للطلبات.
* **الأسبوع 2**: الديون + الدفعات + الإحصاءات.
* **الأسبوع 3**: الإيصالات PDF + QR + صفحة التتبع.
* **الأسبوع 4** (تحسينات): إشعارات + رفع صور + CI/CD + مراقبة.

---

## 15) برومبت تنفيذي (أعطه لوكيل الذكاء الاصطناعي)

**العنوان**: ولِّد مشروع Next.js TypeScript لإدارة صيانة الجوالات مع Prisma وPostgres وRedis

**التعليمات**:

1. أنشئ مشروع Next.js (App Router) TypeScript مع Tailwind وshadcn/ui وPNPM.
2. أضِف Prisma وPostgreSQL. أنشئ المخطط كما في القسم (4) أعلاه، مع علاقات صحيحة ومهاجرات.
3. نفِّذ REST APIs التالية بدقة كما في القسم (5). استخدم zod للتحقق وطبقة أخطاء موحّدة.
4. طوّر صفحات:

   * Dashboard: بطاقات + جدول الطلبات مع بحث/فلترة.
   * Orders New/Show: نموذج إنشاء/تفاصيل، سجل الحالة، زر **Deliver** يفتح Dialog لإدخال **collectedPrice**.
   * Debts Index: إنشاء دين، عرض دفعات، Dialog لإضافة دفعة، وحساب الحالة تلقائيًا.
   * Track Page: يعرض حالة الطلب عبر `code`.
5. أضِف توليد **QR** عند إنشاء الطلب، وخدمة تحقق HMAC، وصفحة تتبع.
6. عند التسليم: خزّن `collectedPrice` و`collectedAt`، وأنشئ PDF إيصال (اسم المتجر placeholder) وضعه في S3 (أو Mock Storage محلي)، ثم اربط `receiptUrl`.
7. أضِف طبقة Logger (pino) وSentry placeholders وEndpoint `/api/health`.
8. أضِف اختبارات:

   * Unit: منطق ديون (PARTIAL/PAID)، وتحويل الحالات.
   * Integration: مسار إنشاء→تحديث حالة→تسليم، ومسار ديون مع دفعات.
   * E2E: سيناريوهات المستخدم الأساسية.
9. أضِف Docker Compose (db/redis) وسكربتات npm للتشغيل والاختبارات والبذور (seed).
10. وثّق في README: كيفية الإعداد، .env، أوامر التطوير، وقيود الأمان.

**مخرجات متوقعة**:

* شجرة مشروع منظمة (`src/app`, `src/server`, `prisma/schema.prisma`).
* API تعمل محليًا، صفحات جاهزة، اختبارات خضراء.
* Seed يضيف مستخدم ADMIN، عميل تجريبي، طلب + دين مع دفعة جزئية.

---

## 16) معايير القبول (Acceptance Criteria)

* لا يمكن وضع حالة DELIVERED دون `collectedPrice` صالح.
* عند إضافة دفعة دين: يتم تحديث الحالة والمتبقي فورًا.
* QR يفتح صفحة تتبع تعرض الحالة فقط دون كشف بيانات حساسة.
* لوحة الإحصاءات تجمع القيم من قاعدة البيانات بدقة (اليوم/الشهر).

## 17) اعتبارات أمنية

* Hash كلمات المرور (bcrypt) + سياسات كلمات المرور.
* Rate limiting على المسارات الحساسة.
* حجب بيانات العميل في واجهة التتبع العام.
* التحقق من المدخلات وSanitization.

---

