// Vice Cover Maker — entry hand-in program.
// Copies app/ and screenshots/ from the repository root into the output
// directory and writes dossier.json there with buildDossier. Node 22,
// standard library only. Deterministic: no timestamps, no randomness,
// so two runs write identical bytes.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(import.meta.dirname);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

/** Fail early with a clear message when a required input directory is absent. */
function requireInputDir(name) {
  const dir = join(repoRoot, name);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`Vice Cover Maker: missing required directory ${name}/ beside main.ts`);
  }
  return dir;
}

mkdirSync(outputDir, { recursive: true });

for (const name of ['app', 'screenshots']) {
  cpSync(requireInputDir(name), join(outputDir, name), {
    recursive: true,
    dereference: false,
  });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
