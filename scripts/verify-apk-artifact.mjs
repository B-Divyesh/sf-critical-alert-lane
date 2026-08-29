import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// @claim:apk-source-identity — this executable check compares every released web asset and native fingerprint.

const apkPath = resolve(process.argv[2] ?? 'public/downloads/critical-alert-lane-1.0.4.apk');
const nativeRoot = resolve('android/app/src/main/assets/public');
const releaseRecord = JSON.parse(readFileSync(resolve('.factory/android-release.json'), 'utf8'));

if (!existsSync(apkPath)) throw new Error(`APK is missing: ${apkPath}`);
if (!existsSync(nativeRoot)) throw new Error('Native web assets are missing. Run `npm run android:sync` first.');

const hash = value => createHash('sha256').update(value).digest('hex');
const apkHash = hash(readFileSync(apkPath));
const freshBuild = process.argv.includes('--fresh-build');
if (!freshBuild && apkHash !== releaseRecord.apk.sha256) {
  throw new Error(`APK digest differs from the published release record. Expected ${releaseRecord.apk.sha256}; received ${apkHash}.`);
}
if (!freshBuild && releaseRecord.apk.path !== relative(process.cwd(), apkPath).replaceAll('\\', '/')) {
  throw new Error(`Release record path does not describe this APK: ${releaseRecord.apk.path}.`);
}
for (const [sourcePath, expectedHash] of Object.entries(releaseRecord.nativeSource)) {
  const fullPath = resolve(sourcePath);
  if (!existsSync(fullPath)) throw new Error(`Released native source is missing: ${sourcePath}`);
  const actualHash = hash(readFileSync(fullPath));
  if (actualHash !== expectedHash) throw new Error(`Released native source changed without a new APK: ${sourcePath}.`);
}
const walk = (directory, prefix = '') => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const next = join(directory, entry.name);
  const name = join(prefix, entry.name).replaceAll('\\', '/');
  return entry.isDirectory() ? walk(next, name) : [name];
});
const apkEntries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' })
  .split(/\r?\n/).filter(entry => entry.startsWith('assets/public/') && !entry.endsWith('/'))
  .map(entry => entry.slice('assets/public/'.length)).sort();
const nativeEntries = walk(nativeRoot).sort();

if (JSON.stringify(apkEntries) !== JSON.stringify(nativeEntries)) {
  const onlyApk = apkEntries.filter(entry => !nativeEntries.includes(entry));
  const onlyNative = nativeEntries.filter(entry => !apkEntries.includes(entry));
  throw new Error(`APK web bundle differs from the current native assets. Only in APK: ${onlyApk.join(', ') || 'none'}; only in native bundle: ${onlyNative.join(', ') || 'none'}.`);
}
for (const entry of nativeEntries) {
  const expected = readFileSync(join(nativeRoot, entry));
  const actual = execFileSync('unzip', ['-p', apkPath, `assets/public/${entry}`]);
  if (!actual.equals(expected)) throw new Error(`APK asset differs from the current native bundle: ${entry}`);
}

const demo = execFileSync('unzip', ['-p', apkPath, 'assets/public/demo/index.html'], { encoding: 'utf8' });
if (!demo.includes('/assets/')) throw new Error('APK demo entry point does not load the app bundle.');
const serviceWorker = execFileSync('unzip', ['-p', apkPath, 'assets/public/sw.js'], { encoding: 'utf8' });
if (!/const VERSION = 'cal-v\d+'/.test(serviceWorker)) throw new Error('APK has no versioned service-worker shell.');
const index = execFileSync('unzip', ['-p', apkPath, 'assets/public/index.html'], { encoding: 'utf8' });
const appAssets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.js)"/g)].map(match => match[1].slice(1));
const appSource = appAssets.map(entry => execFileSync('unzip', ['-p', apkPath, `assets/public/${entry}`], { encoding: 'utf8' })).join('\n');
for (const marker of ['Try it with sample data', 'Repeat until acknowledged', 'Take evening medicine']) {
  if (!appSource.includes(marker)) throw new Error(`APK reminder bundle is missing release marker: ${marker}`);
}

// A normal clean verifier deliberately needs neither a JDK nor Android SDK.
// It verifies the immutable release APK, its freshly synced web bundle, the
// released native-source fingerprints, and the symbols compiled in its DEX.
// Full Gradle/Robolectric/lint/APK assembly runs in the Android CI workflow.
const dexEntries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' })
  .split(/\r?\n/).filter(entry => /^classes\d*\.dex$/.test(entry));
const dexBytes = Buffer.concat(dexEntries.map(entry => execFileSync('unzip', ['-p', apkPath, entry], { maxBuffer: 16 * 1024 * 1024 })));
const requireDex = value => {
  if (!dexBytes.includes(Buffer.from(value))) throw new Error(`Published APK is missing native release evidence: ${value}`);
};
['ReminderAlarmReceiver', 'ReminderRescheduleReceiver', 'ReminderScheduler', 'handleAlarm', 'nextTriggerAfterAlarm', 'reschedule'].forEach(requireDex);

const source = path => readFileSync(resolve(path), 'utf8');
const requireSource = (path, value) => {
  if (!source(path).includes(value)) throw new Error(`Native source evidence is missing ${value} in ${path}.`);
};
const scheduler = 'android/app/src/main/java/in/sociobot/criticalalertlane/ReminderScheduler.java';
const alarmReceiver = 'android/app/src/main/java/in/sociobot/criticalalertlane/ReminderAlarmReceiver.java';
const rescheduleReceiver = 'android/app/src/main/java/in/sociobot/criticalalertlane/ReminderRescheduleReceiver.java';
const manifest = 'android/app/src/main/AndroidManifest.xml';

if (process.argv.includes('--claim') && process.argv.includes('native-background-repeat')) {
  // @claim:native-background-repeat — verify the persisted-state alarm path in source and compiled DEX.
  [
    [alarmReceiver, 'ReminderScheduler.handleAlarm'],
    [scheduler, 'showNotification(context, reminder)'],
    [scheduler, 'ReminderSchedulePolicy.nextTriggerAfterAlarm']
  ].forEach(([path, value]) => requireSource(path, value));
}
if (process.argv.includes('--claim') && process.argv.includes('lifecycle-recovery')) {
  // @claim:lifecycle-recovery — verify every declared lifecycle action and the native rescheduler path.
  [
    [rescheduleReceiver, 'ReminderScheduler.reschedule(context)'],
    [manifest, 'android.intent.action.BOOT_COMPLETED'],
    [manifest, 'android.intent.action.TIME_SET'],
    [manifest, 'android.intent.action.TIMEZONE_CHANGED']
  ].forEach(([path, value]) => requireSource(path, value));
}
if (process.argv.includes('--instrumentation-source')) {
  requireSource('android/app/src/androidTest/java/in/sociobot/criticalalertlane/ReminderSchedulerInstrumentedTest.java', 'schedulesAndReconcilesAcrossLifecycleBroadcasts');
}

console.log(freshBuild
  ? `Fresh APK/source identity passed: ${basename(apkPath)}; ${nativeEntries.length} embedded assets match ${relative(process.cwd(), nativeRoot)}; required native symbols match; SHA-256 ${apkHash}.`
  : `Published APK/source identity passed: ${basename(apkPath)}; immutable digest pins ${apkEntries.length} current web assets; ${Object.keys(releaseRecord.nativeSource).length} native source fingerprints and required DEX symbols match; SHA-256 ${apkHash}.`);
