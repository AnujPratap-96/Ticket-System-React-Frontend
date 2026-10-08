import { expect } from '@playwright/test';

export const USERS = {
  admin: 'admin@deskflow.com',
  lead: 'lead@deskflow.com',
  agent: 'agent.sarah@deskflow.com',
  customer: 'rahul@acme.com',
};
export const PASSWORD = 'password123';

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
