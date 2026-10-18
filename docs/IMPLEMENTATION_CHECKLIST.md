# Figma implementation checklist

Authoritative file: `rY8i8b64mHlDPXQw2Tfwo8`. Sections `462:391` and `462:392` were inspected with the Figma MCP before implementation. Individual design context and screenshots are used for each frame. The following 29 frames are accounted for as routes or interactive states.

| Node | Design frame | Implementation target |
| --- | --- | --- |
| 394:192 | Student Login | `/login`, student role |
| 403:876 | Forgot Password | Reset password dialog on login |
| 394:500 | Home Dashboard | `/student/home` |
| 394:709 | Find a Service | `/student/find` |
| 395:319 | Office Recommendation | `/student/recommendation?q=…` |
| 403:260 | Low-confidence Smart Match | Recommendation state |
| 403:402 | No-match/error | Recommendation empty/error state |
| 395:631 | Office Directory | `/student/offices` |
| 395:914 | Office Details | `/student/offices/:officeId` |
| 403:443 | Contact Office | Office detail dialog, Chat/Email/Call tabs |
| 396:337 | Directions & Contacts | `/student/directions?office=…` |
| 396:546 | Concern Submission | `/student/submit` |
| 397:334 | My Concerns | `/student/concerns` |
| 397:548 | Concern Details/Feedback | `/student/concerns/:concernId` |
| 397:726 | Student Notifications | `/student/notifications` |
| 403:858 | Announcements | `/student/announcements` |
| 397:919 | Student Profile | `/student/profile` |
| 403:987 | Logout Confirmation | Shared confirmation dialog |
| 462:93 | Help Center | `/student/help` |
| 462:393 | Concern Success | `/student/success/:concernId` |
| 405:93 | Staff Login | `/login?role=staff` |
| 400:327 | Staff Dashboard | `/staff/dashboard` |
| 400:611 | Concerns Management | `/staff/concerns` |
| 402:177 | Open Concern | Concern management dialog |
| 400:955 | Office Management | `/staff/offices` |
| 400:956 | Edit Office | Office management dialog; add variant |
| 402:653 | Students | `/staff/students` |
| 402:789 | Staff Notifications | `/staff/notifications` |
| 402:906 | Staff Profile | `/staff/profile` |

## Phases

- [x] Workspace audit: empty apart from VS Code settings; React/Vite selected.
- [x] Both section nodes inspected and child-frame structure confirmed.
- [x] Retrieve each frame's detailed context and screenshot.
- [x] Download original local design assets and preserve slots.
- [x] Foundation: tokens, semantic UI, responsive layouts, shared persisted data.
- [x] All student routes and interaction states.
- [x] All staff routes and interaction states.
- [x] Connected submission, staff update, notification, feedback, office edit workflow.
- [x] Accessibility, validation, responsive drawer/dialog/table behavior.
- [x] Production build and browser workflows at desktop/tablet/mobile.
- [x] Source README, QA report, and user-selected `Bello_Cayetano_Dado_finals.zip`.
