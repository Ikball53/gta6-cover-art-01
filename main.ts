// Vice Cover Maker entry program: copies app/ and screenshots/ to the output
// directory and writes dossier.json via buildDossier. Deterministic output:
// the same inputs always produce the same bytes.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(import.meta.dirname ?? '.');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

function copyEntryTree(name: string): void {
  const source = join(repoRoot, name);
  const target = join(outputDir, name);
  if (source === target) {
    throw new Error(`refusing to copy ${name} onto itself`);
  }
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });

copyEntryTree('app');
copyEntryTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
