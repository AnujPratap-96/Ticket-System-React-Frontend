import { test, expect } from '@playwright/test';
import { signInAs } from './helpers';

test.describe('workspace settings', () => {
  test('branding, email channel and security are managed from one page', async ({ page }) => {
    await signInAs(page, 'admin');
    await page.goto('/staff/workspace');

    // branding: the colour is saved and applied to the app straight away
    await page.getByLabel('Brand colour').first().fill('#0f766e');
    await page.getByPlaceholder('#4f46e5').fill('#0f766e');
    await page.getByRole('button', { name: 'Save branding' }).click();
    await expect(page.getByText('Branding saved')).toBeVisible();
    await expect(page.locator('style#workspace-brand')).toHaveCount(1);

    // email channel: the secret is shown once
    page.on('dialog', (d) => d.accept()); // rotating an existing secret asks first
    await page.getByRole('button', { name: /Turn on email to tickets|Create a new secret/ }).click();
    await expect(page.getByText('the secret is shown only once')).toBeVisible();

    // security toggle is reachable
    await expect(page.getByRole('switch')).toBeVisible();
  });

  test('admin activity lists the change just made', async ({ page }) => {
    await signInAs(page, 'admin');
    await page.goto('/staff/workspace');
    await page.getByRole('button', { name: 'Save branding' }).click();
    await expect(page.getByText('Branding saved')).toBeVisible();
    await page.goto('/staff/activity');
    await expect(page.getByText('/settings/branding').first()).toBeVisible();
  });

  test('a department can be limited to working days', async ({ page }) => {
    await signInAs(page, 'admin');
    await page.goto('/staff/departments');
    await expect(page.getByText('Working days')).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByText('Sat', { exact: true }).click();
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Department updated')).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByText('Sat', { exact: true }).click(); // put it back
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Department updated')).toBeVisible();
  });

  test('an automation template pre-fills the rule form', async ({ page }) => {
    await signInAs(page, 'admin');
    await page.goto('/staff/automation');
    await page.getByRole('button', { name: 'Auto-close resolved tickets after 3 days' }).click();
    await expect(page.getByLabel('Name')).toHaveValue('Auto-close resolved tickets after 3 days');
  });

  test('staff can mark themselves away and come back', async ({ page }) => {
    await signInAs(page, 'agent');
    await page.goto('/staff/account');
    await page.getByLabel('Away until').fill(new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10));
    await page.getByRole('button', { name: 'Mark me away' }).click();
    await expect(page.getByText('You are away until')).toBeVisible();
    await page.getByRole('button', { name: 'I’m back' }).click();
    await expect(page.getByRole('button', { name: 'Mark me away' })).toBeVisible();
  });

  test('an agent can log time on a ticket', async ({ page }) => {
    await signInAs(page, 'agent');
    await page.locator('a[href^="/staff/tickets/"]').first().click();
    await page.getByLabel('Minutes').fill('15');
    await page.getByLabel('What was done').fill('E2E: checked the logs');
    await page.getByRole('button', { name: 'Log time' }).click();
    await expect(page.getByText('E2E: checked the logs')).toBeVisible();
    await page.getByRole('button', { name: 'Remove time entry' }).first().click();
    await expect(page.getByText('E2E: checked the logs')).toHaveCount(0);
  });
});
