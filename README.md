# Critical Alert Lane

Critical Alert Lane is a tiny, local-first reminder lane for Android and the
web. It is for people who have muted the notification flood but still need a
few reminders—medicine, a deadline, a call—to keep repeating until they
explicitly acknowledge or snooze them.

Live app: <https://critical-alert-lane.sociobot.in>

## What v1 includes

- One-time, daily, weekday, and weekly reminders
- Configurable 5–60 minute repeat cadence until acknowledgement
- Explicit acknowledge and snooze actions, with Undo after acknowledgement
- Overnight quiet hours that mute notifications without hiding due alerts
- A rolling 30-day “handled in time” reliability score
- IndexedDB persistence, installable PWA, and tested offline reloads
- Local JSON export/import with validation and replacement confirmation
- Free use for up to three active reminders; US$4.99 one-time license unlock
  for unlimited active reminders through the Sociobot hosted checkout
- A Capacitor Android project with product-specific launcher and splash assets

The app requests no account, calendar, contacts, location, camera, or
microphone access. Notification permission is requested only from the Settings
button. The static/PWA build checks and repeats notifications while the app is
running; reliable Android background/exact-alarm scheduling is intentionally
left for the later native-APK work order and is not claimed by this build.

## Develop and verify

Requires Node.js 20+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm run build` is the factory build command. It writes the deployable static
site to `dist/`, with `dist/index.html` at its root. Playwright is pinned to
1.58.2 as required by the worker image.

To refresh the Android shell after a web change:

```sh
npm run build
npx cap sync android
```

The committed project uses application ID `in.sociobot.criticalalertlane`.
Signing and APK production belong to the later Android work order; no keystore
or secret is stored here.

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
