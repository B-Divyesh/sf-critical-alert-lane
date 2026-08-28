# Verification handoff — Critical Alert Lane

Date: 2026-08-28

Work order: `critical-alert-lane-verify-3`

Tested candidate: `e57594aedce04fa7c2e214ce942c719960ea8cce`

Tested deployment: <https://critical-alert-lane.sociobot.in>

## Result: FAIL

This is a fresh product verdict, not the obsolete deployment-only failure. The
production site now publishes the signed APK, the checkout is enabled, and all
24 publicly deployable files from the candidate build match production.
Nevertheless, the Android artifact does not pass its available lint gate and
contains supported-version failures in the core alarm path.

Release-blocking evidence:

- `./gradlew lintDebug` fails with 4 errors and 22 warnings.
- The min-SDK-23 scheduler unconditionally evaluates API 31
  `AlarmManager.canScheduleExactAlarms()` before its version helper; the shipped
  APK bytecode confirms the same order. Background reminder sync can therefore
  fail on Android 6–11.
- Android 6 also reaches a date parser pattern requiring API 24.
- Lint additionally reports unresolved notification permission handling and
  the exact-alarm permission declaration.

Other verified defects:

- Clearing a quiet-hour time and saving causes the uncaught page error `The
  quiet-hour settings in this file are invalid.` with no inline/live feedback.
- Closing the Add/Edit reminder dialog returns focus to `BODY`, not the opener.
- The 7,015,504-byte release APK recursively embeds a separate 3,706,106-byte
  signed APK; its native page links to and prints the digest of that nested
  artifact.

Full evidence and severity are in [verification-3.md](./verification-3.md).

## Passing evidence

```sh
npm ci                       # 148 packages; 0 vulnerabilities
npm test                     # 10/10
npm run typecheck            # pass
npm run lint                 # pass (TypeScript no-emit)
npm run build                # pass; dist/
npm run test:e2e             # 20/20 desktop/mobile
npm run android:sync         # pass
cd android
ANDROID_HOME=/tmp/critical-alert-android-sdk ./gradlew test assembleDebug --no-daemon
                              # pass; debug APK assembled
ANDROID_HOME=/tmp/critical-alert-android-sdk ./gradlew lintDebug --no-daemon
                              # FAIL: 4 errors, 22 warnings
```

Independent live exercise passed reminder creation, HTML-safe rendering,
5-minute repeat and 24-hour escalation boundaries, 180-minute snooze,
acknowledge/Undo, three-item free limit, valid export/import, corrupt-import
rejection, overnight quiet hours with valid input, persistence, 390 px layout,
keyboard operation, reduced motion, offline reload, service-worker update,
invalid-license recovery, privacy/network inspection, and response-policy
checks. Axe found no serious/critical findings in initial, dialog, or populated
states at desktop and mobile. Normal paths had no console/page errors.

Production Lighthouse 13.4.1: mobile 96/100/100/100 (performance/a11y/best
practices/SEO), LCP 1.30 s, CLS 0; desktop 100/100/100/100, LCP 0.33 s, CLS 0.
Initial JS is 34,407 B, CSS 12,471 B, hero AVIF 44,626 B, with no webfont
payload.

The production APK SHA-256 is
`da3a5cba3714a2be537e09ab186aadc35cc45bf3aab3586c641130916db62cbc`;
it verifies under v1/v2 signatures and has the expected package/version/SDK and
restricted permission set. A device lifecycle run could not complete because
the worker has no KVM and the Android 15 image could not retain its required
userdata partition. Re-verification needs API 23/30 plus current-API device
coverage after the native compatibility repairs.
