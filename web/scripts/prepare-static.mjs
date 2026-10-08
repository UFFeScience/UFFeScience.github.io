import fs from 'node:fs/promises';
await fs.rm('public/media', { recursive: true, force: true });
await fs.mkdir('public/media', { recursive: true });
await fs.cp('data/media', 'public/media', { recursive: true });
await fs.writeFile('public/.nojekyll', '');
