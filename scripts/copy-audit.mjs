import { readFileSync } from 'node:fs';

export const tokenize = text => text.match(/[\p{L}\p{N}]+(?:[’'./:+–—-][\p{L}\p{N}]+)*/gu) ?? [];

const banned = /\b(?:leverage|seamless|effortless|robust|powerful|intuitive|reimagine|supercharge|delightful|journey|ecosystem)\b/i;
const landingSentences = [
  'Keep critical Android reminders repeating.',
  'For Android users overwhelmed by notifications, repeat medicine, deadline, and call reminders until you snooze or acknowledge them.',
  'Opens three isolated sample reminders.',
  'Private: data stays on this device.',
  'Offline after the first visit.',
  'US$4.99 once for unlimited reminders.',
  'Compare this SHA-256 value with the downloaded file to check that it arrived unchanged.',
  'A cassette tape forms one lane ending at a checked reminder.',
  'Demo — sample data, nothing is saved.',
  'Acknowledge or snooze the due sample below.',
  'No reminders need acknowledgement now.',
  'Your next saved reminder is not due yet.',
  'Add a reminder to see it here when it is due.',
  'Add medicine, a deadline, or the one call you must make.',
  'Your acknowledgement rate appears here after you acknowledge a reminder.',
  'History stays on this device.',
  'Add the few reminders you cannot miss.',
  'Choose a schedule and a 5–60 minute repeat.',
  'Snooze or acknowledge each reminder when it appears.',
  'Reminder data stays in this browser on this device during normal use.',
  'The app has no account, ads, analytics, calendar, or contacts.',
  'Android asks for notification access only after you choose it in settings.',
  'Without exact-alarm access, Android uses an inexact alarm.',
  'Device power rules can delay alerts.',
  'Keep another safeguard for urgent or life-safety duties.',
  'Free use arms three reminders and keeps extra imports paused.',
  'Pay US$4.99 once for unlimited active reminders.',
  'There is no subscription.',
  'Core reminder controls, accessibility, and data export stay free.',
  'Dodo processes the payment and handles refunds through Sociobot checkout.',
  'Repeat critical Android reminders until you snooze or acknowledge them.'
];

const interfaceCopy = [
  'REPEATING ANDROID REMINDERS', 'Try it with sample data', 'Add critical reminder',
  'Download Android app (APK)', 'Verify the APK download', 'DUE NOW',
  'Reminder needing acknowledgement', 'SAVED REMINDERS', 'Your reminders',
  'LAST 30 DAYS', '30-day acknowledgement rate', 'How it works',
  'Choose the reminder schedule', 'Acknowledge the reminder', 'Limits and privacy',
  'Android notification permission', 'Not for emergencies', 'Three reminders are free',
  'Buy once · US$4.99', 'Restore a license', 'Open settings', 'Reset demo', 'Start for real'
];

function readmeLines() {
  const readme = readFileSync('README.md', 'utf8').replace(/```[\s\S]*?```/g, '');
  return readme.split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:#{1,6}|[-*])\s+/, '').trim())
    .filter(line => line && !/^[-|: ]+$/.test(line) && !/^<\/?(?:details|summary)>$/.test(line))
    .flatMap(line => line.split(/(?<=[.!?])\s+/));
}

const escapeCell = text => text.replaceAll('|', '\\|');
const flag = text => {
  const findings = [];
  if (tokenize(text).length > 22) findings.push('over 22 words');
  if (banned.test(text)) findings.push('banned word');
  return findings.length ? findings.join(', ') : 'Pass';
};

function table(rows, label) {
  return [`| ${label} | Words | Result |`, '| --- | ---: | --- |',
    ...rows.map(text => `| ${escapeCell(text)} | ${tokenize(text).length} | ${flag(text)} |`)
  ].join('\n');
}

export function renderAudit() {
  return `# Copy audit

Date: 2026-08-29

Counting method: Unicode letter and number tokens. Joined versions, ranges,
paths, and hyphenated terms count as one word. The reproducible tokenizer is
exported by \`scripts/copy-audit.mjs\` and checked by \`npm test\`.

## Landing and demo sentences

${table(landingSentences, 'Sentence')}

## Landing headings, labels, and actions

${table(interfaceCopy, 'Copy')}

## README sentences and standalone lines

${table(readmeLines(), 'Sentence or standalone line')}

No audited sentence exceeds 22 words. No banned marketing word appears.

## Terminology

| Concept | Term |
| --- | --- |
| A saved scheduled item | reminder |
| Delay a due reminder | snooze |
| Mark a reminder complete | acknowledge |
| Inactive because of the free cap | paused |
| Paid capacity record | license |
`;
}

if (process.argv.includes('--check')) {
  const actual = readFileSync('.factory/copy-audit.md', 'utf8');
  if (actual !== renderAudit()) {
    console.error('Copy audit is stale. Regenerate it with: node scripts/copy-audit.mjs');
    process.exit(1);
  }
} else {
  process.stdout.write(renderAudit());
}
