import { test, expect } from '@playwright/test';
import { signInAs } from './helpers';

test.describe('a ticket from filing to reply', () => {
  test.setTimeout(180_000);   // several page loads against a real API

  const posted = (page) => page.waitForResponse((r) => /\/tickets\/\d+\/messages$/.test(r.url()) && r.request().method() === 'POST');

  const title = `E2E printer problem ${Date.now()}`;

  test('customer files a ticket, staff answers, customer sees the answer', async ({ page, browser }) => {
    // customer files it
    await signInAs(page, 'customer');
    await page.getByRole('link', { name: 'Create ticket' }).first().click();
    await expect(page.getByRole('button', { name: 'Submit ticket' })).toBeEnabled();   // departments have loaded
    await page.getByLabel('Subject').fill(title);
    await page.getByLabel('Message').fill('The office printer shows an error and stops after one page.');
    await page.getByRole('button', { name: 'Submit ticket' }).click();
    await expect(page).toHaveURL(/\/portal\/tickets\/\d+/);
    await expect(page.getByText(title)).toBeVisible();
    const ticketUrl = page.url();

    // an admin (sees every ticket) replies
    const staff = await browser.newPage();
    await signInAs(staff, 'admin');
    await staff.getByLabel('Search tickets').fill(title);
    await staff.getByRole('link', { name: new RegExp(title) }).click();
    await staff.getByLabel('Message').fill('Thanks, we are looking into the printer now.');
    const sent = posted(staff);
    await staff.getByRole('button', { name: /Send reply/ }).click();
    expect((await sent).status()).toBe(201);
    await staff.close();

    // the customer sees the reply
    await page.goto(ticketUrl);
    await expect(page.getByText('Thanks, we are looking into the printer now.')).toBeVisible();
  });

  test('internal notes are never shown to the customer', async ({ page, browser }) => {
    await signInAs(page, 'customer');
    await page.getByRole('link', { name: 'Create ticket' }).first().click();
    const t = `E2E note ${Date.now()}`;
    await expect(page.getByRole('button', { name: 'Submit ticket' })).toBeEnabled();
    await page.getByLabel('Subject').fill(t);
    await page.getByLabel('Message').fill('Please check my invoice.');
    await page.getByRole('button', { name: 'Submit ticket' }).click();
    await expect(page).toHaveURL(/\/portal\/tickets\/\d+/);
    const url = page.url();

    const staff = await browser.newPage();
    await signInAs(staff, 'admin');
    await staff.getByLabel('Search tickets').fill(t);
    await staff.getByRole('link', { name: new RegExp(t) }).click();
    await staff.getByRole('tab', { name: /Internal note/ }).click();
    await staff.getByLabel('Message').fill('SECRET staff-only remark');
    const sent = posted(staff);
    await staff.getByRole('button', { name: /Add note/ }).click();
    expect((await sent).status()).toBe(201);
    await staff.close();

    await page.goto(url);
    await expect(page.getByText(t).first()).toBeVisible();
    await expect(page.getByText('SECRET staff-only remark')).toHaveCount(0);
  });
});
