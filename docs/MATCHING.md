# Smart Match demonstration rules

Smart Match runs locally in the browser. It uses deterministic relevance rules in `src/utils/matching.js`; it does not call an AI model or an external matching service. Percentages in the interface are demo relevance scores, **not machine-learning confidence probabilities**.

## Text and office data

The function `matchConcern(text, offices)` returns:

```js
{
  state: 'recommended' | 'low' | 'none',
  matches: [{ office, score, reasons }],
  query: 'the trimmed original concern'
}
```

It normalizes case, punctuation, apostrophes, spacing, and hyphenated words before matching whole words or phrases. Simple plural forms are supported, including `book` / `books` and `activity` / `activities`. The stored original wording remains available for display and concern submission.

The built-in groups recognize the IT Services Office, Registrar, Cashier, University Clinic, Guidance & Counseling, Student Affairs, Admissions, and Library by their names. Each group has strong service terms and weaker contextual terms. Examples include:

| Office | Examples of strong terms | Examples of weak terms |
| --- | --- | --- |
| IT Services | student portal, password, login, Wi-Fi, computer | account, access, system |
| Registrar | enrollment, transcript, grades, subject loading | subject, course, document |
| Cashier | tuition, payment, balance, receipt, refund | money, cost, bill |
| Clinic | medical, sick, fever, first aid, injury | unwell, assistance |
| Guidance | counseling, anxiety, stress, mental health | advice, personal, career |
| Student Affairs | school ID, club, student activities, student conduct | organization, activity, student life |
| Admissions | admission, application, new student, transfer student | requirements, scholarship |
| Library | library, borrow book, research database | book, research, reference |

A mental-health request does not activate the Clinic solely through the generic word `health`. Other explicit medical terms can still produce a Clinic candidate.

Office keywords and complete service phrases from shared application data also participate. Staff edits to these fields therefore affect subsequent results without changing the matching code.

## Scores

Each office receives one starting score, chosen in this order:

| Signal | Starting score |
| --- | --- |
| Complete office name appears in the concern | 98 |
| One or more strong terms | 78, plus 8 per additional strong term, capped at 95 |
| One or more configured office keywords | 72, plus 5 per additional keyword, capped at 86 |
| Weak contextual terms only | 44 plus 8 per weak term, capped at 65 |
| No recognized signal | 0 |

A complete service phrase raises the score to at least 90. When strong and weak terms both match, a non-direct score gains 3 points, capped at 95. An explicit complete office name retains its 98-point score. Matching words and phrases are returned as `reasons`.

Zero-score offices are removed. Candidates are ranked by descending score, with office name as a deterministic tie-breaker.

## Recommendation and clarification

If the two leading candidates belong to different categories, the runner-up scores at least 50, and the gap between them is below 28 points, the request is treated as ambiguous. Scores are capped at 64, 56, 48, then 40 for further candidates. The interface asks the student to choose an office or clarify the concern.

After this adjustment:

- A leading score of 70 or more returns `recommended`.
- A positive leading score below 70 returns `low`.
- No recognized candidates, blank input, an empty office list, or an invalid office list returns `none`.

At most three offices are returned. Inputs and directory records are not mutated.

## Related offices in the IT prototype

For a recommended IT request, two related offices from the Figma design can appear as alternatives:

- Registrar: fixed score 58, for enrollment or student-record checks that may affect portal access.
- Student Affairs: fixed score 31, for general assistance and office referrals.

These are added only if the office exists and is not already a candidate. Existing keyword scores are preserved. Related-office suggestions are added **after** the recommendation/clarification decision and never increase or reduce the main recommendation. They are also demo relevance scores, not probabilities.

## Representative results

| Concern | Expected result |
| --- | --- |
| “I forgot my student portal password and cannot log in.” | Recommended IT Services, plus related alternatives |
| “I need help with enrollment and subject loading.” | Recommended Registrar |
| “My tuition payment has not been reflected in my balance.” | Recommended Cashier |
| “I have a fever and need a medical consultation.” | Recommended Clinic |
| “I need mental health counseling.” | Recommended Guidance & Counseling |
| “Where can I get my school ID?” | Recommended Student Affairs |
| “I have a subject payment question.” | Low relevance: Cashier and Registrar; clarification requested |
| “Where can I park a bicycle?” | No match; browse the Office Directory |

Run `npm.cmd test` on Windows, or `npm test` in another shell, to run the matching and shared-data tests.

## Error state

Unexpected matching failures show the Figma error state with a working **Try Again** action. To review that state in the local demonstration, open `/student/recommendation?q=password&state=error` after signing in. Retrying removes the simulated error flag and processes the same concern normally. The local demo does not pretend to make a network request.
