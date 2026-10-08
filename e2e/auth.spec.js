import { test, expect } from '@playwright/test';
import { signIn, signInAs, USERS } from './helpers';

test.describe('signing in', () => {
  test('a wrong password is refused with a clear message', async ({ page }) => {
    await signIn(page, USERS.customer, 'definitely-wrong');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('customers land in the portal and staff in the console', async ({ page }) => {
    await signInAs(page, 'customer');
    await expect(page.getByRole('heading', { name: 'My tickets' })).toBeVisible();
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await signInAs(page, 'agent');
    await expect(page.getByRole('link', { name: /Tickets/ }).first()).toBeVisible();
  });

  test('a customer cannot open the staff console', async ({ page }) => {
    await signInAs(page, 'customer');
    await page.goto('/staff/team');
    await expect(page).not.toHaveURL(/\/staff\/team/);
  });

  test('signed-out visitors are sent to the sign-in page', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/login/);
  });
});
