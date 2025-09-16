import { test, expect } from '@playwright/test';

test.describe('Toasts UX (flows)', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto('/signin');
    await page.getByLabel('البريد').fill('admin@example.com');
    await page.getByLabel('كلمة المرور').fill('admin123');
    await page.getByRole('button', { name: 'دخول' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('إنشاء طلب جديد (ينتقل للتتبع ويعرض نجاح إن وُجد)', async ({ page }) => {
    await page.goto('/orders/new');

    await page.getByLabel('اسم العميل').fill('عميل تجريبي');
    await page.getByLabel('جوال').fill('0560000000');
    await page.getByLabel('نوع الجهاز').fill('iPhone 12');
    await page.getByLabel('الخدمة').fill('تغيير شاشة');

    // إدخال السعر عبر لوحة المبلغ
    await page.getByRole('button', { name: /السعر|المبلغ/ }).click();
    for (const k of ['1','5','0']) await page.getByRole('button', { name: k }).click();

    await page.getByRole('button', { name: 'حفظ وإنشاء' }).click();

    // نجاح: الانتقال لصفحة التتبع
    await page.waitForURL(/\/track\//);

    // إن كان هناك Toast نجاح، اسمح له بالظهور دون كسر الاختبار إن غاب
    const maybeToast = page.getByText(/تم.*إنشاء|تم الحفظ|نجاح/i).first();
    await maybeToast.waitFor({ state: 'visible', timeout: 500 }).catch(() => {});
  });

  test('تحصيل عند التسليم يحدّث الحالة إلى DELIVERED', async ({ page }) => {
    await page.goto('/orders');
    // افتح تفاصيل لطلب معروف من seed (ready12345)
    const row = page.getByRole('row', { name: /ready12345/i }).first();
    await row.getByRole('link', { name: /تفاصيل|عرض/ }).click();

    // افتح حوار التسليم
    await page.getByRole('button', { name: /تسليم/i }).click();

    // أدخل 120 عبر لوحة الأزرار
    for (const k of ['1','2','0']) await page.getByRole('button', { name: k }).click();

    // تأكيد (النص يبدأ بـ "تأكيد")
    await page.getByRole('button', { name: /تأكيد/ }).click();

    // تحقّق من الحالة
    await expect(page.getByText(/DELIVERED|مسلّم/i)).toBeVisible({ timeout: 5000 });

    // (اختياري) Toast إن وُجد
    const maybeToast = page.getByText(/تم تسجيل التحصيل|تم التسليم|نجاح/i).first();
    await maybeToast.waitFor({ state: 'visible', timeout: 500 }).catch(() => {});
  });
});

