import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const store = JSON.parse(await fs.readFile('data/publications.json', 'utf8'));
const slugs = store.posts.flatMap((post) => [post.slug, ...(post.aliasSlugs || [])]);
for (const slug of slugs) {
  assert(/^[a-zA-Z0-9-]+$/.test(slug));
  const html = await fs.readFile(`out/publicacoes/${slug}/index.html`, 'utf8');
  assert(html.includes('View original post on LinkedIn'));
}
for (const file of ['data/publications.json', 'data/people.json', 'data/projects.json']) {
  const source = await fs.readFile(file, 'utf8');
  const media = [...new Set(source.match(/\/media\/[a-f0-9]{28}\.(?:jpg|png|webp|gif)/g) || [])];
  for (const asset of media) await fs.access('out' + asset);
}
const home = await fs.readFile('out/index.html', 'utf8');
assert(!home.includes('/api/projects/'));
assert(!home.includes('apify_api_'));
assert(home.includes('lang="en"'));
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
assert(home.includes(`${base}/instituto.jpg`));
assert.equal(new Set(store.posts.map((post) => post.slug)).size, store.posts.length);
console.log(`Validated ${slugs.length} static publication routes and all stored images.`);

for (const htmlFile of [
  'out/index.html',
  ...slugs.map((slug) => `out/publicacoes/${slug}/index.html`),
]) {
  const html = await fs.readFile(htmlFile, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    let target = match[1].split('#')[0].split('?')[0];
    if (!target.startsWith('/') || target.startsWith('//')) continue;
    if (base && target.startsWith(base + '/')) target = target.slice(base.length);
    if (target === '/' || target.endsWith('/')) target += 'index.html';
    else if (!target.split('/').at(-1).includes('.')) target += '/index.html';
    await fs.access('out' + target);
  }
}
console.log('Internal page links and asset URLs verified.');
