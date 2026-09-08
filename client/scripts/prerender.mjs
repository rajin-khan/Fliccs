import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { origin, pages, missing, structuredData } from '../src/seo/pages.js';
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const template = await readFile('dist/index.html', 'utf8');
const server = await createServer({ server: { middlewareMode: true, hmr: false }, ssr: { noExternal: ['react-router-dom', 'react-router'], resolve: { conditions: ['module', 'import', 'production'] } }, appType: 'custom' });
try {
  const { render } = await server.ssrLoadModule('/scripts/render.jsx');
  for (const [path, page] of [...Object.entries(pages), ['/404', missing]]) {
    const head = `<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}" />
<meta name="robots" content="${path === '/404' ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />
<link rel="canonical" href="${origin}${path}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Fliccs" />
<meta property="og:locale" content="en_US" />
<meta property="og:title" content="${escape(page.title)}" />
<meta property="og:description" content="${escape(page.description)}" />
<meta property="og:url" content="${origin}${path}" />
<meta property="og:image" content="${origin}/og/fliccs.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Fliccs — Watch together. Wherever you are. Sync or stream local videos with friends." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(page.title)}" />
<meta name="twitter:description" content="${escape(page.description)}" />
<meta name="twitter:image" content="${origin}/og/fliccs.png" />
<meta name="twitter:image:alt" content="Fliccs — Watch together. Wherever you are." />
<script id="structured-data" type="application/ld+json">${JSON.stringify(structuredData(path)).replaceAll('<', '\\u003c')}</script>`;
    const html = template.replace(/<!-- SEO_START -->[\s\S]*?<!-- SEO_END -->/, head).replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
    const dest = path === '/' ? 'dist/index.html' : path === '/404' ? 'dist/404.html' : `dist${path}/index.html`;
    await mkdir(resolve(dest, '..'), { recursive: true });
    await writeFile(dest, html);
  }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pages).map(path => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>\n`);
} finally { await server.close(); }
