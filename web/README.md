# UFF eScience — static Next.js site

JavaScript, Next.js App Router, `output: 'export'`. Public site: https://uffescience.github.io/ (organization site, no basePath). `NEXT_PUBLIC_BASE_PATH` supports a repository path when necessary; Actions derives it from configure-pages.

## Local preview

Node.js 22+, Python 3:

```sh
npm ci
npm run build
node scripts/check-static.mjs
python3 -m http.server 3007 --directory out
```

`npm run dev -- --port 3007` is also available for editing. No deployed Node.js server, API routes, ISR or remote image optimization is required. Every publication slug and historical alias is generated during the build. HTML, CSS, JavaScript and archived images are published from `out/`.

## Stored content

- `data/publications.json`: full publication history, stable slugs, authors, dates, original LinkedIn links, deduplication aliases and collection metadata.
- `data/projects.json`: repositories, real stars, contributor photos and recent public activity. The graph is a sample of public events, not complete commit history.
- `data/people.json`: names and links scraped from Daniel’s public students and collaboration pages, including former students.
- `data/media/`: versioned local images. Build copies them to `public/media/`, which is generated and ignored. Do not delete archived images while records reference them.

The site reads only stored files during the build. Visits do not call GitHub or Apify. Cards display stored content in chronological order with automatic horizontal pagination. Original post languages are preserved.

## Weekly update and deployment

`.github/workflows/pages.yml` is the only active schedule: Monday 12:00 UTC, equivalent to 09:00 Brasília. GitHub may delay scheduled jobs. Prior Apify and macOS schedules were disabled.

The workflow updates GitHub data, people and LinkedIn, commits changed content with GITHUB_TOKEN, builds and deploys Pages. Shared concurrency prevents overlapping runs. Bot commits do not trigger another workflow; `[skip ci]` adds a second safeguard. Pushes to main deploy without collecting LinkedIn. Concurrent human changes are rebased without force-pushing; conflicts stop publication instead of overwriting work.

Apify uses actor `buIWk2uOUzTmcLsuB` for UFFeScience’s company page and Daniel de Oliveira’s profile. The initial archived history is preserved. Weekly tasks collect the last month (up to 100 posts per source), update existing records and merge new ones. A source/week journal in the named Apify Key-value Store and a task-run lookup resume an existing run after interruption. Manual updates in the same week do not start another extraction. Failed sources retain the last valid files; an empty result never clears history. A failed run is not restarted in the same week. If a run is still active, rerun manually to import its result.

Open Actions → **Update content and deploy Next.js to Pages** → **Run workflow** on main. Keep `refresh_content` checked to update stored data, or uncheck it for a deployment only. For local updates: `npm run sync:weekly` with APIFY_TOKEN and optionally GITHUB_TOKEN in `.env.local` or the process environment. `--force` on the publication importer bypasses the local shortcut, but never the source/week extraction guard.

APIFY_TOKEN must be a repository Actions Secret and/or an ignored local environment variable. Never use NEXT_PUBLIC for credentials. `data/apify-config.json` contains only resource identifiers, not credentials. Set Pages source to GitHub Actions. Workflow contents write permission is required for content commits.
