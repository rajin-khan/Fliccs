import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { get as httpGet } from 'node:http';
import { pages, origin } from '../../client/src/seo/pages.js';

// Run after the client build; verifies what a crawler receives without JavaScript.
test('public SEO, canonical redirects, private invites and real 404s', async () => {
  const server = spawn(process.execPath, ['server/src/index.js'], {
    cwd: new URL('../../', import.meta.url),
    env: { ...process.env, PORT: '0', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    // The app logs its assigned listening port, including when PORT=0.
    let output = '';
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server did not start')), 10000);
      server.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/Fliccs server listening on port (\d+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
      server.once('error', reject);
    });
    const get = (path, options) => fetch(`http://localhost:${port}${path}`, options);
    for (const [path, page] of Object.entries(pages)) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(html.includes(`<link rel="canonical" href="${origin}${path}"`), path);
      assert.ok(html.includes(page.title.replaceAll('&', '&amp;')), path);
      assert.match(html, /<h1[\s>]/);
      assert.match(html, /property="og:image" content="https:\/\/fliccs.com\/og\/fliccs.png"/);
      assert.ok(JSON.parse(html.match(/id="structured-data"[^>]*>(.*?)<\/script>/s)[1])['@graph']);
    }
    assert.match((await get('/?join=example&pass=example')).headers.get('x-robots-tag'), /noindex/);
    for (const agent of ['facebookexternalhit/1.1', 'Twitterbot/1.0', 'Discordbot/2.0']) {
      const response = await get('/?join=ABC123&pass=a%26b%22%3Cscript%3E', { headers: { 'User-Agent': agent } });
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.match(html, /<title>You're invited to watch together \| Fliccs<\/title>/);
      assert.match(html, /property="og:image" content="https:\/\/fliccs.com\/og\/invite.png"/);
      assert.match(html, /name="twitter:image" content="https:\/\/fliccs.com\/og\/invite.png"/);
      assert.match(html, /property="og:url" content="https:\/\/fliccs.com\/\?join=ABC123&amp;pass=a%26b%22%3Cscript%3E"/);
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert.ok(!html.includes('__INVITE_URL__'));
      assert.ok(!html.includes('a&b"<script>'));
    }
    const inviteImage = Buffer.from(await (await get('/og/invite.png')).arrayBuffer());
    assert.equal(inviteImage.readUInt32BE(16), 1200);
    assert.equal(inviteImage.readUInt32BE(20), 630);
    assert.equal((await get('/does-not-exist')).status, 404);
    for (const [path, expected] of [['/pricing/', '/pricing'], ['/index.html', '/'], ['/privacy/index.html', '/privacy']]) {
      const response = await get(path, { redirect: 'manual' });
      assert.equal(response.status, 301);
      assert.equal(response.headers.get('location'), expected);
    }
    const alternate = await new Promise((resolve, reject) => {
      httpGet(`http://localhost:${port}/?join=example`, { headers: { Host: 'fliccs.up.railway.app' } }, response => {
        response.resume();
        resolve(response);
      }).on('error', reject);
    });
    assert.equal(alternate.statusCode, 301);
    assert.equal(alternate.headers.location, 'https://fliccs.com/?join=example');
    const sitemap = await (await get('/sitemap.xml')).text();
    assert.equal((sitemap.match(/<loc>/g) || []).length, Object.keys(pages).length);
    const image = await get('/og/fliccs.png');
    assert.match(image.headers.get('content-type'), /image\/png/);
    const bytes = Buffer.from(await image.arrayBuffer());
    assert.equal(bytes.readUInt32BE(16), 1200);
    assert.equal(bytes.readUInt32BE(20), 630);
  } finally {
    server.kill();
    await once(server, 'exit');
  }
});
