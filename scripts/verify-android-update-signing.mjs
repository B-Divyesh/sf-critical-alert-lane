import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const record = JSON.parse(readFileSync(resolve('.factory/android-release.json'), 'utf8'));
const previous = record.signing?.upgradeFrom;
if (!previous) throw new Error('Release record has no Android upgrade-signing baseline.');

const currentPath = resolve(record.apk.path);
const previousPath = resolve(previous.path);
for (const path of [previousPath, currentPath]) {
  if (!existsSync(path)) throw new Error(`APK is missing: ${relative(root, path)}`);
}

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
if (sha256(previousPath) !== previous.sha256) {
  throw new Error(`Installed-version baseline digest changed: ${relative(root, previousPath)}`);
}
if (sha256(currentPath) !== record.apk.sha256) {
  throw new Error(`Published APK digest differs from the release record: ${relative(root, currentPath)}`);
}

const certificate = path => {
  const signatureEntry = execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' })
    .split(/\r?\n/).find(entry => /^META-INF\/[^/]+\.(RSA|DSA|EC)$/.test(entry));
  if (!signatureEntry) throw new Error(`APK has no JAR certificate: ${relative(root, path)}`);
  const pem = execFileSync('openssl', ['pkcs7', '-inform', 'DER', '-print_certs', '-outform', 'PEM'], {
    input: execFileSync('unzip', ['-p', path, signatureEntry])
  });
  const details = execFileSync('openssl', ['x509', '-noout', '-subject', '-fingerprint', '-sha256'], { input: pem, encoding: 'utf8' });
  const subject = details.match(/^subject=(.+)$/m)?.[1]?.trim();
  const fingerprint = details.match(/sha256 Fingerprint=([0-9A-F:]+)/i)?.[1];
  if (!subject || !fingerprint) throw new Error(`Could not read signer certificate: ${relative(root, path)}`);
  return { subject, fingerprint };
};

const baselineCertificate = certificate(previousPath);
const releaseCertificate = certificate(currentPath);
const expectedFingerprint = record.signing.sha256;
if (baselineCertificate.fingerprint !== expectedFingerprint || releaseCertificate.fingerprint !== expectedFingerprint) {
  throw new Error(`Android update signer mismatch. Installed ${baselineCertificate.fingerprint}; release ${releaseCertificate.fingerprint}; expected ${expectedFingerprint}.`);
}
if (baselineCertificate.subject !== record.signing.subject || releaseCertificate.subject !== record.signing.subject) {
  throw new Error(`Android update signer subject mismatch. Installed ${baselineCertificate.subject}; release ${releaseCertificate.subject}.`);
}

const gradle = readFileSync(resolve('android/app/build.gradle'), 'utf8');
const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
if (!gradle.includes(`applicationId "${record.apk.applicationId}"`)) throw new Error('Release Gradle application ID differs from the release record.');
if (versionCode !== record.apk.versionCode || versionName !== record.apk.versionName) throw new Error('Release Gradle version differs from the release record.');
if (!Number.isInteger(versionCode) || versionCode <= previous.versionCode) throw new Error('Release version code does not advance the installed v1.0.3 baseline.');
for (const path of [previousPath, currentPath]) {
  const resources = execFileSync('unzip', ['-p', path, 'resources.arsc']);
  if (!resources.includes(Buffer.from(record.apk.applicationId))) throw new Error(`APK resources lack ${record.apk.applicationId}: ${relative(root, path)}`);
}

console.log(`Android upgrade signing passed: installed ${previous.versionName}/code ${previous.versionCode} -> ${record.apk.versionName}/code ${record.apk.versionCode}; ${record.signing.subject}; SHA-256 ${expectedFingerprint}.`);
