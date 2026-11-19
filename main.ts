// Vice Cover Maker — entrypoint for the make.fun grader.
//
// What it does: copies the static app (app/) and the preview images
// (screenshots/) that sit next to this file into the output folder, then
// builds dossier.json in that folder with the shared make.fun library so
// the scorer can grade exactly what was handed in.
//
// Where output goes: the MAKEFUN_OUTPUT_DIR environment variable when it
// is set, otherwise /output (the grader's folder).
//
// Trying it locally: run `node serve.ts` and open http://localhost:8080
// to use the cover maker in a browser. To run this entrypoint outside
// the grader, point MAKEFUN_OUTPUT_DIR at a scratch folder first, e.g.
//   MAKEFUN_OUTPUT_DIR=/tmp/cover-out node main.ts
// It uses only the Node 22 standard library, needs no install step, and
// exits 0 once the copy and the dossier are written.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

mkdirSync(outRoot, { recursive: true });

for (const folder of ['app', 'screenshots']) {
  cpSync(join(here, folder), join(outRoot, folder), { recursive: true });
}

const dossier = buildDossier(outRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outRoot, 'dossier.json'), dossier);

console.log(`Vice Cover Maker: wrote app/, screenshots/ and dossier.json to ${outRoot}`);
