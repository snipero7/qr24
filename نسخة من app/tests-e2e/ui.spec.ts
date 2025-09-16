import { test, expect } from '@playwright/test';

test('RTL is enabled and dashboard has KPI cards', async ({ page }) => {
  await page.goto('/signin');
  await page.getByLabel('البريد').fill('admin@example.com');
  await page.getByLabel('كلمة المرور').fill('admin123');
  await page.getByRole('button', { name: 'دخول' }).click();
  await page.waitForURL('**/dashboard');

  const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
  expect(dir).toBe('rtl');

  const kpis = await page.locator('[data-testid="kpi-card"]').count();
  expect(kpis).toBeGreaterThanOrEqual(6);
});

test('StatusBadge appears in orders list', async ({ page }) => {
  await page.goto('/orders');
  // Expect at least one of known statuses to appear
  const anyBadge = page.locator('text=READY').first();
  await expect(anyBadge.or(page.locator('text=DELIVERED').first())).toBeVisible({ timeout: 5000 });
});

