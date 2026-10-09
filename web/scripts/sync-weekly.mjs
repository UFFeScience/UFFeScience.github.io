import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Independent imports: one source failing must not prevent the other from updating.
const jobs = [
  [process.execPath, ['scripts/sync-github.mjs']],
  [process.env.PEOPLE_PYTHON || 'python3', ['scripts/sync-people.py']],
  [process.env.PEOPLE_PYTHON || 'python3', ['scripts/sync-papers.py']],
  [process.execPath, ['scripts/sync-publications.mjs']],
];
let failed = false;
for (const [command, args] of jobs) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    failed = true;
    console.error('Falha no importador:', path.basename(args[0]));
  }
}
process.exitCode = failed ? 1 : 0;
