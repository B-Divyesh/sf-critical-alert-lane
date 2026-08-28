import { existsSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve('android/app/src/main/assets/public');
if (!existsSync(root)) {
  throw new Error('Native assets are missing. Run `npm run android:sync` first.');
}

const files = [];
const visit = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else files.push(path);
  }
};
visit(root);

const embeddedPackages = files.filter(path => extname(path).toLowerCase() === '.apk');
if (embeddedPackages.length) {
  throw new Error(`Native assets recursively contain APK files: ${embeddedPackages.map(path => relative(root, path)).join(', ')}`);
}

if (existsSync(join(root, 'downloads'))) {
  throw new Error('Native assets contain the web-only downloads directory.');
}

console.log(`Native bundle check passed: ${files.length} files, no nested APK or downloads directory.`);
