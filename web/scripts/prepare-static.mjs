import fs from 'node:fs/promises';
await fs.mkdir('public/media',{recursive:true});
await fs.cp('data/media','public/media',{recursive:true});
await fs.writeFile('public/.nojekyll','');
