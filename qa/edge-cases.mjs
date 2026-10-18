import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-gpu'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const student = await context.newPage();
const checks = [], issues = [];
for (const page of [student]) page.on('pageerror', error => issues.push(error.message));
const check = async (name, task) => { await task(); checks.push(name); console.log(`PASS ${name}`); };
try {
  await check('Role guards and persistent demo session', async () => {
    await student.goto(`${base}/staff/concerns`);
    await expect(student).toHaveURL(/\/login\?role=staff$/);
    await student.getByRole('button', { name: 'Student', exact: true }).click();
    await student.getByRole('checkbox', { name: 'Keep me signed in' }).check();
    await student.getByRole('button', { name: 'Log in to NUL Guide', exact: true }).click();
    assert.equal(await student.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-session-v1')).role), 'student');
    const remembered = await context.newPage();
    await remembered.goto(`${base}/student/home`);
    await expect(remembered.getByRole('heading', { name: 'How can we help you today?' })).toBeVisible();
    await remembered.close();
    await student.goto(`${base}/staff/dashboard`);
    await expect(student).toHaveURL(/\/login\?role=staff$/);
    await student.goto(`${base}/student/home`);
  });
  await check('Smart Match error retry and concern rewrite', async () => {
    await student.goto(`${base}/student/recommendation?q=portal&state=error`);
    await expect(student.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    await student.getByRole('button', { name: 'Try Again', exact: true }).click();
    await expect(student.getByRole('heading', { name: 'IT Services Office', exact: true })).toBeVisible();
    await student.getByRole('button', { name: 'Edit', exact: true }).click();
    await student.getByRole('dialog').getByRole('textbox').fill('I have a tuition payment question');
    await student.getByRole('dialog').getByRole('button', { name: 'Find My Service', exact: true }).click();
    await expect(student.getByRole('heading', { name: 'Cashier’s Office', exact: true })).toBeVisible();
  });
  await check('Dialog keyboard focus is trapped and restored', async () => {
    await student.goto(`${base}/student/offices/it`);
    const trigger = student.getByRole('button', { name: 'Contact Office', exact: true });
    await trigger.click();
    const dialog = student.getByRole('dialog');
    const buttons = dialog.locator('button:visible');
    await buttons.last().focus();
    await student.keyboard.press('Tab');
    assert.equal(await student.evaluate(() => document.querySelector('[role="dialog"] button') === document.activeElement), true);
    await student.keyboard.press('Shift+Tab');
    assert.equal(await student.evaluate(() => { const buttons = [...document.querySelectorAll('[role="dialog"] button')].filter(b => b.getClientRects().length); return buttons.at(-1) === document.activeElement; }), true);
    await student.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
  const staff = await context.newPage();
  staff.on('pageerror', error => issues.push(error.message));
  await staff.goto(`${base}/login?role=staff`);
  await staff.getByRole('button', { name: 'Log in to Staff Dashboard', exact: true }).click();
  await check('Office edits synchronize into an already open student tab', async () => {
    await staff.goto(`${base}/staff/offices`);
    await staff.locator('tbody tr').filter({ hasText: 'IT Services Office' }).getByRole('button', { name: 'Edit', exact: true }).click();
    await staff.getByRole('dialog').getByLabel('Room', { exact: true }).fill('209');
    await staff.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(student.locator('.office-location')).toContainText('209');
  });
  await check('Edited operating days and times synchronize into student office hours', async () => {
    await staff.locator('tbody tr').filter({ hasText: 'IT Services Office' }).getByRole('button', { name: 'Edit', exact: true }).click();
    const editor = staff.getByRole('dialog');
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      const toggle = editor.getByRole('button', { name: day, exact: true });
      const shouldOpen = day === 'Tue' || day === 'Thu';
      if ((await toggle.getAttribute('aria-pressed') === 'true') !== shouldOpen) await toggle.click();
    }
    await editor.getByLabel('Opens', { exact: true }).fill('09:00');
    await editor.getByLabel('Closes', { exact: true }).fill('16:00');
    await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
    const hoursFor = day => student.locator('.office-hours dl > div').filter({ hasText: day }).locator('dd');
    for (const day of ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday']) await expect(hoursFor(day)).toHaveText('Closed');
    for (const day of ['Tuesday', 'Thursday']) await expect(hoursFor(day)).toHaveText('9:00 AM – 4:00 PM');
  });
  await check('Disabled concern update preference suppresses new notifications', async () => {
    await student.goto(`${base}/student/profile`);
    await student.getByRole('checkbox', { name: /Concern status updates/ }).uncheck();
    const before = await student.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).notifications.filter(n => n.role === 'student').length);
    await staff.goto(`${base}/staff/concerns?open=NUL-2026-00123`);
    await staff.getByRole('dialog').getByLabel('Add response to student').fill('Cross-tab preference verification response.');
    await staff.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect.poll(() => student.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).concerns.find(c => c.id === 'NUL-2026-00123').response)).toBe('Cross-tab preference verification response.');
    const after = await student.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).notifications.filter(n => n.role === 'student').length);
    assert.equal(after, before);
  });
  await check('Global search and unknown route recovery', async () => {
    await student.getByRole('searchbox', { name: 'Search services and offices', exact: true }).fill('Registrar');
    await student.getByRole('searchbox', { name: 'Search services and offices', exact: true }).press('Enter');
    await expect(student).toHaveURL(/\/student\/offices\?q=Registrar$/);
    await expect(student.locator('.office-directory-card')).toHaveCount(1);
    await student.goto(`${base}/missing-assessment-page`);
    await expect(student.getByRole('heading', { name: 'This page could not be found' })).toBeVisible();
    await student.getByRole('link', { name: 'Return to NUL Guide' }).click();
    await expect(student).toHaveURL(/\/student\/home$/);
  });
  assert.deepEqual(issues, []);
  console.log(`${checks.length} edge-case checks passed; zero runtime errors.`);
} catch (error) { issues.push(error.stack || String(error)); console.error(error); process.exitCode = 1; }
finally { await writeFile('qa/edge-cases-report.json', JSON.stringify({ completedAt: new Date().toISOString(), checks, issues }, null, 2)); await browser.close(); }
