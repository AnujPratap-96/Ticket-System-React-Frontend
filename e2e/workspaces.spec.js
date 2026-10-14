import { test, expect } from '@playwright/test';
import { PASSWORD, signIn } from './helpers';

// Two independent companies are seeded: "techcorp" (the default for these tests) and "shopease".
// The SAME email, rahul@acme.com, is a customer in both, with different tickets.
test.describe('workspaces keep companies apart', () => {
  test('the same email sees only the tickets of the workspace they sign in to', async ({ page }) => {
    // TechCorp (the default workspace)
    await signIn(page, 'rahul@acme.com');
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByText('Where is my order #4412?')).toHaveCount(0);
    await page.getByRole('button', { name: 'Log out' }).click();

    // ShopEase: pick it on the "find your workspace" page
    await page.goto('/workspace');
    await page.getByLabel('Workspace address').fill('shopease');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'ShopEase Support' })).toBeVisible();

    await page.locator('input[type="email"]').fill('rahul@acme.com');
    await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByText('Where is my order #4412?')).toBeVisible();
  });

  test('a staff member of one company cannot sign in to another', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByLabel('Workspace address').fill('shopease');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('input[type="email"]').fill('admin@deskflow.com');            // a TechCorp administrator
    await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('an unknown workspace address is refused', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByLabel('Workspace address').fill('no-such-company');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('could not find');
  });

  test('the platform owner sees every workspace as counts only', async ({ page }) => {
    await page.goto('/platform/login');
    await page.locator('input[type="email"]').fill('platform@deskflow.com');
    await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/platform$/);
    await expect(page.getByText('TechCorp Support')).toBeVisible();
    await expect(page.getByText('ShopEase Support')).toBeVisible();
    await expect(page.getByText('Where is my order')).toHaveCount(0);                   // no ticket content, ever
  });
});
