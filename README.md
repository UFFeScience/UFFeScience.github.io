# UFF eScience Research Group

Public website: https://uffescience.github.io/

The live website is a static Next.js application in [`web/`](web/README.md). GitHub Actions exports and deploys it to GitHub Pages. Content and archived images are versioned in `web/data/`; there are no runtime Next.js APIs.

[Update and deployment workflow](https://github.com/UFFeScience/uffescience.github.io/actions/workflows/pages.yml) runs weekly on Monday at 09:00 Brasília and can be run manually. Apify credentials are stored only in Actions Secrets and ignored local environment files.

See [development and content documentation](web/README.md) for local preview, synchronization, storage and deployment details. Legacy Jekyll sources remain in the root as historical material; the Jekyll deployment workflow has been replaced.
