import { test, expect } from '@playwright/test';

test.describe('Form Validation (flows)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('البريد').fill('admin@example.com');
    await page.getByLabel('كلمة المرور').fill('admin123');
    await page.getByRole('button', { name: 'دخول' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('منع إنشاء طلب بدون بيانات كافية يعرض رسالة خطأ عامة', async ({ page }) => {
    await page.goto('/orders/new');
    await page.getByRole('button', { name: 'حفظ وإنشاء' }).click();
    // يظهر خطأ عام أعلى النموذج (حالياً بدون رسائل حقول فردية)
    await expect(page.getByText(/فشل إنشاء الطلب|بيانات غير صالحة/i)).toBeVisible();
  });

  test('رفض مبلغ محصّل غير صالح عند التسليم يبقي الحوار مفتوحًا', async ({ page }) => {
    await page.goto('/orders');
    const row = page.getByRole('row', { name: /ready12345/i }).first();
    await row.getByRole('link', { name: /تفاصيل|عرض/ }).click();

    await page.getByRole('button', { name: /تسليم/i }).click();
    // عدم إدخال مبلغ (يبقى 0) ثم تأكيد
    await page.getByRole('button', { name: /تأكيد/ }).click();
    await expect(page.getByText(/أدخل مبلغًا صالحًا|قيمة غير صالحة/i)).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

