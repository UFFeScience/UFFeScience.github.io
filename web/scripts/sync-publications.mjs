import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  normalizePublication,
  mergePublications,
  publicationSources,
  mediaUrl,
} from '../lib/publication-model.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  process.loadEnvFile(path.join(root, '.env.local'));
} catch {}
const token = process.env.APIFY_TOKEN;
if (!token) throw new Error('APIFY_TOKEN não configurado no servidor.');
const dataDir = path.join(root, 'data'),
  mediaDir = path.join(dataDir, 'media'),
  storePath = path.join(dataDir, 'publications.json');
await fs.mkdir(mediaDir, { recursive: true });
const force = process.argv.includes('--force');
const weekStart = new Date();
weekStart.setUTCHours(0, 0, 0, 0);
weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
const weekKey = weekStart.toISOString().slice(0, 10);
let previous = { posts: [], sources: [], lastCheckedAt: null };
try {
  previous = JSON.parse(await fs.readFile(storePath, 'utf8'));
} catch {}
if (
  !force &&
  previous.sources?.length === 2 &&
  previous.sources.every(
    (source) => source.collectedAt && new Date(source.collectedAt) >= weekStart,
  )
) {
  console.log('Publicações já sincronizadas nesta semana. Nenhuma consulta ao Apify.');
  process.exit(0);
}
const lockPath = path.join(dataDir, 'sync.lock');
try {
  const stat = await fs.stat(lockPath);
  if (Date.now() - stat.mtimeMs > 3600000) await fs.unlink(lockPath);
} catch {}
let lock;
try {
  lock = await fs.open(path.join(dataDir, 'sync.lock'), 'wx');
} catch {
  console.log('Uma sincronização já está em andamento.');
  process.exit(0);
}
async function api(endpoint, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.apify.com/v2/${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Apify respondeu HTTP ${response.status}.`);
  if (response.status === 204) return null;
  return response.json();
}
const mediaCache = new Map();
async function archiveImage(url) {
  if (!mediaUrl(url)) return null;
  if (mediaCache.has(url)) return mediaCache.get(url);
  const promise = (async () => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
      const type = response.headers.get('content-type')?.split(';')[0];
      const extension = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      }[type];
      if (
        !response.ok ||
        !extension ||
        Number(response.headers.get('content-length')) > 8 * 1024 * 1024
      )
        return null;
      const reader = response.body.getReader();
      const chunks = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 8 * 1024 * 1024) {
          await reader.cancel();
          return null;
        }
        chunks.push(value);
      }
      const bytes = Buffer.concat(chunks),
        filename = `${createHash('sha256').update(bytes).digest('hex').slice(0, 28)}.${extension}`;
      await fs.writeFile(path.join(mediaDir, filename), bytes);
      return `/media/${filename}`;
    } catch {
      return null;
    }
  })();
  mediaCache.set(url, promise);
  return promise;
}
try {
  const config = JSON.parse(await fs.readFile(path.join(dataDir, 'apify-config.json'), 'utf8'));
  const incoming = [],
    sources = [];
  for (let index = 0; index < config.tasks.length; index++) {
    const task = config.tasks[index],
      source = publicationSources[index];
    try {
      const prior = previous.sources?.find((item) => item.id === source.id);
      let run;
      if (prior?.collectedAt && new Date(prior.collectedAt) >= weekStart) {
        sources.push(prior);
        continue;
      }
      // Persist the run ID remotely before waiting. Retries resume it instead of starting another extraction.
      const record = `WEEK-${weekKey}-${source.id}`;
      try {
        run = await api(`key-value-stores/${config.storeId}/records/${record}`);
      } catch (error) {
        if (!error.message.includes('404')) throw error;
      }
      if (!run) {
        const runs = (await api(`actor-tasks/${task.id}/runs?limit=100&desc=1`)).data.items;
        run = runs.find((item) => new Date(item.startedAt) >= weekStart);
        if (!run)
          run = (
            await api(`actor-tasks/${task.id}/runs`, {
              method: 'POST',
              body: {
                searchQueries: [''],
                authorUrls: [source.url],
                maxPosts: 100,
                postedLimit: 'month',
                sortBy: 'date',
                profileScraperMode: 'short',
                scrapeComments: false,
                scrapeReactions: false,
              },
            })
          ).data;
        await api(`key-value-stores/${config.storeId}/records/${record}`, {
          method: 'PUT',
          body: { id: run.id },
        });
      }
      const deadline = Date.now() + 12 * 60000;
      while (true) {
        run = (await api(`actor-runs/${run.id}`)).data;
        if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) break;
        if (Date.now() > deadline)
          throw new Error('Collection still running; next execution will resume it.');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      if (run.status !== 'SUCCEEDED')
        throw new Error(`Collection status: ${run.status}; saved data preserved.`);
      await api(`datasets/${run.defaultDatasetId}`, {
        method: 'PUT',
        body: { name: `uffescience-${source.id}-${run.id.toLowerCase()}` },
      });
      let raw = [],
        offset = 0;
      while (true) {
        const batch = await api(
          `datasets/${run.defaultDatasetId}/items?clean=true&format=json&limit=1000&offset=${offset}`,
        );
        raw.push(...batch);
        if (batch.length < 1000) break;
        offset += batch.length;
      }
      for (const record of raw) {
        const post = normalizePublication(record, source);
        if (post) incoming.push(post);
      }
      sources.push({
        ...source,
        runId: run.id,
        datasetId: run.defaultDatasetId,
        collectedAt: run.finishedAt,
        status: 'success',
        received: raw.length,
        limitReached: raw.length >= 100 && run.id !== config.backfillRunId,
      });
      console.log(`${source.name}: ${raw.length} publicações recuperadas da coleta já concluída.`);
    } catch (error) {
      const prior = previous.sources?.find((item) => item.id === source.id);
      sources.push({ ...prior, ...source, status: 'error', error: error.message });
      console.log(`${source.name}: dados anteriores preservados (${error.message}).`);
    }
  }
  if (!incoming.length) {
    console.log('No new valid publications. Stored history preserved.');
    if (!previous.posts?.length) throw new Error('No stored publications available');
  }
  let posts = mergePublications(previous.posts || [], incoming);
  const incomingIds = new Set(incoming.map((post) => post.id));
  const oldById = new Map((previous.posts || []).map((post) => [post.id, post]));
  const work = posts.filter(
    (post) =>
      incomingIds.has(post.id) &&
      (!oldById.has(post.id) ||
        !post.cover ||
        JSON.stringify(post.remoteImages) !== JSON.stringify(oldById.get(post.id).remoteImages)),
  );
  let pointer = 0;
  async function worker() {
    while (pointer < work.length) {
      const post = work[pointer++];
      const images = [];
      for (const url of post.remoteImages) {
        const image = await archiveImage(url);
        if (image) images.push(image);
      }
      if (images.length) {
        post.images = images;
        post.cover = images[0];
      }
      const avatar = await archiveImage(post.author.remoteAvatar);
      if (avatar) post.author.avatar = avatar;
    }
  }
  await Promise.allSettled(Array.from({ length: 4 }, worker));
  const store = {
    version: 1,
    posts,
    sources,
    lastCheckedAt: new Date().toISOString(),
    lastCollectedAt:
      sources
        .filter((source) => source.collectedAt)
        .map((source) => source.collectedAt)
        .sort()
        .at(-1) || previous.lastCollectedAt,
  };
  const temporary = `${storePath}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(store, null, 2));
  await fs.rename(temporary, storePath);
  if (config.storeId) {
    try {
      await api(`key-value-stores/${config.storeId}/records/PUBLICATIONS`, {
        method: 'PUT',
        body: store,
      });
      console.log('Arquivo também preservado no Key-value Store nomeado do Apify.');
    } catch (error) {
      console.log(`Cópia local concluída; cópia remota pendente (${error.message}).`);
    }
  }
  console.log(
    `Sincronização concluída: ${posts.length} publicações armazenadas. Weekly extraction guarded by source and week.`,
  );
} finally {
  await lock.close();
  await fs.unlink(path.join(dataDir, 'sync.lock')).catch(() => {});
}
