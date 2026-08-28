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
});
