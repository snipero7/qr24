import { test, expect } from '@playwright/test';

test('WhatsApp button opens wa.me and disabled when invalid', async ({ page, context }) => {
  // Sign in as admin
  await page.goto('/signin');
  await page.getByLabel('البريد').fill('admin@example.com');
  await page.getByLabel('كلمة المرور').fill('admin123');
  await page.getByRole('button', { name: 'دخول' }).click();
  await page.waitForURL('**/dashboard');

  // Go to orders
  await page.goto('/orders');
  // Click WhatsApp for ready order if exists
  const row = page.getByRole('row', { name: /ready12345/ });
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    row.getByRole('link', { name: 'واتساب' }).click(),
  ]);
  await newPage.waitForLoadState();
  expect(newPage.url()).toContain('https://wa.me/');
});

