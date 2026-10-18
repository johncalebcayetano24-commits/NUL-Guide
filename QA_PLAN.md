# NUL Guide QA plan

This plan distinguishes automated domain checks from browser checks. A listed scenario is not a claim that it has passed; record executed checks and remaining limitations in the final QA report.

## Automated checks

Run `npm.cmd test` on Windows or `npm test` on other platforms, followed by `npm.cmd run build` / `npm run build`.

| Area | Coverage |
| --- | --- |
| Reference generation | Maximum current-year sequence, unordered records, unique sequential submissions, zero padding, Manila New Year boundary |
| Staff concern updates | Assignment, assignment clearing, office transfer, status changes, responses, resolution, previous history retention, non-mutation, no duplicate events on unchanged saves |
| Attachments | PDF/JPG/JPEG/PNG, uppercase extensions, missing browser MIME metadata, exact 10 MB boundary, unsupported types and disguised extensions |
| Smart Match | Eight office examples, text normalization, direct office naming, ambiguous category clarification, weak relevance, no match, whole-word matching, staff-edited service metadata, deterministic ordered alternatives |

The matcher tests verify deterministic relevance rules. A score is not a machine-learning probability. File tests verify client-side selection rules; they do not constitute server-side malware inspection or upload validation.

## Browser environment and baseline

Use a fresh origin or the application's Restore Sample Data control before a reproducible run. Do not clear unrelated browser storage. Test the same local development origin throughout the connected workflow. Record browser, viewport, date, command output, and any console errors in the QA report.

Use desktop 1440 × 1024, tablet 768 × 1024, and mobile 390 × 844. Compare desktop screens with the corresponding screenshots in `design-reference`. Use actual interface elements; Figma screenshots are comparison references only.

## Login and navigation

1. Open `/login`. Switch Student and Staff/Admin roles and verify their labels, fields, active tab, and submit destinations.
2. Submit empty and invalid credentials; verify useful validation. Toggle password visibility and Keep me signed in. Sign in using the documented demo accounts.
3. Open Forgot Password, complete its demo interaction, and close it through its close button, Escape, and backdrop where supported. Check focus returns to the trigger.
4. Continue as Guest. Confirm service browsing works and submission/tracking actions explain the need to sign in.
5. Open Create an account and verify the supplementary demo interaction is clearly labeled.
6. Traverse every sidebar link in each role, plus header notifications/profile, home quick links, and return links. Reload a deep route and confirm it renders.
7. Open logout confirmation, cancel it, then confirm logout and verify the session ends.

## Student service discovery

1. Submit portal/password, enrollment, tuition/payment, and health queries from Home and Find a Service. Confirm the selected office and alternatives reflect the entered query.
2. Enter `I have a subject payment question.` to inspect the low relevance state. Rewrite the concern and select an alternative.
3. Enter unrelated text such as `Where can I park a bicycle?` to inspect the no-match state. Use Browse Directory and the retry/edit controls.
4. Search the Office Directory, select each category, combine filters, and verify an empty result. Clear the filters.
5. Open at least two different offices and compare name, services, location, hours, and contacts. Test copying a contact, opening a mail or telephone link, submitting a concern, and opening directions.
6. Open Contact Office. Test Live Chat, Email, and Call tabs; confirm chat is identified as simulated and contact details as samples.
7. Change origin/destination in Directions & Contacts. Confirm selected office details and walking steps update and the original campus asset loads.

## Connected concern lifecycle

1. Sign in as Juan Dela Cruz. Open Submit Concern. Test required fields, category/office selection, title, description, character counter, and contact preference.
2. Select a supported attachment, remove it, and select another. Try an unsupported file and one over 10 MB. Confirm only file metadata is persisted and no real upload is claimed.
3. Submit a valid concern. Record the unique `NUL-YYYY-NNNNN` reference from the success page. Open tracking and details and confirm Pending status and initial history.
4. Submit another concern and verify a distinct reference and correct student counts.
5. Log out and sign in as Maria Santos. Search the new reference in Concerns, filter its status/office, open it, assign it to Me, select In Progress, and add a response. Save and reopen it.
6. Verify saved assignment, response, history, dashboard counts, workload, recent activity, and student concern counts.
7. Resolve the concern with a response. Confirm response validation, resolved history, and dashboard/filter changes.
8. Return as Juan. Confirm the same concern shows the staff response and Resolved status, and a new notification leads to it.
9. Submit a rating and optional written feedback. Reload and verify feedback persists and duplicate feedback is prevented.
10. Close and reopen the browser or reload according to the selected sign-in persistence. Verify demo data persists in the same origin. Restore Sample Data at the end when appropriate.

## Staff office and student management

1. From the dashboard, Assign to Me on a request; verify it leaves the unassigned request list and appears assigned in Concerns. Test Respond and all three quick actions.
2. Search concerns by reference, title, and student. Combine status and office filters. Open a student's View concerns action and verify its student filter can be removed.
3. Open an office editor. Cancel a change and verify it is discarded. Save revised description, services, location, hours, phone/email, and status.
4. Sign in as a student and confirm the directory/details show the edited office information.
5. Add an office using the same form. Verify required fields, at least one operating day, closing time later than opening time, and email validation. Confirm the new office appears in both interfaces.

## Remaining screens and accessibility

1. Test All/Unread notification filters, individual read state, Mark all read, badge counts, and destination links for both roles. Reload to check persistence.
2. Open Announcements, search/filter where provided, and inspect announcement details. Open Help Center and expand/collapse FAQs.
3. Open student Profile, edit supported preferences/details, save, and reload. Inspect staff Profile identity, account information, permissions, and logout.
4. Navigate with Tab/Shift+Tab and activate controls with Enter/Space. Verify visible focus, labeled fields, meaningful validation, logical heading order, and dialog focus containment/restoration.
5. At all three viewport widths, inspect the navigation drawer, stacked cards/forms, tables, filters, modal scrolling/footer controls, text wrapping, and absence of unintended page-level horizontal overflow.
6. Inspect console/runtime errors and network failures. Confirm all visible local images have completed loading and retain their intended geometry. Compare logos, campus illustrations, icons, colors, spacing, typography, borders, and active states against Figma.

## Submission verification

Build production assets, verify the production preview, and confirm README installation/demo instructions. Extract the final source archive into a clean directory, install dependencies, run tests/build, and launch it. Ensure source, configuration, local assets, original Figma links, and documentation are included; omit `node_modules` and transient browser artifacts. Name the archive with the supplied group number. The group must also attach the Figma link separately in the designated Assignment tab.
