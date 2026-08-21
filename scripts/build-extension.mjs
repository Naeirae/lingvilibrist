import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'apps/chrome-extension');
const dist = resolve(root, 'dist/chrome-extension');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(source, dist, { recursive: true });

const vendorRoot = resolve(dist, 'vendor/packages');
for (const packageName of ['core', 'rules']) {
  const target = resolve(vendorRoot, packageName, 'src');
  await mkdir(target, { recursive: true });
  await cp(resolve(root, `packages/${packageName}/src`), target, { recursive: true });
}

console.log(`Built unpacked extension at ${dist}`);
