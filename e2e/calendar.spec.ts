import { test, expect } from '@playwright/test';
import { JANUARY_2026, stubHolidayApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await stubHolidayApi(page);
});

test('paging to the next month loads that month', async ({ page }) => {
  await page.goto(JANUARY_2026);

  await expect(page.getByRole('button', { name: /January 2026/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /January 1, 2026, 1 holiday/ })).toBeVisible();

  await page.getByRole('button', { name: 'Next month' }).click();

  await expect(page.getByRole('button', { name: /February 2026/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /February 16, 2026, 1 holiday/ })).toBeVisible();
  // The month the visitor is on survives a reload.
  await expect(page).toHaveURL(/month=2026-02/);
});

test('opening a day shows its holiday in a dialog', async ({ page }) => {
  await page.goto(JANUARY_2026);

  await page.getByRole('button', { name: /January 19, 2026, 1 holiday/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Martin Luther King, Jr. Day' })).toBeVisible();

  // Escape closes it and focus returns to the page behind.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a shared link opens the holiday it points at', async ({ page }) => {
  await page.goto(
    '/?lang=en&countries=US&month=2026-01&holiday=New+Year%27s+Day&date=2026-01-01&country=US'
  );

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: "New Year's Day" })).toBeVisible();
});
