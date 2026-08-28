# Critical Alert Lane

Critical Alert Lane is a tiny, local-first reminder lane for Android and the
web. It is for people who have muted the notification flood but still need a
few reminders—medicine, a deadline, a call—to keep repeating until they
explicitly acknowledge or snooze them.

Live app: <https://critical-alert-lane.sociobot.in>

Android download: [Critical Alert Lane 1.0.3 APK](./public/downloads/critical-alert-lane-1.0.3.apk)
(`SHA-256 06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`).
Install this signed APK to use Android's on-device alarms when the app is
backgrounded or closed; the web/PWA lane remains available for its local-first
browser workflow.

## What v1 includes

- One-time, daily, weekday, and weekly reminders
- Configurable 5–60 minute repeat cadence until acknowledgement
- Explicit acknowledge and snooze actions, with Undo after acknowledgement
- Overnight quiet hours that mute notifications without hiding due alerts
- A rolling 30-day “handled in time” reliability score
- IndexedDB persistence, installable PWA, and tested offline reloads
- Local JSON export/import with validation and replacement confirmation.
  Unsafe duplicate or Android-hash-colliding IDs are repaired deterministically.
  Free imports keep every reminder and pause active entries beyond the first three.
- Free use for up to three active reminders; US$4.99 one-time license unlock
  for unlimited active reminders through the Sociobot hosted checkout
- Native Android alarms and local notifications that continue repeating after
  the app is backgrounded or closed, then recover after boot, clock, and time
  zone changes

The app requests no account, calendar, contacts, location, camera, or
microphone access. Notification permission is requested only from the Settings
button. On Android, the app also presents exact-alarm access from Settings when
the OS requires it; without that access, Android's battery-aware inexact alarm
fallback is used.

## Develop and verify

Requires Node.js 20+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
npm run test:android
npm run test:android:instrumentation
```

`npm run build` is the factory build command. It writes the deployable static
site to `dist/`, with `dist/index.html` at its root. Playwright is pinned to
1.58.2 as required by the worker image.

To refresh the Android shell after a web change:

```sh
npm run android:sync
```

`npm run test:android:instrumentation` runs the repository-root Gradle
aggregation and preserves the app's checked-in device test APK. Run the APK on
physical API 23 and current-API devices before store distribution.

The committed project uses application ID `in.sociobot.criticalalertlane`.
The downloadable v1.0.3 release APK is signed with the factory signing key;
the keystore and all signing credentials remain outside this repository. To
produce a release APK, provide `ANDROID_RELEASE_STORE_FILE`,
`ANDROID_RELEASE_STORE_PASSWORD`, `ANDROID_RELEASE_KEY_ALIAS`, and
`ANDROID_RELEASE_KEY_PASSWORD`, then run `cd android && ./gradlew assembleRelease`.

## Storage and billing

Reminder data is stored in the browser's IndexedDB database
`critical-alert-lane`. License tokens use
`localStorage["sb_license:critical-alert-lane"]`. The only external runtime
request is a purchase/license check against the Sociobot billing API after a
user buys or restores a license. The free experience never waits on that call.

The export format is versioned JSON. Exports are unencrypted, so users should
store them somewhere they trust. See [Privacy](./privacy/index.html) and
[Terms](./terms/index.html).

## Project notes

- Product scope: [`.factory/brief.json`](./.factory/brief.json)
- Visual system and asset provenance: [`.factory/design.md`](./.factory/design.md)
- Build verification and known gaps: [`.factory/handoff.md`](./.factory/handoff.md)

Licensed under the [MIT License](./LICENSE).
