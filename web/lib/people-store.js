import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function readPeople() {
  return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/people.json'), 'utf8'));
}
