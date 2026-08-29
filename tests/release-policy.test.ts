import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDemoData } from '../src/demo';

describe('release policy regressions', () => {
  it('ships a static-host 404 response override and a designed fallback page', () => {
    const config = JSON.parse(readFileSync(resolve('public/staticwebapp.config.json'), 'utf8')) as {
      navigationFallback?: unknown;
      responseOverrides?: { 404?: { rewrite?: string } };
    };
    const page = readFileSync(resolve('404.html'), 'utf8');

    expect(config.responseOverrides?.[404]?.rewrite).toBe('/404.html');
    expect(config.navigationFallback).toBeUndefined();
    expect(page).toContain('<h1>This page is not in your lane.</h1>');
    expect(page).toContain('href="/"');
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
      ['terms/index.html', 'https://critical-alert-lane.sociobot.in/terms/']
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

  it('keeps standalone update and native claim checks runnable in an SDK-less clean clone', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const updateCheck = readFileSync(resolve('scripts/verify-update.mjs'), 'utf8');
    const artifactCheck = readFileSync(resolve('scripts/verify-apk-artifact.mjs'), 'utf8');
    const workflow = readFileSync(resolve('.github/workflows/android.yml'), 'utf8');

    expect(packageJson.scripts['test:update']).toContain('npm run build');
    expect(updateCheck).toContain("port: 0");
    expect(updateCheck).toContain('await server.close()');
    expect(packageJson.scripts['test:android:claim']).not.toContain('gradle');
    expect(packageJson.scripts['test:android:lifecycle-claim']).not.toContain('gradle');
    expect(packageJson.scripts['test:android:artifact']).not.toContain('gradle');
    expect(artifactCheck).toContain('released native-source fingerprints');
    expect(workflow).toContain('npm run test:android:full');
    expect(workflow).toContain('platforms;android-35');
  });
});
