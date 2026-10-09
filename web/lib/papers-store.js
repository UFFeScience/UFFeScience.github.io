import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function readPapers() {
  return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/papers.json'), 'utf8'));
}
