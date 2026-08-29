# Copy audit

Date: 2026-08-29

Counting method: Unicode letter and number tokens. Joined versions, ranges,
paths, and hyphenated terms count as one word. The reproducible tokenizer is
exported by `scripts/copy-audit.mjs` and checked by `npm test`.

## Landing and demo sentences

| Sentence | Words | Result |
| --- | ---: | --- |
| Keep critical Android reminders repeating. | 5 | Pass |
| For Android users overwhelmed by notifications, repeat medicine, deadline, and call reminders until you snooze or acknowledge them. | 18 | Pass |
| Opens three isolated sample reminders. | 5 | Pass |
| Private: data stays on this device. | 6 | Pass |
| Offline after the first visit. | 5 | Pass |
| US$4.99 once for unlimited reminders. | 6 | Pass |
| Compare this SHA-256 value with the downloaded file to check that it arrived unchanged. | 14 | Pass |
| A cassette tape forms one lane ending at a checked reminder. | 11 | Pass |
| Demo — sample data, nothing is saved. | 6 | Pass |
| Acknowledge or snooze the due sample below. | 7 | Pass |
| No reminders need acknowledgement now. | 5 | Pass |
| Your next saved reminder is not due yet. | 8 | Pass |
| Add a reminder to see it here when it is due. | 11 | Pass |
| Add medicine, a deadline, or the one call you must make. | 11 | Pass |
| Your acknowledgement rate appears here after you acknowledge a reminder. | 10 | Pass |
| History stays on this device. | 5 | Pass |
| Add the few reminders you cannot miss. | 7 | Pass |
| Choose a schedule and a 5–60 minute repeat. | 8 | Pass |
| Snooze or acknowledge each reminder when it appears. | 8 | Pass |
| Reminder data stays in this browser on this device during normal use. | 12 | Pass |
| The app has no account, ads, analytics, calendar, or contacts. | 10 | Pass |
| Android asks for notification access only after you choose it in settings. | 12 | Pass |
| Without exact-alarm access, Android uses an inexact alarm. | 8 | Pass |
| Device power rules can delay alerts. | 6 | Pass |
| Keep another safeguard for urgent or life-safety duties. | 8 | Pass |
| Free use arms three reminders and keeps extra imports paused. | 10 | Pass |
| Pay US$4.99 once for unlimited active reminders. | 8 | Pass |
| There is no subscription. | 4 | Pass |
| Core reminder controls, accessibility, and data export stay free. | 9 | Pass |
| Dodo processes the payment and handles refunds through Sociobot checkout. | 10 | Pass |
| Repeat critical Android reminders until you snooze or acknowledge them. | 10 | Pass |

## Landing headings, labels, and actions

| Copy | Words | Result |
| --- | ---: | --- |
| REPEATING ANDROID REMINDERS | 3 | Pass |
| Try it with sample data | 5 | Pass |
| Add critical reminder | 3 | Pass |
| Download Android app (APK) | 4 | Pass |
| Verify the APK download | 4 | Pass |
| DUE NOW | 2 | Pass |
| Reminder needing acknowledgement | 3 | Pass |
| SAVED REMINDERS | 2 | Pass |
| Your reminders | 2 | Pass |
| LAST 30 DAYS | 3 | Pass |
| 30-day acknowledgement rate | 3 | Pass |
| How it works | 3 | Pass |
| Choose the reminder schedule | 4 | Pass |
| Acknowledge the reminder | 3 | Pass |
| Limits and privacy | 3 | Pass |
| Android notification permission | 3 | Pass |
| Not for emergencies | 3 | Pass |
| Three reminders are free | 4 | Pass |
| Buy once · US$4.99 | 4 | Pass |
| Restore a license | 3 | Pass |
| Open settings | 2 | Pass |
| Reset demo | 2 | Pass |
| Start for real | 3 | Pass |

## README sentences and standalone lines

| Sentence or standalone line | Words | Result |
| --- | ---: | --- |
| Critical Alert Lane | 3 | Pass |
| Keep critical Android reminders repeating until you snooze or acknowledge them. | 11 | Pass |
| It is for Android users who miss medicine, deadline, or call alerts in a busy notification list. | 17 | Pass |
| Live app: <https://critical-alert-lane.sociobot.in> | 4 | Pass |
| Sample demo: <https://critical-alert-lane.sociobot.in/?demo=1> | 6 | Pass |
| Android app: [Critical Alert Lane 1.0.5 APK](./public/downloads/critical-alert-lane-1.0.5.apk) | 8 | Pass |
| <summary>Verify the APK download</summary> | 6 | Pass |
| Compare this SHA-256 value with the downloaded file to check that it arrived unchanged. | 14 | Pass |
| `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8` | 1 | Pass |
| Try the demo | 3 | Pass |
| Open the sample demo in one click. | 7 | Pass |
| It starts with three realistic reminders in a separate browser database. | 11 | Pass |
| **Reset demo** restores the samples. | 5 | Pass |
| **Start for real** discards demo changes and opens your real reminder list. | 12 | Pass |
| Reminder schedules, repeats, and backups | 5 | Pass |
| Supports one-time, daily, weekday, and weekly reminders. | 7 | Pass |
| Repeats every 5–60 minutes until you snooze or acknowledge the alert. | 11 | Pass |
| Offers overnight quiet hours without hiding a due alert. | 9 | Pass |
| Shows a score from acknowledgement history in the latest 30 days. | 11 | Pass |
| Exports and imports a backup file after confirmation. | 8 | Pass |
| Repairs unsafe duplicate or hash-colliding import IDs. | 7 | Pass |
| Keeps extra imports paused above the three-reminder free limit. | 9 | Pass |
| Installs from supported browsers and reloads offline after the first visit. | 11 | Pass |
| Runs native Android alarms after the app closes. | 8 | Pass |
| Re-arms Android alarms after boot, clock changes, and time-zone changes. | 10 | Pass |
| Privacy and permissions | 3 | Pass |
| Reminder data stays in this browser on this device during normal use. | 12 | Pass |
| The app uses no account, ads, analytics, tracking pixels, or third-party fonts. | 12 | Pass |
| It requests no contacts, calendar, location, camera, or microphone access. | 10 | Pass |
| Notification access is requested only after you choose it in Settings. | 11 | Pass |
| Android offers exact-alarm access from Settings when needed. | 8 | Pass |
| Android uses an inexact alarm when you decline exact-alarm access. | 10 | Pass |
| See [Privacy](./privacy/index.html) for export and billing details. | 8 | Pass |
| Price | 1 | Pass |
| Free use supports three active reminders and all safety controls. | 10 | Pass |
| US$4.99 once adds unlimited active reminders through Sociobot checkout. | 10 | Pass |
| There is no subscription. | 4 | Pass |
| Dodo processes the payment and handles refunds through Sociobot checkout. | 10 | Pass |
| You can paste an active license on another device. | 9 | Pass |
| See [Terms](./terms/index.html) for purchase terms. | 6 | Pass |
| Run and test | 3 | Pass |
| Use Node.js 20 or newer. | 5 | Pass |
| `npm run build` writes the static site to `dist/`. | 9 | Pass |
| Playwright 1.58.2 runs desktop and 390 px mobile checks. | 9 | Pass |
| The browser tests build and start their own preview server. | 10 | Pass |
| The native checks inspect the current shell and immutable v1.0.5 APK. | 11 | Pass |
| GitHub Actions installs JDK 21 and Android API 35 for full Gradle checks. | 13 | Pass |
| Run `npm run android:sync` after changing the web app. | 9 | Pass |
| Android release identity | 3 | Pass |
| The Android application ID is `in.sociobot.criticalalertlane`. | 6 | Pass |
| Version 1.0.5 uses build code 6. | 6 | Pass |
| Its signer matches the public v1.0.3 factory signer. | 8 | Pass |
| That identity lets Android install this APK over v1.0.3. | 9 | Pass |
| This repository does not contain Android signing keys or credentials. | 10 | Pass |
| Provide the four `ANDROID_RELEASE_*` variables to create a signed release. | 11 | Pass |
| Then run `cd android && ./gradlew assembleRelease`. | 6 | Pass |
| Storage and billing | 3 | Pass |
| Real reminders use the IndexedDB database `critical-alert-lane`. | 7 | Pass |
| Demo reminders use the separate database `demo:critical-alert-lane`. | 7 | Pass |
| License tokens use `localStorage["sb_license:critical-alert-lane"]`. | 6 | Pass |
| The app stores one daily license result beside the token. | 10 | Pass |
| Only checkout and license checks contact the Sociobot billing API. | 10 | Pass |
| Payment details never enter or stay in this app. | 9 | Pass |
| Exports are unencrypted JSON files. | 5 | Pass |
| Store exports somewhere you trust. | 5 | Pass |
| Project records | 2 | Pass |
| Product scope: [`.factory/brief.json`](./.factory/brief.json) | 4 | Pass |
| Visual system and asset sources: [`.factory/design.md`](./.factory/design.md) | 7 | Pass |
| Demo sandbox: [`.factory/demo.md`](./.factory/demo.md) | 4 | Pass |
| Claims and tests: [`.factory/claims.json`](./.factory/claims.json) | 5 | Pass |
| Verification evidence: [`.factory/handoff.md`](./.factory/handoff.md) | 4 | Pass |
| Deploy | 1 | Pass |
| The factory deploys `dist/` as a static site. | 8 | Pass |
| Do not change DNS, billing, or infrastructure from this repository. | 10 | Pass |
| License | 1 | Pass |
| Released under the [MIT License](./LICENSE). | 6 | Pass |

No audited sentence exceeds 22 words. No banned marketing word appears.

## Terminology

| Concept | Term |
| --- | --- |
| A saved scheduled item | reminder |
| Delay a due reminder | snooze |
| Mark a reminder complete | acknowledge |
| Inactive because of the free cap | paused |
| Paid capacity record | license |
