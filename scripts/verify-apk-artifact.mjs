import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const apkPath = resolve(process.argv[2] ?? 'public/downloads/critical-alert-lane-1.0.4.apk');
const nativeRoot = resolve('android/app/src/main/assets/public');

if (!existsSync(apkPath)) throw new Error(`APK is missing: ${apkPath}`);
if (!existsSync(nativeRoot)) throw new Error('Native web assets are missing. Run `npm run android:sync` first.');

const hash = value => createHash('sha256').update(value).digest('hex');
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
  throw new Error(`APK web bundle differs from native assets. Only in APK: ${onlyApk.join(', ') || 'none'}; only in native bundle: ${onlyNative.join(', ') || 'none'}.`);
}

for (const entry of nativeEntries) {
  const expected = readFileSync(join(nativeRoot, entry));
  const actual = execFileSync('unzip', ['-p', apkPath, `assets/public/${entry}`]);
  if (!actual.equals(expected)) throw new Error(`APK asset differs from native bundle: ${entry}`);
}

const demo = execFileSync('unzip', ['-p', apkPath, 'assets/public/demo/index.html'], { encoding: 'utf8' });
if (!demo.includes('/assets/')) throw new Error('APK demo entry point does not load the app bundle.');
const serviceWorker = execFileSync('unzip', ['-p', apkPath, 'assets/public/sw.js'], { encoding: 'utf8' });
if (!/const VERSION = 'cal-v\d+'/.test(serviceWorker)) throw new Error('APK has no versioned service-worker shell.');
const index = execFileSync('unzip', ['-p', apkPath, 'assets/public/index.html'], { encoding: 'utf8' });
const appAssets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.js)"/g)].map(match => match[1].slice(1));
const appSource = appAssets.map(entry => execFileSync('unzip', ['-p', apkPath, `assets/public/${entry}`], { encoding: 'utf8' })).join('\n');
if (!appSource.includes('Try it with sample data')) throw new Error('APK landing screen is missing the sample-data action.');

console.log(`APK artifact identity passed: ${basename(apkPath)}; ${nativeEntries.length} embedded assets match ${relative(process.cwd(), nativeRoot)}; SHA-256 ${hash(readFileSync(apkPath))}.`);
