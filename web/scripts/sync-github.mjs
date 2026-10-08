import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalizeEvents } from '../lib/events.js';
try {
  process.loadEnvFile('.env.local');
} catch {}
const org = process.env.GITHUB_ORG || 'UFFeScience',
  file = 'data/projects.json';
let previous = { repos: [], details: {} };
try {
  previous = JSON.parse(await fs.readFile(file, 'utf8'));
} catch {}
async function api(endpoint) {
  const r = await fetch(`https://api.github.com/${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (r.status === 204) return [];
  if (!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
  return r.json();
}
try {
  let repos = [];
  for (let page = 1; ; page++) {
    const batch = await api(`orgs/${org}/repos?type=public&per_page=100&sort=pushed&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Invalid repository data');
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  repos = repos
    .filter(
      (repo) =>
        !repo.private &&
        !repo.archived &&
        repo.name.toLowerCase() !== `${org.toLowerCase()}.github.io`,
    )
    .map(({ name, description, html_url, stargazers_count, pushed_at }) => ({
      name,
      description,
      html_url,
      stargazers_count,
      pushed_at,
    }))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  if (!repos.length) throw new Error('Empty repository response; retaining saved data');
  const details = { ...previous.details };
  await fs.mkdir('data/media', { recursive: true });
  async function photo(url) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const type = r.headers.get('content-type')?.split(';')[0],
        ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[type];
      if (!r.ok || !ext) return url;
      const bytes = Buffer.from(await r.arrayBuffer());
      if (bytes.length > 8 * 1024 * 1024) return url;
      const name = createHash('sha256').update(bytes).digest('hex').slice(0, 28) + '.' + ext;
      await fs.writeFile('data/media/' + name, bytes);
      return '/media/' + name;
    } catch {
      return url;
    }
  }
  let next = 0;
  async function worker() {
    while (next < repos.length) {
      const repo = repos[next++],
        old = details[repo.name] || {};
      const [people, events] = await Promise.allSettled([
        api(`repos/${org}/${repo.name}/contributors?per_page=5`),
        api(`repos/${org}/${repo.name}/events?per_page=30`),
      ]);
      let contributors = old.contributors || [],
        updates = old.updates || [];
      if (
        people.status === 'fulfilled' &&
        Array.isArray(people.value) &&
        (people.value.length || !contributors.length)
      )
        contributors = await Promise.all(
          people.value.map(async (person) => ({
            actor: person.login,
            avatar: await photo(person.avatar_url),
            profileUrl: person.html_url,
          })),
        );
      if (events.status === 'fulfilled' && Array.isArray(events.value)) {
        const incoming = normalizeEvents(events.value);
        updates = [...new Map([...updates, ...incoming].map((item) => [item.id, item])).values()]
          .filter((item) => Date.now() - new Date(item.date).getTime() <= 30 * 86400000)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 100);
      }
      details[repo.name] = {
        contributors,
        updates,
        contributorsAvailable: people.status === 'fulfilled' || !!old.contributorsAvailable,
        updatesAvailable: events.status === 'fulfilled' || !!old.updatesAvailable,
        fetchedAt: new Date().toISOString(),
      };
      if (people.status === 'rejected' || events.status === 'rejected')
        console.warn(`${repo.name}: preserving previous data for unavailable sources.`);
    }
  }
  await Promise.all([worker(), worker()]);
  const data = { repos, details, fetchedAt: new Date().toISOString() };
  await fs.writeFile(file + '.tmp', JSON.stringify(data, null, 2));
  await fs.rename(file + '.tmp', file);
  console.log(`Saved ${repos.length} projects.`);
} catch (error) {
  console.warn(error.message);
  if (!previous.repos.length) throw error;
  console.warn('Saved GitHub data preserved.');
}
