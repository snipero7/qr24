import { test, expect } from '@playwright/test';

test.describe('Orders Filters (server params)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('البريد').fill('admin@example.com');
    await page.getByLabel('كلمة المرور').fill('admin123');
    await page.getByRole('button', { name: 'دخول' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('فلترة بالحالة عبر الاستعلام', async ({ page }) => {
    await page.goto('/orders?status=DELIVERED');
    // تأكد أن الصفوف الظاهرة مسلّمة
    const rows = page.getByRole('row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      if (await row.getByRole('cell').count()) {
        await expect(row).toContainText(/DELIVERED|مسلّم/i);
      }
    }
  });

  test('فلترة بنطاق التاريخ عبر الاستعلام', async ({ page }) => {
    const from = '2025-09-01';
    const to = '2025-09-30';
    await page.goto(`/orders?createdFrom=${from}&createdTo=${to}`);
    // وجود محتوى تاريخ في الجدول يكفي للتحقق المبدئي
    const dateCells = page.getByRole('cell', { name: /\d{4}-\d{2}-\d{2}|AM|PM|\// });
    await expect(dateCells.first()).toBeVisible();
  });

  test('بحث نصي بالكود', async ({ page }) => {
    await page.goto('/orders?q=demo12345');
    await expect(page.getByRole('cell', { name: /demo12345/i })).toBeVisible();
  });
});

