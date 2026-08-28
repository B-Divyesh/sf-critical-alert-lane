import { describe, expect, it } from 'vitest';
import { validateData } from '../src/db';

describe('import validation', () => {
  it('rejects unrelated JSON', () => {
    expect(() => validateData({ hello: 'world' })).toThrow(/does not contain|not supported/);
  });

  it('accepts a version 1 export', () => {
    const value = { version: 1 as const, reminders: [], history: [], settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' }, updatedAt: new Date().toISOString() };
    expect(validateData(value)).toEqual(value);
  });
});
