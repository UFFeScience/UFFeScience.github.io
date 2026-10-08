import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readPublications } from './publication-store';

export async function getGithub() {
  const store = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data/projects.json'), 'utf8'),
  );
  return store;
}
export async function getNews() {
  return readPublications();
}
