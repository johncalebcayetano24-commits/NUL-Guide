# NUL Guide

GitHub repository: [johncalebcayetano24-commits/NUL-Guide](https://github.com/johncalebcayetano24-commits/NUL-Guide).

GitHub Pages entry point: [NUL Guide](https://johncalebcayetano24-commits.github.io/NUL-Guide/). Deployment configuration, refresh-safe links, and verification instructions are in [the GitHub Pages guide](docs/GITHUB_PAGES.md).

**NU Student Service Finder & Assistance Platform** is a responsive front-end assessment project based on the group's Figma prototype. Students can find university offices, submit concerns, and follow responses. Staff can manage those same concerns and maintain the office directory.

The application uses React, Vite, JavaScript/JSX, semantic HTML, modular CSS, React Router, and browser storage. Original exported Figma graphics are included in `public/assets`. Inter, Montserrat, and Fraunces fonts are installed through the locked npm dependencies and served locally.

## Project team

- Bello, Gerald B.
- Cayetano, John Caleb S.
- Dado, Lawrence I.

## Install and run

Install a compatible Node.js release meeting the `package.json` requirement of Node 20.19 or newer, with npm. Extract the submission ZIP and open its **NUL-Guide** folder in VS Code or a terminal.

For a repeatable installation using the included lockfile:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally **http://127.0.0.1:5173**. Keep the terminal running. `npm install` can also install dependencies during development. On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` launcher.

Do not open `index.html` directly from the filesystem; run the development server or production preview so modules and application routes load correctly.

```sh
npm test
npm run build
npm run preview
```

`npm test` runs the domain and Smart Match unit tests. `npm run build` creates the production application in `dist`; `npm run preview` serves that build, normally at **http://127.0.0.1:4173**. A deployed static host must direct application routes back to `index.html`.

## Demo sign-in

Choose the matching role on the login page. Both accounts use the password **`NULGuide2026!`**.

| Role | Account | Alternative identifier |
| --- | --- | --- |
| Student — Juan Dela Cruz | `juan.delacruz@students.nu-laguna.edu.ph` | `2025-1024378` |
| Staff/Admin — Maria Santos | `maria.santos@nu-laguna.edu.ph` | — |

The sample credentials are prefilled. **Continue as Guest** permits service and office browsing; concern submission, personal tracking, and profile access require the student demo sign-in. Forgot password and Create an account open labeled demonstration dialogs.

## Features and routes

| Route | Purpose |
| --- | --- |
| `/` | Redirect to login or the signed-in role's home page |
| `/login` | Student sign-in, guest access, reset/account dialogs |
| `/login?role=staff` | Staff/Admin sign-in |
| `/student` | Redirect to student Home |
| `/student/home` | Dashboard, Smart Match, quick links, recent concerns |
| `/student/find` | Describe a concern to find a service |
| `/student/recommendation?q=...` | Recommended offices, alternatives, low relevance and no-match states |
| `/student/offices` | Searchable directory with category filters |
| `/student/offices/:officeId` | Selected office's services, location, hours, and contacts |
| `/student/directions?office=...` | Campus reference map, office selection, and walking guidance |
| `/student/submit?office=...` | Concern category, office, description, attachment metadata, and contact preference |
| `/student/success/:concernId` | Submission confirmation and copyable unique reference |
| `/student/concerns` | Personal concern search, status filters, and progress |
| `/student/concerns/:concernId` | Response, history, status, contact actions, and resolution feedback |
| `/student/notifications` | Read/unread updates and related destinations |
| `/student/announcements` | Prototype university announcements |
| `/student/profile` | Account information, preferences, support, reset, and logout |
| `/student/help` | Searchable FAQs, service shortcuts, support, and reset |
| `/staff` | Redirect to staff Dashboard |
| `/staff/dashboard` | Data-driven status totals, new requests, assignment actions, and activity |
| `/staff/concerns` | Search/filter requests, open the concern editor, assign, respond, and resolve |
| `/staff/offices` | Add/edit offices, services, hours, location, contacts, and availability |
| `/staff/students` | Sample student records, computed concern counts, and filtered concern links |
| `/staff/notifications` | Staff read/unread notifications |
| `/staff/profile` | Maria's account, office, permissions, reset, and logout |

Office details include a **Contact Office** dialog with Live Chat, Email, and Call tabs. Logout uses a confirmation dialog. Concern statuses are **Pending**, **In Progress**, and **Resolved**. Resolved concerns accept a 1–5 star rating and an optional comment once.

Student and staff views share the same office and concern records. A new student submission appears for staff; staff responses and status changes appear in student history and notifications. Office edits appear in the student directory and office details. The initial sample includes eight offices and eight concerns: four Pending, two In Progress, and two Resolved.

See [the demonstration walkthrough](docs/DEMO_WALKTHROUGH.md), [the 29-frame implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md), [the QA plan](docs/QA_PLAN.md), and [the executed QA report](docs/QA_REPORT.md). Verification passed 27 logic tests, 112 responsive screen/state checks, 16 connected workflow checks, and 7 additional production browser checks.

## Storage and simulated functionality

- **Local data:** Concerns, office changes, read states, preferences, and feedback are saved to this browser's `localStorage` under `nul-guide-data-v1`. Open tabs at the same origin receive shared data changes through the browser's `storage` event. Use the same hostname and port for both roles. Unrelated browsers, profiles, origins, and devices do not synchronize; there is no backend or database server. If browser storage is unavailable, changes last only for the open application session.
- **Sessions:** Ordinary sign-in uses `sessionStorage`; **Keep me signed in** uses `localStorage`. These are simulated sessions with visible demo credentials and client-side checks, not production authentication or authorization security. Do not enter a real NU password or real student information.
- **Smart Match:** Deterministic local keyword and service rules rank offices. Displayed scores represent demo relevance, not machine-learning confidence probabilities. Ambiguous and unmatched requests have explicit fallback states.
- **Attachments:** PDF, JPG/JPEG, and PNG selections are limited to 10 MB. Only the selected file's name, MIME type, and size are persisted. File contents are not uploaded or stored, and no server receives an attachment.
- **Contacts:** Phone numbers and email addresses are prototype samples, not verified official university contacts. Email and telephone actions use `mailto:` and `tel:` links. No message is sent automatically by the app. Chat uses a labeled simulated conversation; no staff member receives it.
- **Directions:** The campus layout and walking instructions are a prototype guide. They do not use live GPS, measure a user's location, or provide real-time route accuracy.
- **Account and email flows:** Password reset, account creation, email copies, and other delivery preferences demonstrate the interface and save supported local preferences. They do not create university accounts, send reset links, SMS, or emails.
- **Historical records:** Original sample concerns and announcements retain their September 2026 dates. Relative time labels are calculated when the app runs. New records use the current date and a unique `NUL-YYYY-NNNNN` reference.

To return to the original records, choose **Restore sample data** from either role's Profile, or from Help Center, and confirm. This removes locally saved concern submissions, feedback, office edits, read states, and preferences and restores the sample dataset.

## Project organization

| Location | Contents |
| --- | --- |
| `src/pages/student` | Student home, service discovery, office views, and support pages |
| `src/pages/staff` | Staff dashboard, concerns, offices, and students |
| `src/components`, `src/layouts` | Shared controls, dialogs, branding, and role-specific navigation |
| `src/state/AppContext.jsx` | Shared state, persistence, sessions, and actions |
| `src/data`, `src/utils` | Sample records, local asset mapping, matching, and domain rules |
| `src/styles` | Design tokens and modular responsive styles |
| `public/assets` | Original exported local Figma graphics |
| `tests`, `qa` | Automated domain tests and browser QA scripts |
| `docs` | Frame mapping, demonstration steps, and verification procedures |
| `scripts/package-submission.ps1` | Creates the source submission archive |

## Figma references and final submission

Both original designs are in the group's **NUL-GUIDE** file:

- [Student Web Application — section 462:391](https://www.figma.com/design/rY8i8b64mHlDPXQw2Tfwo8/NUL-GUIDE?node-id=462-391)
- [Staff/Admin Web Application — section 462:392](https://www.figma.com/design/rY8i8b64mHlDPXQw2Tfwo8/NUL-GUIDE?node-id=462-392)

The design remains the group's reference. Included Figma graphics and university branding are project reference materials; this repository does not grant rights beyond those of their respective owners.

The group selected the member-surname submission identifier **Bello_Cayetano_Dado**. Create the agreed archive **Bello_Cayetano_Dado_finals.zip** in PowerShell:

```powershell
npm run submission -- -GroupNumber Bello_Cayetano_Dado
```

The script's required `GroupNumber` parameter accepts the chosen identifier using only letters, digits, underscores, or hyphens. It creates **`submission/Bello_Cayetano_Dado_finals.zip`**, with a top-level **NUL-Guide** folder containing the source, local assets, package lockfile, configuration, documentation, and tests. It excludes `node_modules`, `dist`, browser screenshots, editor files, raw generated Figma context, and existing ZIP archives. Dependencies are restored with `npm ci` after extraction. To preview packaging without writing an archive, add `-WhatIf`. Replacing an existing archive requires `-Overwrite`.

Before submission, extract the ZIP into a fresh folder, run `npm ci`, `npm test`, and `npm run build`, then launch it with `npm run dev`.

**Professor's instruction:** The group must also attach the Figma link separately in the designated **Assignment tab** and keep the file accessible to the professor. Include both section links so the student and staff references can be reviewed.
