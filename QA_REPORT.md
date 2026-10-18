# NUL Guide verification report

Verified on October 18, 2026 (Asia/Manila).

## Source and design coverage

- Inspected both authoritative Figma sections and the detailed context plus screenshot for all 29 listed frames before implementing the corresponding screens.
- Implemented every frame as a route, dialog, or state; see [the frame checklist](IMPLEMENTATION_CHECKLIST.md).
- Downloaded 221 unique original Figma graphics. The 881 local asset files preserve each inspected frame's asset paths. Runtime source uses local assets, including the layered university crest and campus maps.
- Compared rendered desktop and mobile login, Home, service discovery, recommendations, directory, office details, maps, contact, submission, tracking, feedback, notifications, profiles, Help, and staff management views with the inspected designs. Fixed CSS precedence, input borders, card geometry, mobile login overflow, profile initials, and recommendation wrapping.

## Executed checks

| Check | Result |
| --- | --- |
| `npm test` | 27 tests passed, 0 failed |
| `npm run build` | Production build passed |
| Responsive browser screen/state sweep | 112 unique scenarios passed |
| Desktop viewport | 1440 × 1024 |
| Tablet viewport | 768 × 1024 |
| Mobile viewport | 390 × 844 |
| Browser runtime exceptions in final sweep | 0 |
| Browser console errors in final sweep | 0 |
| Failed requests / HTTP errors in final sweep | 0 / 0 |
| Visible image loading, accessible form labels, modal bounds, and unintended page overflow | Passed in the screen sweep |
| Connected browser workflow | 16 checks passed, 0 browser errors |
| Additional checks against the production preview | 7 checks passed, 0 runtime errors |

The browser sweep used installed Chrome 155 and supplemental Edge 155 on Windows. Slow browser startup and screenshot captures required retries; the consolidated report retains successful verified scenarios and records the retry history. These timing failures were distinguished from application failures. An initial JSX runtime configuration issue was found through browser QA and corrected before the successful checks.

The 16 connected workflow checks exercised:

1. Invalid credentials, login role switching, password visibility, and the remember checkbox.
2. Password-reset validation and the labeled local outcome.
3. The supplementary account dialog, guest browsing, and sign-in requirements.
4. Student authentication, logout cancellation, and a successful Smart Match.
5. Ambiguous and unmatched Smart Match requests.
6. Office searching, category filtering, and selected-office details.
7. Simulated chat, clipboard copy, Email/Call tabs, `mailto:`/`tel:` targets, and Escape closing.
8. Changing directions origin and destination and updating walking instructions.
9. Concern validation, invalid-file recovery, and valid file metadata.
10. Unique Pending submission, success copy, tracking, and persistence after reload.
11. Staff search, assignment, In Progress response, saved history, and resolution.
12. Office editing and office creation.
13. Student receipt of the staff resolution, response, history, and persistent feedback.
14. Student directory visibility of staff office changes.
15. Notification read state and persistent profile preferences.
16. FAQ search/expansion, reset cancellation, and actual sample-data restoration.

The seven additional checks ran against `npm run preview` on port 4173: role guards and remembered per-tab sessions; Smart Match error recovery and rewriting; keyboard Tab/Shift+Tab trapping and focus restoration; office changes appearing immediately in an already open student tab; edited operating days and times appearing correctly in that tab; suppression of new concern notifications when that preference is disabled; and header search plus unknown-route recovery. These checks exposed and verified fixes for remembered student sessions when another tab signs into the staff role and for noncontiguous office operating days.

The asset audit checked 2,294 visible images with zero broken images or remaining unintended aspect-ratio warnings. Original Figma-defined campus background placement was preserved.

Raw development evidence remains in `qa/browser-smoke-report.json`, `qa/workflow-report.json`, `qa/edge-cases-report.json`, and `qa/screenshots/` in the workspace. Screenshots and raw reports are excluded from the compact submission archive; the repeatable QA scripts and this report are included.

## Scope and practical limits

The submission archive was created and its selected source entries and all 881 local asset files were verified. A clean extraction also completed. A fresh `npm ci --offline --ignore-scripts` in that extracted copy was blocked by npm-cache filesystem permissions; the escalated retry was cancelled. No extracted-copy dependency installation, tests, or build are claimed. Dependency installation, all tests listed above, and production builds succeeded in the main workspace. The final archive is refreshed from the final workspace source after verification.

Vite ignores generated submission, QA, and design-reference folders. This avoids OneDrive file-watcher locks when the submission script creates and removes its temporary archive staging folder.

This is a front-end assessment demonstration. Authentication, password reset, chat, notification delivery, file upload, and campus routing have no live university backend. Attachments persist metadata only. Contact information and campus walking guidance are prototype samples. Browser storage is local to the same origin/profile; it does not synchronize unrelated devices. Desktop visual comparison was performed against the supplied reference screenshots; no numerical pixel-difference score is claimed.

The project targets current desktop and mobile browser layouts. Automated checks use Chromium browsers; real mobile hardware and Safari were not tested.
