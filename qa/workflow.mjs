import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-gpu'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const issues = [];
const checks = [];
page.on('pageerror', error => issues.push(error.message));
page.on('console', message => { if (message.type() === 'error') issues.push(message.text()); });
page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) issues.push(`${response.status()} ${response.url()}`); });
await mkdir('qa/screenshots/workflow', { recursive: true });
const check = async (name, task) => { await task(); checks.push(name); console.log(`PASS ${name}`); };
async function login(staff = false) {
  await page.goto(`${base}/login${staff ? '?role=staff' : ''}`);
  await page.getByRole('textbox', { name: staff ? 'Staff email' : 'Student email or Student ID' }).fill(staff ? 'maria.santos@nu-laguna.edu.ph' : '2025-1024378');
  await page.getByLabel('Password', { exact: true }).fill('NULGuide2026!');
  await page.getByRole('button', { name: staff ? 'Log in to Staff Dashboard' : 'Log in to NUL Guide', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(staff ? '/staff/dashboard$' : '/student/home$'));
}
async function logout() {
  await page.getByRole('button', { name: 'Log out', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Log Out', exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?role=staff)?$/);
}

try {
  await page.goto(base);
  await check('Login validation, role switch, password visibility and remember preference', async () => {
    await page.getByRole('button', { name: 'Staff / Admin', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Staff email' })).toHaveValue('maria.santos@nu-laguna.edu.ph');
    await page.getByRole('button', { name: 'Student', exact: true }).click();
    await page.getByLabel('Password', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: 'Log in to NUL Guide', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('do not match');
    await page.getByRole('button', { name: 'Show password', exact: true }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Keep me signed in' }).check();
  });
  await check('Password reset validation and labeled demo outcome', async () => {
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'NU email' }).fill('bad');
    await dialog.getByRole('button', { name: 'Send reset link' }).click();
    await expect(dialog.getByRole('alert')).toContainText('valid');
    await dialog.getByRole('textbox', { name: 'NU email' }).fill('juan.delacruz@students.nu-laguna.edu.ph');
    await dialog.getByRole('button', { name: 'Send reset link' }).click();
    await expect(dialog).toContainText('No email is sent');
    await dialog.getByRole('button', { name: 'Done' }).click();
  });
  await check('Supplementary account interaction and guest access', async () => {
    await page.getByRole('button', { name: 'Create an account' }).click();
    await expect(page.getByRole('dialog')).toContainText('sample account');
    await page.getByRole('button', { name: 'Use the student demo account' }).click();
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.goto(`${base}/student/submit`);
    await expect(page.getByRole('heading', { name: 'Sign in to manage your concerns' })).toBeVisible();
    await logout();
  });
  await login();
  await check('Student authentication and logout cancellation', async () => {
    await page.getByRole('button', { name: 'Log out', exact: true }).first().click();
    await page.getByRole('button', { name: 'Stay logged in' }).click();
    await expect(page).toHaveURL(/\/student\/home$/);
    await page.getByRole('textbox', { name: 'Describe what you need help with' }).fill('I cannot access my student portal after resetting my password');
    await page.getByRole('button', { name: 'Find My Service', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Office Recommendation', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'IT Services Office', exact: true })).toBeVisible();
  });
  await check('Smart Match low confidence and no match states', async () => {
    await page.goto(`${base}/student/recommendation?q=subject%20payment`);
    await expect(page.getByText('We’re not completely sure.', { exact: true }).first()).toBeVisible();
    await page.goto(`${base}/student/recommendation?q=bicycle%20repair`);
    await expect(page.getByRole('heading', { name: /couldn.*find|no match/i })).toBeVisible();
  });
  await check('Directory search, category filter, and office-specific detail', async () => {
    await page.goto(`${base}/student/offices`);
    await page.getByRole('searchbox', { name: 'Search offices…', exact: true }).fill('Clinic');
    await expect(page.locator('.office-directory-card')).toHaveCount(1);
    await page.getByRole('searchbox', { name: 'Search offices…', exact: true }).fill('');
    await page.getByRole('button', { name: 'Health', exact: true }).click();
    await expect(page.locator('.office-directory-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'View Details', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'University Clinic', exact: true })).toBeVisible();
    await expect(page.locator('.office-about')).toContainText('first aid');
  });
  await check('Contact chat, copied email, mailto and tel links', async () => {
    await page.getByRole('button', { name: 'Contact Office', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Your chat message' }).fill('What should I bring?');
    await dialog.getByRole('button', { name: 'Send message' }).click();
    await expect(dialog.getByRole('log')).toContainText('simulated reply');
    await dialog.getByRole('tab', { name: 'Email', exact: true }).click();
    await expect(dialog.getByRole('link', { name: 'Open email app' })).toHaveAttribute('href', /^mailto:clinic@/);
    await dialog.getByRole('button', { name: 'Copy email' }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'clinic@nu-laguna.edu.ph');
    await dialog.getByRole('tab', { name: 'Call', exact: true }).click();
    await expect(dialog.getByRole('link', { name: 'Call the office' })).toHaveAttribute('href', /^tel:/);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
  await check('Directions origin/destination changes update walking guide', async () => {
    await page.goto(`${base}/student/directions?office=it`);
    await page.getByLabel('Where are you headed?').selectOption('registrar');
    await page.getByLabel('Starting point').selectOption('Back Gate');
    await page.getByRole('button', { name: 'Get Directions', exact: true }).click();
    await expect(page).toHaveURL(/office=registrar/);
    await expect(page.locator('.service-steps').last()).toContainText('Back Gate');
  });
  await check('Concern validation, invalid file recovery, and valid metadata', async () => {
    await page.goto(`${base}/student/submit?office=it`);
    await page.getByRole('button', { name: 'Submit Concern', exact: true }).click();
    await expect(page.getByText('Enter a concern title with at least 5 characters.', { exact: true })).toBeVisible();
    await page.getByLabel('Concern title', { exact: true }).fill('Workflow QA portal access request');
    await page.getByLabel('Describe your concern', { exact: true }).fill('My student portal still shows an invalid account error after resetting my password. Please restore my access.');
    await page.getByLabel('Attach a supporting document').setInputFiles({ name: 'unsupported.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
    await expect(page.getByText('Choose a PDF, JPG, or PNG file.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue without a file' }).click();
    await page.getByLabel('Attach a supporting document').setInputFiles({ name: 'portal-error.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
    await expect(page.getByText('File name and size are saved locally; file contents are not uploaded.')).toBeVisible();
  });
  let reference;
  await check('Submission creates unique Pending reference and persists on reload', async () => {
    await page.getByRole('button', { name: 'Submit Concern', exact: true }).click();
    await expect(page).toHaveURL(/\/student\/success\/NUL-\d{4}-\d{5}$/);
    reference = decodeURIComponent(page.url().split('/').at(-1));
    await expect(page.getByRole('heading', { name: 'Concern Submitted Successfully' })).toBeVisible();
    await page.getByRole('button', { name: 'Copy reference number' }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), reference);
    await page.getByRole('link', { name: 'Track My Concern', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Workflow QA portal access request', exact: true })).toBeVisible();
    await expect(page.locator('.concern-detail-heading')).toContainText('Pending');
    await page.screenshot({ path: 'qa/screenshots/workflow/student-submitted.png', fullPage: true });
  });
  await logout(); await login(true);
  await check('Staff sees student request and saves assignment/status/response', async () => {
    await page.goto(`${base}/staff/concerns?q=${reference}`);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Me', exact: true }).click();
    await dialog.getByRole('button', { name: 'In Progress', exact: true }).click();
    await dialog.getByLabel('Add response to student').fill('We have verified your request and are restoring portal access.');
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.locator('tbody tr')).toContainText('In Progress');
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel('Assigned staff')).toHaveValue('Maria Santos');
    await page.getByRole('dialog').getByLabel('Add response to student').fill('Your portal access has been restored. Please sign in again.');
    await page.getByRole('dialog').getByRole('button', { name: 'Resolve concern', exact: true }).click();
    await expect(page.locator('tbody tr')).toContainText('Resolved');
  });
  await check('Office management edits and additions persist', async () => {
    await page.goto(`${base}/staff/offices`);
    const row = page.locator('tbody tr').filter({ hasText: 'IT Services Office' });
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Room', { exact: true }).fill('205');
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(row).toContainText('205');
    await page.getByRole('button', { name: 'Add Office', exact: true }).click();
    const add = page.getByRole('dialog');
    await add.getByLabel('Office name', { exact: true }).fill('Assessment Demo Office');
    await add.getByLabel('Description', { exact: true }).fill('Local assessment support and testing.');
    await add.getByLabel('Building', { exact: true }).fill('Admin Building');
    await add.getByLabel('Floor', { exact: true }).fill('Ground Floor');
    await add.getByLabel('Room', { exact: true }).fill('109');
    await add.getByLabel('Phone', { exact: true }).fill('(049) 123-4567');
    await add.getByLabel('Email', { exact: true }).fill('demo@example.edu');
    await add.getByLabel('Services', { exact: true }).fill('Assessment questions, Local demonstration help');
    await add.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.locator('tbody tr').filter({ hasText: 'Assessment Demo Office' })).toHaveCount(1);
  });
  await logout(); await login();
  await check('Student sees resolved status, response and full history; feedback saved', async () => {
    await page.goto(`${base}/student/concerns/${reference}`);
    await expect(page.locator('.concern-detail-heading')).toContainText('Resolved');
    await expect(page.locator('.concern-response')).toContainText('portal access has been restored');
    await expect(page.locator('.concern-history')).toContainText('Assigned to Maria Santos');
    await page.getByRole('button', { name: '5 stars', exact: true }).click();
    await page.getByLabel('Feedback (optional)').fill('Clear instructions and a quick resolution.');
    await page.getByRole('button', { name: 'Submit feedback', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thank you for your feedback' })).toBeVisible();
    await page.reload();
    await expect(page.getByText('You rated this resolution 5 out of 5 stars.')).toBeVisible();
    await page.screenshot({ path: 'qa/screenshots/workflow/student-resolved.png', fullPage: true });
  });
  await check('Student directory reflects office edits/addition', async () => {
    await page.goto(`${base}/student/offices/it`);
    await expect(page.locator('.office-location')).toContainText('205');
    await page.goto(`${base}/student/offices?q=Assessment%20Demo%20Office`);
    await expect(page.locator('.office-directory-card')).toHaveCount(1);
    await expect(page.locator('.office-directory-card')).toContainText('Assessment Demo Office');
  });
  await check('Notification read state and profile preference persist', async () => {
    await page.goto(`${base}/student/notifications`);
    await page.getByRole('button', { name: 'Mark all read', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).notifications.filter(n => n.role === 'student' && !n.read).length), 0);
    await page.goto(`${base}/student/profile`);
    const toggle = page.getByRole('checkbox', { name: /Email copies/ });
    await toggle.click();
    const after = await toggle.isChecked();
    await page.reload();
    assert.equal(await page.getByRole('checkbox', { name: /Email copies/ }).isChecked(), after);
  });
  await check('FAQ search/accordion and safe sample reset confirmation', async () => {
    await page.goto(`${base}/student/help`);
    await page.getByRole('searchbox', { name: 'Search help topics...' }).fill('password');
    await page.getByRole('button', { name: 'How do I reset my student password?' }).click();
    await expect(page.locator('.help-faq p')).toContainText('Forgot password');
    await page.getByRole('button', { name: /restore|reset.*sample/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).concerns.some(c => c.title === 'Workflow QA portal access request')), true);
    await page.getByRole('button', { name: 'Restore sample data', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore sample data', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).concerns.length), 8);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('nul-guide-data-v1')).offices.length), 8);
  });
  assert.deepEqual(issues, []);
  console.log(`${checks.length} browser workflow checks passed; zero browser errors.`);
} catch (error) {
  issues.push(error.stack || String(error));
  await page.screenshot({ path: 'qa/screenshots/workflow/failure.png', fullPage: true }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile('qa/workflow-report.json', JSON.stringify({ completedAt: new Date().toISOString(), checks, issues }, null, 2));
  await browser.close();
}
