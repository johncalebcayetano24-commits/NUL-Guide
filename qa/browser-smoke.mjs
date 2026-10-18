import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DEMO_PASSWORD } from '../src/data/seed.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const executablePath = process.env.BROWSER_EXECUTABLE || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const output = path.resolve(process.env.QA_OUTPUT || 'qa');
const requestedScenarios = process.env.QA_SCENARIOS?.split(',').map(value => value.trim()).filter(Boolean);
const requestedWidths = process.env.QA_WIDTHS?.split(',').map(Number).filter(Number.isFinite);
const screenshots = path.join(output, 'screenshots');
await mkdir(screenshots, { recursive: true });

const viewports = [
  { width: 1440, height: 1024 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
].filter(viewport => !requestedWidths?.length || requestedWidths.includes(viewport.width));
if (!viewports.length) throw new Error('QA_WIDTHS must select at least one supported width: 1440, 768, 390.');
const studentRoutes = [
  ['home', '/student/home', 'How can we help you today?'],
  ['find-service', '/student/find', 'Find a Service'],
  ['recommendation', '/student/recommendation?q=I%20forgot%20my%20student%20portal%20password', null],
  ['match-low', '/student/recommendation?q=I%20have%20a%20subject%20payment%20question', null],
  ['match-none', '/student/recommendation?q=Where%20can%20I%20park%20a%20bicycle', null],
  ['match-error', '/student/recommendation?q=portal&state=error', null],
  ['office-directory', '/student/offices', 'Office Directory'],
  ['office-it', '/student/offices/it', 'IT Services Office'],
  ['office-registrar', '/student/offices/registrar', null],
  ['contact-chat', '/student/offices/it?contact=chat', 'IT Services Office'],
  ['contact-email', '/student/offices/it?contact=email', 'IT Services Office'],
  ['contact-call', '/student/offices/it?contact=call', 'IT Services Office'],
  ['directions', '/student/directions?office=it', 'Directions & Contacts'],
  ['submit-concern', '/student/submit?office=it', 'Concern Submission'],
  ['my-concerns', '/student/concerns', 'Track My Concerns'],
  ['concern-progress', '/student/concerns/NUL-2026-00123', null],
  ['concern-resolved-feedback', '/student/concerns/NUL-2026-00119', null],
  ['concern-success', '/student/success/NUL-2026-00124', 'Concern Submitted Successfully'],
  ['notifications', '/student/notifications', 'Notifications'],
  ['announcements', '/student/announcements', 'Announcements'],
  ['profile', '/student/profile', 'Juan Dela Cruz'],
  ['help-center', '/student/help', 'Help Center'],
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

const report = {
  startedAt: new Date().toISOString(), baseURL, executablePath: executablePath || 'Playwright default Chromium', partial: !!(requestedScenarios?.length || requestedWidths?.length), requestedScenarios, requestedWidths,
  scenarios: [], pageErrors: [], consoleErrors: [], failedRequests: [], badResponses: [],
};
const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], ...(executablePath ? { executablePath } : {}) });

function recordFailure(name, viewport, error) {
  report.scenarios.push({ name, viewport, passed: false, error: String(error?.stack || error) });
  console.error(`FAIL ${viewport.width}x${viewport.height} ${name}: ${error.message || error}`);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, locale: 'en-US', timezoneId: 'Asia/Manila', reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(60000);
    let currentScenario = '';
    page.on('pageerror', error => { report.pageErrors.push({ scenario: currentScenario, message: error.message, stack: error.stack }); console.error(`RUNTIME ${currentScenario}: ${error.message}`); });
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ scenario: currentScenario, message: message.text() }); });
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') report.failedRequests.push({ scenario: currentScenario, url: request.url(), failure: request.failure() });
    });
    page.on('response', response => { if (response.status() >= 400) report.badResponses.push({ scenario: currentScenario, status: response.status(), url: response.url() }); });

    async function capture(name, route, expectedHeading) {
      if (requestedScenarios?.length && !requestedScenarios.includes(name)) return;
      currentScenario = `${viewport.width}x${viewport.height}-${name}`;
      try {
        if (route) await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); })));
        });
        if (route?.startsWith('/student/') || route?.startsWith('/staff/')) {
          if (new URL(page.url()).pathname === '/login') throw new Error('Protected route unexpectedly returned to login.');
          await page.locator('#main-content').waitFor({ state: 'visible' });
        }
        if (expectedHeading) await page.getByRole('heading', { name: expectedHeading, exact: true, level: 1 }).waitFor({ state: 'visible' });
        const metrics = await page.evaluate(() => {
          const images = [...document.images].map(image => {
            const rect = image.getBoundingClientRect();
            return { src: new URL(image.currentSrc || image.src || '', location.href).pathname, loaded: image.complete && image.naturalWidth > 0, visible: rect.width > 0 && rect.height > 0, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, renderedWidth: Number(rect.width.toFixed(2)), renderedHeight: Number(rect.height.toFixed(2)) };
          });
          const unlabeledControls = [...document.querySelectorAll('input,select,textarea')].filter(control => {
            if (control.type === 'hidden' || !control.getClientRects().length) return false;
            return !control.labels?.length && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
          }).map(control => ({ tag: control.tagName, type: control.type, placeholder: control.getAttribute('placeholder') }));
          const dialog = document.querySelector('[role="dialog"]');
          const dialogRect = dialog?.getBoundingClientRect();
          return {
            title: document.title, headingCount: document.querySelectorAll('h1').length,
            viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth,
            overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
            overflowElements: document.documentElement.scrollWidth > window.innerWidth + 2 ? [...document.querySelectorAll('body *')].filter(element => { const rect = element.getBoundingClientRect(); return rect.right > innerWidth + 2 && rect.width > 0 && getComputedStyle(element).position !== 'fixed'; }).slice(0, 10).map(element => ({ tag: element.tagName, className: String(element.className), right: Math.round(element.getBoundingClientRect().right) })) : [],
            images, brokenImages: images.filter(image => !image.loaded), unlabeledControls,
            dialog: dialog ? { focusInside: dialog.contains(document.activeElement), width: dialogRect.width, bottom: dialogRect.bottom, top: dialogRect.top, clipped: dialogRect.bottom > innerHeight + 2 || dialogRect.top < -2 } : null,
          };
        });
        const filename = `${currentScenario}.png`;
        await page.screenshot({ path: path.join(screenshots, filename), fullPage: true, animations: 'disabled', timeout: 30000 });
        const failures = [
          ...(metrics.headingCount === 0 ? ['Page has no level-one heading.'] : []),
          ...(metrics.overflow ? [`Page overflows horizontally (${metrics.documentWidth}px > ${metrics.viewportWidth}px).`] : []),
          ...(metrics.brokenImages.length ? [`${metrics.brokenImages.length} images failed to load.`] : []),
          ...(metrics.unlabeledControls.length ? [`${metrics.unlabeledControls.length} visible form controls have no accessible label.`] : []),
          ...(metrics.dialog?.clipped ? ['Dialog extends outside the viewport.'] : []),
          ...(metrics.dialog && !metrics.dialog.focusInside ? ['Focus is outside the open dialog.'] : []),
        ];
        report.scenarios.push({ name, viewport, route: new URL(page.url()).pathname + new URL(page.url()).search, passed: !failures.length, failures, screenshot: `screenshots/${filename}`, ...metrics });
        console.log(`${failures.length ? 'FAIL' : 'PASS'} ${viewport.width}x${viewport.height} ${name}${failures.length ? ': ' + failures.join(' ') : ''}`);
      } catch (error) {
        try { await page.screenshot({ path: path.join(screenshots, `${currentScenario}-failure.png`), fullPage: true, animations: 'disabled' }); } catch { /* The browser may have closed after a startup failure. */ }
        recordFailure(name, viewport, error);
      }
    }

    async function login(role) {
      currentScenario = `${viewport.width}x${viewport.height}-${role}-ui-login`;
      await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
      if (role === 'staff') await page.getByRole('button', { name: 'Staff / Admin', exact: true }).click();
      await page.getByLabel(role === 'staff' ? 'Staff email' : 'Student email or Student ID', { exact: true }).fill(role === 'staff' ? 'maria.santos@nu-laguna.edu.ph' : 'juan.delacruz@students.nu-laguna.edu.ph');
      await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORD);
      await page.getByRole('button', { name: role === 'staff' ? 'Log in to Staff Dashboard' : 'Log in to NUL Guide', exact: true }).click();
      await page.waitForURL(`${baseURL}/${role}/${role === 'staff' ? 'dashboard' : 'home'}`);
      report.scenarios.push({ name: `${role}-ui-login`, viewport, passed: true });
    }

    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Welcome back', exact: true }).waitFor({ state: 'visible' });
    await capture('student-login', null, 'Welcome back');
    try {
      await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
      await capture('forgot-password-modal');
      await page.keyboard.press('Escape');
      await login('student');
      for (const [name, route, heading] of studentRoutes) await capture(`student-${name}`, route, heading);
      await page.goto(`${baseURL}/student/profile`, { waitUntil: 'networkidle' });
      await page.locator('.profile-logout').click();
      await capture('logout-confirmation');
      await page.getByRole('button', { name: 'Stay logged in', exact: true }).click();
      if (viewport.width <= 900) {
        await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
        await capture('student-mobile-navigation');
        await page.keyboard.press('Escape');
      }
    } catch (error) { recordFailure('student-session-sweep', viewport, error); }

    try {
      await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Staff / Admin', exact: true }).click();
      await capture('staff-login');
      await login('staff');
      for (const [name, route, heading] of staffRoutes) await capture(`staff-${name}`, route, heading);
      await page.goto(`${baseURL}/staff/offices`, { waitUntil: 'networkidle' });
      await page.getByRole('row').filter({ hasText: 'IT Services Office' }).getByRole('button', { name: 'Edit', exact: true }).click();
      await capture('staff-office-edit-modal');
      await page.keyboard.press('Escape');
      if (viewport.width <= 900) {
        await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
        await capture('staff-mobile-navigation');
        await page.keyboard.press('Escape');
      }
    } catch (error) { recordFailure('staff-session-sweep', viewport, error); }
    await context.close();
  }
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.summary = {
    scenarios: report.scenarios.length,
    passed: report.scenarios.filter(scenario => scenario.passed).length,
    failed: report.scenarios.filter(scenario => !scenario.passed).length,
    pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length,
    failedRequests: report.failedRequests.length, badResponses: report.badResponses.length,
  };
  await writeFile(path.join(output, 'browser-smoke-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  if (report.summary.failed || report.pageErrors.length || report.consoleErrors.length || report.failedRequests.length || report.badResponses.length) process.exitCode = 1;
}
