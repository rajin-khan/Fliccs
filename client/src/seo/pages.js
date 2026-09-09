export const origin = 'https://fliccs.com';
export const pages = {
  '/': { title: 'Fliccs — Watch Videos Together Online', description: 'Watch local videos with friends on Fliccs. Sync playback or stream from one host, with live chat and password-protected rooms. No account needed.' },
  '/watch': { title: 'Start or Join a Watch Party | Fliccs', description: 'Create or join a Fliccs room to sync or stream local videos with friends.', noindex: true },
  '/pricing': { title: 'Plans & Pricing | Fliccs', description: 'Explore Fliccs Sync and Stream modes and planned Premium features for watching videos together with friends.' },
  '/privacy': { title: 'Privacy Policy | Fliccs', description: 'Learn how Fliccs handles session data, local storage, and privacy when you watch videos with friends.' },
  '/terms-and-conditions': { title: 'Terms of Service | Fliccs', description: 'Read the terms for using Fliccs, including user responsibilities and rules for sharing video content.' },
  '/refund': { title: 'Refund & Cancellation Policy | Fliccs', description: 'Read the refund and cancellation policy for Fliccs Premium subscriptions.' },
};
export const missing = { noindex: true, title: 'Page Not Found | Fliccs', description: 'This page does not exist. Return to Fliccs to start or join a watch party.' };
export function robotsFor(pathname, search = '') {
  const params = new URLSearchParams(search);
  return pageMeta(pathname).noindex || params.has('join') || params.has('pass') ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
}
export function pageMeta(pathname) { return Object.hasOwn(pages, pathname) ? pages[pathname] : missing; }
export function structuredData(pathname) {
  const page = pageMeta(pathname);
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Fliccs', url: `${origin}/` },
    { '@type': 'WebPage', '@id': `${origin}${pathname}#webpage`, url: `${origin}${pathname}`, name: page.title, description: page.description, isPartOf: { '@id': `${origin}/#website` } },
    ...(pathname === '/' ? [{ '@type': 'WebApplication', name: 'Fliccs', url: `${origin}/watch`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', description: page.description, image: `${origin}/og/fliccs.png` }] : []),
  ] };
}

export const invite = { title: "You're invited to watch together | Fliccs", description: 'Join a Fliccs watch party. Sync or stream local videos with friends, with live chat and no account needed.' };
export function isInvite(path, search) { return path === '/watch' && Boolean(new URLSearchParams(search).get('join')); }
export function inviteUrl(search) {
  const params = new URLSearchParams(search);
  const url = new URL('/watch', origin);
  url.searchParams.set('join', params.get('join'));
  if (params.has('pass')) url.searchParams.set('pass', params.get('pass'));
  return url.href;
}
