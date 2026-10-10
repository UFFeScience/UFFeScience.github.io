import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function readPapers() {
  const store = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/papers.json'), 'utf8'));
  return {
    ...store,
    papers: store.papers.map((paper) => {
      const identity = `${paper.year}:${paper.title.normalize('NFC')}`;
      const suffix = createHash('sha256').update(identity).digest('hex').slice(0, 12);
      const title = paper.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 75)
        .replace(/-$/, '');
      return { ...paper, slug: `${title}-${suffix}` };
    }),
  };
}
