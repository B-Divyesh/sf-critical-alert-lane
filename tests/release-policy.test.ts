import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { createDemoData } from '../src/demo';

describe('release policy regressions', () => {
  it('registers every release promise and gives each claim exactly one source tag', () => {
    const claims = JSON.parse(readFileSync(resolve('.factory/claims.json'), 'utf8')) as Array<{
      id: string; claim: string; where: string; test: string; sandbox: string;
    }>;
    const expectedIds = [
      'offline-reload', 'safe-import', 'free-limit', 'local-private', 'repeat-until-handled',
      'demo-isolation', 'demo-ready', 'data-portability', 'rolling-score', 'schedule-and-undo', 'quiet-hours',
      'repeat-range', 'pwa-installable', 'android-permission-boundary', 'timing-limits', 'core-free',
      'native-background-repeat', 'lifecycle-recovery', 'apk-download', 'apk-source-identity',
      'apk-update-signing', 'repo-no-signing-secrets', 'one-time-license', 'billing-data-boundary',
      'billing-processor-refunds', 'license-recovery'
    ];
    expect(claims.map(item => item.id)).toEqual(expectedIds);
    const sources = [
      'tests/e2e/app.spec.ts', 'tests/release-policy.test.ts', 'scripts/verify-apk-artifact.mjs',
      'scripts/verify-android-update-signing.mjs'
    ].map(file => readFileSync(resolve(file), 'utf8')).join('\n');
    for (const claim of claims) {
      expect(claim.claim.trim()).not.toBe('');
      expect(claim.where.trim()).not.toBe('');
      expect(claim.sandbox.trim()).not.toBe('');
      const tag = ['@claim', claim.id].join(':');
      expect(claim.test).toMatch(/^npm run /);
      expect(sources.split(tag).length - 1, `${claim.id} must have exactly one source tag`).toBe(1);
    }
  });

  it('keeps every README sentence within the 22-word plain-words limit', () => {
    const readme = readFileSync(resolve('README.md'), 'utf8').replace(/```[\s\S]*?```/g, '');
    const sentences = readme.split(/\r?\n/)
      .map(line => line.replace(/^\s*(?:#{1,6}|[-*])\s+/, '').trim())
      .filter(line => line && !/^[-|: ]+$/.test(line))
      .flatMap(line => line.split(/(?<=[.!?])\s+/));
    const overLimit = sentences.map(sentence => ({
      sentence,
      words: sentence.match(/[\p{L}\p{N}]+(?:[’'./:+-][\p{L}\p{N}]+)*/gu)?.length ?? 0
    })).filter(item => item.words > 22);
    expect(overLimit).toEqual([]);
    expect(readme).not.toMatch(/\b(?:leverage|seamless|effortless|robust|powerful|intuitive|reimagine|supercharge|delightful|journey|ecosystem)\b/i);
  });

  it('reproduces copy-audit counts with the shared Unicode tokenizer', () => {
    const generator = readFileSync(resolve('scripts/copy-audit.mjs'), 'utf8');
    expect(generator).toContain("/[\\p{L}\\p{N}]+(?:[’'./:+–—-][\\p{L}\\p{N}]+)*/gu");
    expect(() => execFileSync(process.execPath, ['scripts/copy-audit.mjs', '--check'], { encoding: 'utf8' })).not.toThrow();
  });

  it('ships a static-host 404 response override and a designed fallback page', () => {
    const config = JSON.parse(readFileSync(resolve('public/staticwebapp.config.json'), 'utf8')) as {
      navigationFallback?: unknown;
      responseOverrides?: { 404?: { rewrite?: string } };
    };
    const page = readFileSync(resolve('404.html'), 'utf8');

    expect(config.responseOverrides?.[404]?.rewrite).toBe('/404.html');
    expect(config.navigationFallback).toBeUndefined();
    expect(page).toContain('<h1>Page not found</h1>');
    expect(page).toContain('href="/"');
    expect(page).toContain('<link rel="canonical" href="https://critical-alert-lane.sociobot.in/404.html"');
    expect(page).toContain('<meta property="og:title" content="Page not found — Critical Alert Lane"');
    expect(page).toContain('<meta property="og:image" content="https://critical-alert-lane.sociobot.in/art/social-preview.png"');
    expect(page).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(page).toContain('<link rel="apple-touch-icon" href="/icons/icon-180.png"');
  });

  it('provides an immediately due, realistic reminder in every fresh demo', () => {
    const demo = createDemoData();
    const due = demo.reminders.find(reminder => reminder.id === 'demo-evening-medicine');

    expect(demo.reminders).toHaveLength(3);
    expect(due).toMatchObject({
      title: 'Take evening medicine', recurrence: 'daily', repeatMinutes: 5, enabled: true
    });
    expect(new Date(due!.nextAt).getTime()).toBeLessThan(Date.now());
  });

  it('publishes canonical, social-card, and Apple icon metadata with correctly sized images', () => {
    const routes = [
      ['index.html', 'https://critical-alert-lane.sociobot.in/'],
      ['demo/index.html', 'https://critical-alert-lane.sociobot.in/demo/'],
      ['privacy/index.html', 'https://critical-alert-lane.sociobot.in/privacy/'],
      ['terms/index.html', 'https://critical-alert-lane.sociobot.in/terms/'],
      ['offline.html', 'https://critical-alert-lane.sociobot.in/offline.html'],
      ['404.html', 'https://critical-alert-lane.sociobot.in/404.html']
    ];
    for (const [file, canonical] of routes) {
      const page = readFileSync(resolve(file), 'utf8');
      expect(page).toContain(`<link rel="canonical" href="${canonical}"`);
      expect(page).toContain('<meta property="og:image" content="https://critical-alert-lane.sociobot.in/art/social-preview.png"');
      expect(page).toContain('<meta name="twitter:card" content="summary_large_image"');
      expect(page).toContain('<link rel="apple-touch-icon" href="/icons/icon-180.png"');
    }
    const social = readFileSync(resolve('public/art/social-preview.png'));
    const appleIcon = readFileSync(resolve('public/icons/icon-180.png'));
    expect([social.readUInt32BE(16), social.readUInt32BE(20)]).toEqual([1200, 630]);
    expect([appleIcon.readUInt32BE(16), appleIcon.readUInt32BE(20)]).toEqual([180, 180]);
  });

  it('@claim:repo-no-signing-secrets keeps Android signing secrets out of tracked files', () => {
    const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    expect(tracked.filter(file => /(?:^|\/)(?:[^/]+\.)?(?:jks|keystore|p12|pfx|pem|key)$/i.test(file))).toEqual([]);
    const textFiles = tracked.filter(file => /\.(?:md|json|ts|js|mjs|html|css|xml|gradle|properties|yml|yaml|txt)$/i.test(file));
    const source = textFiles.map(file => readFileSync(resolve(file), 'utf8')).join('\n');
    expect(source).not.toMatch(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/);
    expect(source).not.toMatch(/(?:storePassword|keyPassword)\s+["'][^"']+["']/);
    expect(source).not.toMatch(/ANDROID_RELEASE_(?:STORE_PASSWORD|KEY_PASSWORD)\s*=\s*[^\s$]+/);
  });

  it('keeps standalone update and native claim checks runnable in an SDK-less clean clone', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const updateCheck = readFileSync(resolve('scripts/verify-update.mjs'), 'utf8');
    const artifactCheck = readFileSync(resolve('scripts/verify-apk-artifact.mjs'), 'utf8');
    const signingCheck = readFileSync(resolve('scripts/verify-android-update-signing.mjs'), 'utf8');
    const workflow = readFileSync(resolve('.github/workflows/android.yml'), 'utf8');

    expect(packageJson.scripts['test:update']).toContain('npm run build');
    expect(updateCheck).toContain("port: 0");
    expect(updateCheck).toContain('await server.close()');
    expect(packageJson.scripts['test:android:claim']).not.toContain('gradle');
    expect(packageJson.scripts['test:android:lifecycle-claim']).not.toContain('gradle');
    expect(packageJson.scripts['test:android:artifact']).not.toContain('gradle');
    expect(artifactCheck).toContain('released native-source fingerprints');
    expect(packageJson.scripts['test:android:artifact']).toContain('test:android:update-signing');
    expect(signingCheck).toContain('record.signing.subject');
    expect(signingCheck).toContain('versionCode');
    expect(readFileSync(resolve('android/app/build.gradle'), 'utf8')).not.toContain('signingConfigs.debug');
    expect(workflow).toContain('npm run test:android:full');
    expect(workflow).toContain('platforms;android-35');
  });
});
