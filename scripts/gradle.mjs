import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const suppliedHome = process.env.JAVA_HOME;
let javaHome = suppliedHome && existsSync(resolve(suppliedHome, 'bin/java')) ? suppliedHome : undefined;

if (!javaHome) {
  try {
    const javaPath = realpathSync(execFileSync('command', ['-v', 'java'], { shell: '/bin/bash', encoding: 'utf8' }).trim());
    javaHome = dirname(dirname(javaPath));
  } catch {
    console.error('A JDK is required for Android checks. Install JDK 17+ or set JAVA_HOME.');
    process.exit(1);
  }
}

const configuredSdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
const androidHome = configuredSdk && existsSync(resolve(configuredSdk, 'platforms'))
  ? configuredSdk
  : existsSync('/opt/android-sdk/platforms') ? '/opt/android-sdk' : undefined;
if (!androidHome) {
  console.error('Android SDK platform files are required. Set ANDROID_HOME or ANDROID_SDK_ROOT.');
  process.exit(1);
}

const result = spawnSync('./gradlew', process.argv.slice(2), {
  cwd: 'android',
  stdio: 'inherit',
  env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: androidHome, ANDROID_SDK_ROOT: androidHome }
});
process.exit(result.status ?? 1);
