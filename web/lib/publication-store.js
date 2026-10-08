import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { deduplicatePublications } from './publication-model';

export async function readPublications() {
  const store = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data/publications.json'), 'utf8'),
  );
  return { ...store, posts: deduplicatePublications(store.posts) };
}
