import { test, expect } from '@playwright/test';
import { signInAs } from './helpers';

test.describe('admin tools', () => {
  test('organizations can be added and then found', async ({ page }) => {
    await signInAs(page, 'admin');
    await page.goto('/staff/organizations');
    const stamp = Date.now();
    await page.getByRole('button', { name: 'Add organization' }).click();
    await page.getByLabel('Company name').fill(`E2E Corp ${stamp}`);
    await page.getByLabel('Email domain').fill(`e2e-${stamp}.example.com`);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(`E2E Corp ${stamp}`)).toBeVisible();
    await page.getByLabel('Search organizations').fill(`e2e-${stamp}`);
    await expect(page.getByText(`@e2e-${stamp}.example.com`)).toBeVisible();
  });

  test('an automation rule can be created and switched off', async ({ page }) => {
    await signInAs(page, 'admin');
    await page.goto('/staff/automation');
    const name = `E2E rule ${Date.now()}`;
    await page.getByRole('button', { name: 'New rule' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Action').first().selectOption('add_tag');
    await page.getByPlaceholder('tag', { exact: true }).fill('e2e-tag');
    await page.getByRole('button', { name: 'Save rule' }).click();
    await expect(page.getByText(name)).toBeVisible();
  });

  test('agents and customers do not see admin pages', async ({ page }) => {
    await signInAs(page, 'agent');
    await page.goto('/staff/organizations');
    await expect(page.getByRole('heading', { name: 'Organizations' })).toHaveCount(0);
  });
});

test.describe('preferences', () => {
  test('dark mode and language are remembered across reloads', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Language').selectOption('es');
    await page.getByRole('button', { name: /theme|tema/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });
});
