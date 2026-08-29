# Critical Alert Lane

Keep critical Android reminders repeating until you snooze or acknowledge them.

It is for Android users who miss medicine, deadline, or call alerts in a busy notification list.

- Live app: <https://critical-alert-lane.sociobot.in>
- Sample demo: <https://critical-alert-lane.sociobot.in/?demo=1>
- Android app: [Critical Alert Lane 1.0.6 APK](./public/downloads/critical-alert-lane-1.0.6.apk)

<details>
<summary>Verify the APK download</summary>

Compare this SHA-256 value with the downloaded file to check that it arrived unchanged.

`e902da576a34ede089010c2fbce721d811ea587106abe024eebcd33c47a5289e`

</details>

## Try the demo

Open the sample demo in one click.

It starts with three realistic reminders in a separate browser database.

**Reset demo** restores the samples.

**Start for real** discards demo changes and opens your real reminder list.

## Reminder schedules, repeats, and backups

- Supports one-time, daily, weekday, and weekly reminders.
- Repeats every 5–60 minutes until you snooze or acknowledge the alert.
- Offers overnight quiet hours without hiding a due alert.
- Shows a score from acknowledgement history in the latest 30 days.
- Exports and imports a backup file after confirmation.
- Repairs unsafe duplicate or hash-colliding import IDs.
- Keeps extra imports paused above the three-reminder free limit.
- Installs from supported browsers and reloads offline after the first visit.
- Runs native Android alarms after the app closes.
- Re-arms Android alarms after boot, clock changes, and time-zone changes.

## Privacy and permissions

Reminder data stays in this browser on this device during normal use.

The app uses no account, ads, analytics, tracking pixels, or third-party fonts.

It requests no contacts, calendar, location, camera, or microphone access.

Notification access is requested only after you choose it in Settings.

Android offers exact-alarm access from Settings when needed.

Android uses an inexact alarm when you decline exact-alarm access.

See [Privacy](./privacy/index.html) for export and billing details.

## Price

Free use supports three active reminders and all safety controls.

US$4.99 once adds unlimited active reminders through Sociobot checkout.

There is no subscription.

Dodo processes the payment and handles refunds through Sociobot checkout.

You can paste an active license on another device.

See [Terms](./terms/index.html) for purchase terms.

## Run and test

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run test:copy
npm run build
npm run test:e2e
npm run test:update
npm run test:android:artifact
npm run test:android:instrumentation
```

`npm run build` writes the static site to `dist/`.

Playwright 1.58.2 runs desktop and 390 px mobile checks.

The browser tests build and start their own preview server.

The native checks inspect the current shell and immutable v1.0.6 APK.

GitHub Actions installs JDK 21 and Android API 35 for full Gradle checks.

Run `npm run android:sync` after changing the web app.

## Android release identity

The Android application ID is `in.sociobot.criticalalertlane`.

Version 1.0.6 uses build code 7.

Its signer matches the public v1.0.3 factory signer.

That identity lets Android install this APK over v1.0.3.

This repository does not contain Android signing keys or credentials.

Provide the four `ANDROID_RELEASE_*` variables to create a signed release.

Then run `cd android && ./gradlew assembleRelease`.

## Storage and billing

Real reminders use the IndexedDB database `critical-alert-lane`.

Demo reminders use the separate database `demo:critical-alert-lane`.

License tokens use `localStorage["sb_license:critical-alert-lane"]`.

The app stores one daily license result beside the token.

Only checkout and license checks contact the Sociobot billing API.

Payment details never enter or stay in this app.

Exports are unencrypted JSON files.

Store exports somewhere you trust.

## Project records

- Product scope: [`.factory/brief.json`](./.factory/brief.json)
- Visual system and asset sources: [`.factory/design.md`](./.factory/design.md)
- Demo sandbox: [`.factory/demo.md`](./.factory/demo.md)
- Claims and tests: [`.factory/claims.json`](./.factory/claims.json)
- Verification evidence: [`.factory/handoff.md`](./.factory/handoff.md)

## Deploy

The factory deploys `dist/` as a static site.

Do not change DNS, billing, or infrastructure from this repository.

## License

Released under the [MIT License](./LICENSE).
