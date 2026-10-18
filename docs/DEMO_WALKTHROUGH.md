# NUL Guide demonstration walkthrough

This is a procedure for presenting and checking the local application. It does not itself record completed test results.

## Prepare

1. Run `npm ci` and `npm run dev` from the NUL-Guide folder. Open the Vite URL, normally `http://127.0.0.1:5173`.
2. Select Student and sign in as `juan.delacruz@students.nu-laguna.edu.ph` or `2025-1024378`, using `NULGuide2026!`.
3. Open Profile and choose **Restore sample data**. Review the confirmation and restore the records for a repeatable presentation.
4. Explain that the app is a front-end prototype using sample contacts, simulated accounts, and browser storage. No official university service receives a request.

## Find the right office

1. On Home or **Find a Service**, enter `I cannot log in to the student portal after resetting my password.`
2. Open the recommendation for **IT Services Office**. Explain that Smart Match uses local keyword relevance rules; its score is not an AI confidence probability.
3. Open the office details. Inspect its description, services, location, hours, and sample contact information.
4. Open **Contact Office** and switch between Live Chat, Email, and Call. The chat is simulated; mail and telephone actions open the device's handler.
5. Open **Get Directions**. Change the selected office or origin and inspect the campus reference map and walking steps. This is a prototype guide without GPS.
6. To demonstrate ambiguity, try `I have a subject payment question.` Rewrite the request or choose an alternative.
7. To demonstrate no match, try `Where can I park a bicycle?` and use the directory fallback. Search the directory and select category filters.

## Submit and track a student concern

1. Open **Submit a Concern**, or submit from an office's details.
2. Try submitting an incomplete form to inspect validation. Then choose an office and category, enter a clear title, and describe the problem in detail.
3. Select a PDF, JPG/JPEG, or PNG below 10 MB. Inspect the selected filename, remove it, and optionally select it again. Unsupported formats and files above 10 MB display validation. Only file metadata is retained.
4. Choose a contact preference and select **Submit Concern**.
5. On the success page, copy or record the unique `NUL-YYYY-NNNNN` reference. Select **Track My Concern**.
6. Verify the record is Pending, belongs to the selected office, and has an initial history entry. Open **My Concerns**, search the reference, and use the status filters.

## Respond as staff

1. Log out through the confirmation dialog. On login choose **Staff / Admin**.
2. Sign in as `maria.santos@nu-laguna.edu.ph` with `NULGuide2026!`.
3. Inspect the dashboard counts and new requests. The counts are computed from shared records.
4. Open **Concerns** and search the reference recorded above. Test its office/status filters, then select **Open**.
5. In the concern dialog, select **Me** beside Assigned staff, set **In Progress**, and enter a response such as `We are reviewing the portal account and will update you here.` Select **Save changes**.
6. Reopen the record and inspect its saved assignment, response, and history.
7. Enter a resolution such as `Your demo portal access has been restored. Please try signing in again.` Select **Resolve concern**. A resolution requires a response.
8. Open **Students** and use Juan's **View concerns** action to see his related requests.

## Return to the student

1. Log out and sign in again as Juan.
2. Open Notifications and follow the update for the new reference. Verify the staff response and Resolved progress history.
3. Select a rating from 1 to 5 stars and optionally enter a comment. Submit feedback and reload the page to inspect persistence. The same resolution cannot receive duplicate feedback.
4. Use the notification All/Unread filters, open an individual notification, and select **Mark all read**. Check that read states and badge counts update.

For a simultaneous demonstration, use two tabs at the **same exact origin** with **Keep me signed in** off. Sign in as student in one tab and staff in the other. Shared data changes propagate through `localStorage` and its `storage` event; the app does not synchronize unrelated browsers or devices.

## Maintain the office directory

1. As Maria, open **Offices** and edit an office. Try Cancel first, then make a small change to its description or hours and select **Save changes**.
2. Return as Juan and open that office in the directory. Inspect the same updated fields.
3. As staff, use **Add Office** to demonstrate the form's required fields, services, location, hours, contacts, and availability. A saved office appears in both interfaces.

## Remaining screens and responsive checks

- On student Profile, inspect the Registrar-managed account details and toggle notification preferences. Reload to inspect saved values. Email copies are a saved preference; no real email is sent.
- Open Announcements and Help Center. Search FAQs, expand an answer, and use the service, directory, tracking, and support shortcuts.
- Inspect Maria's Profile and permissions, then test logout cancellation and confirmation.
- Sign out and use **Continue as Guest**. Browse services and offices, then open submission or tracking to inspect the sign-in prompt.
- At desktop 1440 px, tablet 768 px, and mobile 390 px widths, inspect navigation, reflowed cards/forms, scrollable tables, and dialogs. Check keyboard focus, field labels, Escape, and modal focus return. Record actual outcomes in the QA report.

## Finish

Restore the original sample data from Profile or Help Center if a clean dataset is needed. Run `npm test` and `npm run build`. Follow the README packaging instructions to create the agreed **Bello_Cayetano_Dado_finals.zip**, verify the extracted project runs, and attach the Figma references separately in the professor's designated Assignment tab.
