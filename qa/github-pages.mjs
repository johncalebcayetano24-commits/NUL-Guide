import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEMO_PASSWORD } from '../src/data/seed.js';

const baseURL = new URL(process.env.BASE_URL || 'http://127.0.0.1:4183/NUL-Guide/');
baseURL.hash = ''; baseURL.search = '';
if (!baseURL.pathname.endsWith('/')) baseURL.pathname += '/';
const base = baseURL.href;
const urlFor = route => `${base}#${route}`;
const routeOf = page => new URL(page.url()).hash.slice(1);
const output = path.resolve('qa/github-pages');
const screenshots = path.join(output, 'screenshots');
await mkdir(screenshots, { recursive: true });
const executablePath = process.env.BROWSER_EXECUTABLE || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const report = { startedAt: new Date().toISOString(), baseURL: base, executablePath, checks: [], pageErrors: [], consoleErrors: [], failedAssets: [], incorrectAssetPaths: [], fontRequests: [], issues: [] };
const fonts = new Set();
const assetTypes = new Set(['image', 'font', 'script', 'stylesheet']);
let browser, current = 'startup', activePage;

const studentRoutes = [
  ['home', '/student/home', 'How can we help you today?'],
  ['find', '/student/find', 'Find a Service'],
  ['recommendation', '/student/recommendation?q=student%20portal%20password', 'Office Recommendation'],
  ['low-match', '/student/recommendation?q=subject%20payment', 'Office Recommendation'],
  ['no-match', '/student/recommendation?q=bicycle%20parking', 'Office Recommendation'],
  ['match-error', '/student/recommendation?q=password&state=error', 'Office Recommendation'],
  ['directory', '/student/offices', 'Office Directory'],
  ['office', '/student/offices/it', 'IT Services Office'],
  ['office-contact', '/student/offices/it?contact=email', 'IT Services Office'],
  ['directions', '/student/directions?office=it', 'Directions & Contacts'],
  ['submit', '/student/submit?office=it', 'Concern Submission'],
  ['concerns', '/student/concerns', 'Track My Concerns'],
  ['concern-detail', '/student/concerns/NUL-2026-00123', 'Can’t access the student portal after password reset'],
  ['resolved-concern', '/student/concerns/NUL-2026-00119', 'Request for medical certificate for missed exam'],
  ['success', '/student/success/NUL-2026-00124', 'Concern Submitted Successfully'],
  ['notifications', '/student/notifications', 'Notifications'],
  ['announcements', '/student/announcements', 'Announcements'],
  ['profile', '/student/profile', 'Juan Dela Cruz'],
  ['help', '/student/help', 'Help Center'],
];
const staffRoutes = [
  ['dashboard', '/staff/dashboard', 'Staff Dashboard'],
  ['concerns', '/staff/concerns', 'Concerns'],
  ['concern-modal', '/staff/concerns?open=NUL-2026-00122', 'Concerns'],
  ['offices', '/staff/offices', 'Offices'],
  ['students', '/staff/students', 'Students'],
  ['notifications', '/staff/notifications', 'Notifications'],
  ['profile', '/staff/profile', 'Maria Santos'],
];

async function check(name, task) {
  current = name;
  try { await task(); report.checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) {
    report.checks.push({ name, passed: false, error: error.stack || String(error) });
    await activePage?.screenshot({ path: path.join(screenshots, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
  }
}

function auditRequests(page) {
  page.on('pageerror', error => report.pageErrors.push({ check: current, message: error.message }));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    // A clean deep link intentionally receives GitHub Pages' HTTP 404 document.
    const location = message.location().url;
    if (page.expected404s?.has(location)) return;
    report.consoleErrors.push({ check: current, message: message.text(), url: location });
  });
  page.on('request', request => {
    if (!assetTypes.has(request.resourceType())) return;
    const url = new URL(request.url());
    if (['data:', 'blob:'].includes(url.protocol)) return;
    if (url.origin !== baseURL.origin || !url.pathname.startsWith(baseURL.pathname)) report.incorrectAssetPaths.push({ check: current, type: request.resourceType(), url: url.href });
    if (request.resourceType() === 'font') fonts.add(url.href);
  });
  page.on('response', response => {
    if (assetTypes.has(response.request().resourceType()) && response.status() >= 400) report.failedAssets.push({ check: current, status: response.status(), url: response.url() });
  });
  page.on('requestfailed', request => {
    if (assetTypes.has(request.resourceType()) && request.failure()?.errorText !== 'net::ERR_ABORTED') report.failedAssets.push({ check: current, url: request.url(), error: request.failure()?.errorText });
  });
}

async function verifyRenderedPage(page, heading) {
  if (heading) await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true });
    })));
  });
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 2,
    width: innerWidth, documentWidth: document.documentElement.scrollWidth,
    images: [...document.images].map(image => ({ url: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
  }));
  assert.equal(metrics.overflow, false, `Horizontal overflow: ${metrics.documentWidth}px in ${metrics.width}px viewport.`);
  assert.ok(metrics.images.length > 0, 'Expected the original local Figma assets to render.');
  assert.deepEqual(metrics.images.filter(image => !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0), [], 'An image has no loaded natural dimensions.');
}

async function login(page, staff = false) {
  await page.goto(urlFor(`/login${staff ? '?role=staff' : ''}`), { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: staff ? 'Staff email' : 'Student email or Student ID', exact: true }).fill(staff ? 'maria.santos@nu-laguna.edu.ph' : '2025-1024378');
  await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: staff ? 'Log in to Staff Dashboard' : 'Log in to NUL Guide', exact: true }).click();
  await expect(page).toHaveURL(urlFor(staff ? '/staff/dashboard' : '/student/home'));
}

async function logout(page) {
  const menu = page.getByRole('button', { name: 'Open navigation menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'Log out', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Log Out', exact: true }).click();
  await expect(page).toHaveURL(/#\/login(?:\?role=staff)?$/);
}

async function visitAndReload(page, role, viewport, [name, route, heading]) {
  await check(`${viewport.width}px ${role} direct hash route and reload: ${name}`, async () => {
    await page.goto(urlFor(route), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(urlFor(route));
    await verifyRenderedPage(page, heading);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(urlFor(route));
    await verifyRenderedPage(page, heading);
    if (['home', 'recommendation', 'office', 'directions', 'dashboard'].includes(name)) await page.screenshot({ path: path.join(screenshots, `${viewport.width}px-${role}-${name}.png`), fullPage: true, animations: 'disabled' });
  });
}

try {
  browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], ...(executablePath ? { executablePath } : {}) });
  for (const viewport of [{ width: 1440, height: 1024 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, locale: 'en-US', timezoneId: 'Asia/Manila', reducedMotion: 'reduce' });
    const page = await context.newPage(); activePage = page;
    page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(30000);
    page.expected404s = new Set(); auditRequests(page);
    if (viewport.width === 1440) await check('Strict project-path static serving and real HTTP 404 fallback', async () => {
      assert.equal((await context.request.get(base)).status(), 200);
      const clean = await context.request.get(`${base}student/offices/it`);
      assert.equal(clean.status(), 404, 'A clean SPA route must not be rewritten to index.html with HTTP 200.');
      assert.match(clean.headers()['content-type'], /text\/html/);
      assert.equal((await context.request.get(`${baseURL.origin}/assets/not-mounted.svg`)).status(), 404);
      assert.equal((await context.request.get(`${base}assets/not-a-real-asset.svg`)).status(), 404);
      assert.equal((await context.request.head(base)).status(), 200);
    });
    await check(`${viewport.width}px student login under project path`, async () => { await login(page); await verifyRenderedPage(page, 'How can we help you today?'); });
    if (viewport.width === 1440) await check('Skip link focuses main content without replacing the deployed hash route', async () => {
      await page.goto(urlFor('/student/offices/it'), { waitUntil: 'domcontentloaded' });
      await verifyRenderedPage(page, 'IT Services Office');
      const originalURL = page.url();
      await page.locator('.skip-link').focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(originalURL);
      await expect(page.locator('#main-content')).toBeFocused();
    });
    for (const route of studentRoutes) await visitAndReload(page, 'student', viewport, route);
    await check(`${viewport.width}px clean deep-link fallback preserves query parameters`, async () => {
      const clean = `${base}student/directions?office=it&from=Back%20Gate`;
      page.expected404s.add(clean);
      await page.goto(clean, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(urlFor('/student/directions?office=it&from=Back%20Gate'));
      await verifyRenderedPage(page, 'Directions & Contacts');
      await expect(page.getByLabel('Starting point')).toHaveValue('Back Gate');
      await expect(page.getByLabel('Where are you headed?')).toHaveValue('it');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByLabel('Starting point')).toHaveValue('Back Gate');
    });
    let reference;
    if (viewport.width === 1440) await check('Hash deployment saves a student concern and survives reload', async () => {
      await page.goto(urlFor('/student/submit?office=it'));
      await page.getByLabel('Concern title', { exact: true }).fill('GitHub Pages portal access request');
      await page.getByLabel('Describe your concern', { exact: true }).fill('My student portal password reset has not restored access. Please review this local demonstration request.');
      await page.getByRole('button', { name: 'Submit Concern', exact: true }).click();
      await expect(page).toHaveURL(/#\/student\/success\/NUL-\d{4}-\d{5}$/);
      reference = routeOf(page).split('/').at(-1);
      await page.getByRole('link', { name: 'Track My Concern', exact: true }).click();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'GitHub Pages portal access request', exact: true })).toBeVisible();
      await expect(page.locator('.concern-detail-heading')).toContainText('Pending');
    });
    await check(`${viewport.width}px student logout and staff login under project path`, async () => { await logout(page); await login(page, true); await verifyRenderedPage(page, 'Staff Dashboard'); });
    for (const route of staffRoutes) await visitAndReload(page, 'staff', viewport, route);
    if (viewport.width === 1440) {
      await check('Hash deployment staff saves assignment, response, and resolution', async () => {
        await page.goto(urlFor(`/staff/concerns?q=${reference}`));
        await expect(page.locator('tbody tr')).toHaveCount(1);
        await page.getByRole('button', { name: 'Open', exact: true }).click();
        let dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Me', exact: true }).click();
        await dialog.getByRole('button', { name: 'In Progress', exact: true }).click();
        await dialog.getByLabel('Add response to student').fill('Your request has been reviewed in the GitHub Pages demonstration.');
        await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
        await expect(page.locator('tbody tr')).toContainText('In Progress');
        await page.reload();
        await page.getByRole('button', { name: 'Open', exact: true }).click();
        dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Assigned staff')).toHaveValue('Maria Santos');
        await dialog.getByLabel('Add response to student').fill('Your portal access has been restored in this local demo.');
        await dialog.getByRole('button', { name: 'Resolve concern', exact: true }).click();
        await expect(page.locator('tbody tr')).toContainText('Resolved');
      });
      await check('Hash deployment student sees staff response and saves feedback', async () => {
        await logout(page); await login(page);
        await page.goto(urlFor(`/student/concerns/${reference}`));
        await expect(page.locator('.concern-detail-heading')).toContainText('Resolved');
        await expect(page.locator('.concern-response')).toContainText('portal access has been restored');
        await expect(page.locator('.concern-history')).toContainText('Assigned to Maria Santos');
        await page.getByRole('button', { name: '5 stars', exact: true }).click();
        await page.getByLabel('Feedback (optional)').fill('The project-path deployment preserved the full demonstration workflow.');
        await page.getByRole('button', { name: 'Submit feedback', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Thank you for your feedback' })).toBeVisible();
        await page.reload();
        await expect(page.getByText('You rated this resolution 5 out of 5 stars.')).toBeVisible();
      });
    }
    await context.close();
  }
  await check('All local images, styles, scripts, and fonts load below /NUL-Guide/', async () => {
    assert.ok(fonts.size > 0, 'The browser did not request any local fonts.');
    assert.deepEqual(report.failedAssets, []);
    assert.deepEqual(report.incorrectAssetPaths, []);
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors, []);
  });
  console.log(`${report.checks.length} GitHub Pages deployment checks passed.`);
} catch (error) {
  report.issues.push(error.stack || String(error)); console.error(error); process.exitCode = 1;
} finally {
  report.completedAt = new Date().toISOString(); report.fontRequests = [...fonts].sort();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser?.close();
}
