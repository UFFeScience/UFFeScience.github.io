import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { deduplicatePublications } from './publication-model';

export async function readPublications() {
  const store = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data/publications.json'), 'utf8'),
  );
  return {
    ...store,
    posts: deduplicatePublications(store.posts).map((post) => ({
      ...post,
      title:
        post.text
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line && !/^🇧🇷\s*(pt-br|português)/i.test(line)) || post.title,
    })),
  };
}

export async function readGroupPublications() {
  const store = await readPublications();
  return {
    ...store,
    posts: store.posts.filter(
      (post) =>
        post.sourceIds?.includes('group') &&
        (post.author.url?.includes('/company/uffescience-research-group') ||
          post.author.name === 'UFFeScience Research Group'),
    ),
  };
}
