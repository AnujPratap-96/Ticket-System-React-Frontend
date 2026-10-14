import { expect } from '@playwright/test';

export const USERS = {
  admin: 'admin@deskflow.com',
  lead: 'lead@deskflow.com',
  agent: 'agent.sarah@deskflow.com',
  customer: 'rahul@acme.com',
};
// The demo password is whatever DEMO_PASSWORD the API was seeded with: pass it as E2E_PASSWORD.
export const PASSWORD = process.env.E2E_PASSWORD || '';

export async function signIn(page, email, password = PASSWORD) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

export async function signInAs(page, role) {
  await signIn(page, USERS[role]);
  await expect(page).toHaveURL(role === 'customer' ? /\/portal/ : /\/staff/);
}
