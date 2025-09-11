برومبت — تطوير صفحة الإعدادات الكاملة
العنوان: أضف صفحة إعدادات كاملة (Settings) للمنصّة مع تبويبات ووظائف
المطلوب
إضافة صفحة /settings بتبويبات (Tabs) رئيسية، تحفظ في جدول Settings بقاعدة البيانات، وتؤثر فعليًا على المنصّة.
A) التبويبات والمحتوى
1. المتجر (Store)
اسم المتجر (storeName)
الشعار (رفع PNG، يحفظ url)
العنوان (storeAddress)
رقم التواصل الأساسي (storePhone)
2. الرسائل (Notifications / WhatsApp)
محرر نصوص لقوالب رسائل واتساب:
order.ready
order.delivered
debt.reminder
قائمة المتغيرات المسموحة: {customerName}, {orderCode}, {service}, {collectedPrice}, {receiptUrl}, {storeName}, {storeAddress}, {remaining}, {shopName}
Switch: تفعيل/تعطيل أزرار واتساب
رقم (days): تنبيه دين متأخر بعد X أيام
3. الإيصال (Receipts)
نص إضافي أسفل الإيصال (textarea، مثل شروط الضمان)
لغة الإيصال: خيار (عربي فقط / عربي+إنجليزي)
Switch: إظهار/إخفاء QR
توقيع/ختم المتجر (رفع صورة شفافة)
4. الواجهة (UI)
الوضع الافتراضي: فاتح / داكن
عدد الصفوف في الجداول: 10 / 25 / 50
5. البيانات (Data)
أزرار:
تصدير CSV للطلبات
تصدير CSV للديون
إنشاء نسخة احتياطية الآن (Google Drive)
ربط Google Drive: OAuth 2.0، تخزين Tokens في Settings
جدول آخر 10 نسخ احتياطية من جدول BackupLog: (التاريخ، الاسم، الحالة، رابط Google Drive)
إعداد النسخ التلقائي الأسبوعي:
Switch: تفعيل/تعطيل
اختيار اليوم (الأحد..السبت)
اختيار الساعة (0–23) بتوقيت Asia/Riyadh
6. متقدم (Advanced) — يظهر للـ Admin فقط
إعدادات تخزين S3 (endpoint, bucket, key)
Redis/DB configs (عرض فقط أو تحديث للمدير)

 قاعدة البيانات (Prisma)

model Settings {
  id                 String   @id @default(cuid())
  storeName          String
  storePhone         String?
  storeAddress       String?
  storeLogoUrl       String?
  receiptFooter      String?
  receiptLang        String   @default("AR")
  receiptQrEnabled   Boolean  @default(true)
  receiptStampUrl    String?
  waTemplates        Json     // { order.ready, order.delivered, debt.reminder }
  waEnabled          Boolean  @default(true)
  debtReminderDays   Int      @default(7)
  uiTheme            String   @default("light")
  uiTableRows        Int      @default(25)
  gdriveAccessToken  String?
  gdriveRefreshToken String?
  gdriveExpiry       DateTime?
  backupAutoEnabled  Boolean  @default(false)
  backupWeekday      Int      @default(6) // 0=Sun
  backupHour         Int      @default(3)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model BackupLog {
  id        String   @id @default(cuid())
  fileName  String
  fileUrl   String?
  status    String   // SUCCESS | FAILED
  message   String?
  createdAt DateTime @default(now())
}


C) الواجهة (UI/UX)
Tabs جانبية أو أفقية: “المتجر / الرسائل / الإيصال / الواجهة / البيانات / متقدم”
أزرار حفظ أعلى وأسفل كل تبويب.
Toast “تم الحفظ بنجاح” عند أي تحديث.
تحقق (zod) مع رسائل خطأ عربية مختصرة تحت الحقول.
D) وظائف النسخ الاحتياطي (Google Drive)
عند الضغط على ربط Google Drive: OAuth → حفظ Tokens.
عند الضغط على إنشاء نسخة احتياطية الآن:
اجمع بيانات (orders, debts, payments) → JSON مضغوط.
ارفع الملف إلى Google Drive في مجلد Mobile-Repair-Backups/<storeName>/.
أنشئ سجل في BackupLog.
الجدولة:
Cron يومي أو BullMQ Job يتحقق كل ساعة.
إذا الوقت يطابق (weekday + hour) & enabled ⇒ ينفّذ النسخ.
منع التكرار بنفس الساعة باستخدام Redis key TTL.
E) الاختبارات
Unit
دوال بناء القوالب (استبدال المتغيرات).
منطق shouldRunBackup(now, weekday, hour).
Integration
حفظ Settings وتحديث الحقول.
إنشاء نسخة احتياطية يضيف سجل في BackupLog.
فشل عند غياب Google Drive tokens.
E2E
صفحة /settings:
تعديل اسم المتجر وحفظ → يظهر Toast ويُحدث Dashboard.
تغيير نص رسالة واتساب → زر واتساب في الطلب يستعمل النص الجديد.
رفع ختم/شعار يظهر في الإيصال.
تجربة “إنشاء نسخة احتياطية الآن” → Toast + سجل جديد + رابط Drive.
تفعيل النسخ التلقائي وضبط يوم/ساعة → محاكاة cron تضيف سجل جديد في BackupLog.
المخرجات المتوقعة
صفحة إعدادات كاملة بتبويبات.
كل الحقول تحفظ في Settings وتؤثر على المنصة.
ربط Google Drive يعمل + نسخ يدوي وتلقائي أسبوعي.
اختبارات تمر (Unit/Integration/E2E).
