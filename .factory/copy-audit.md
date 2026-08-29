# Copy audit

Date: 2026-08-29

Scope: the cold landing page, demo banner, empty state, required information
sections, footer, and README. Hyphenated terms and numbers count as one word.

| Landing sentence | Words |
| --- | ---: |
| Keep critical Android reminders repeating. | 5 |
| For Android users overwhelmed by notifications, keep medicine, deadlines, and calls visible until you handle them. | 14 |
| Demo — sample data, nothing is saved. | 7 |
| Try the repeating reminder below. | 5 |
| Private: data stays on this device. | 6 |
| Offline after the first visit. | 5 |
| US$4.99 once for unlimited reminders. | 5 |
| Native Android alarms repeat after the app closes. | 8 |
| The signed APK contains v1.0.5 reminder logic and updates v1.0.3. | 10 |
| One protected signal, pulled out of the noise. | 8 |
| The lane is clear. | 4 |
| Add the first reminder worth breaking through the noise. | 9 |
| Keep this list short on purpose. | 6 |
| Add medicine, a deadline, or the one call you must make. | 11 |
| Your acknowledgement rate appears here after you handle a reminder. | 10 |
| History stays on this device. | 5 |
| Add the few reminders you cannot miss. | 7 |
| Choose a schedule and a 5–60 minute repeat. | 8 |
| Snooze or acknowledge each alert when it appears. | 8 |
| Reminder data stays on this device during normal use. | 9 |
| The app has no account, ads, analytics, calendar, or contacts. | 10 |
| Android asks for notification access only after you choose it in Settings. | 11 |
| Without exact-alarm access, Android uses an inexact alarm. | 8 |
| Device power rules can delay alerts. | 6 |
| Keep another safeguard for urgent or life-safety duties. | 8 |
| Free use arms three reminders and keeps extra imports paused. | 10 |
| Pay US$4.99 once for unlimited active reminders. | 7 |
| There is no subscription. | 4 |
| Core reminder controls, accessibility, and data export stay free. | 9 |
| Sociobot checkout uses Dodo as merchant of record. | 8 |
| Refunds are handled there. | 4 |
| Repeating Android reminders that wait for your answer. | 8 |

No landing sentence exceeds 22 words. No banned term appears in the audited
copy. `tests/release-policy.test.ts` also checks every README sentence against
the 22-word cap and banned-word list on each `npm test` run.

## Terminology

| Concept | Term |
| --- | --- |
| A saved scheduled item | reminder |
| The short active list | critical lane |
| Delay a due reminder | snooze |
| Mark a reminder handled | acknowledge |
| Inactive because of the free cap | paused |
| Paid capacity record | license |
