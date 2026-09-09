export const origin = 'https://fliccs.com';
export const pages = {
  '/': { title: 'Fliccs — Watch Videos Together Online', description: 'Watch local videos with friends on Fliccs. Sync playback or stream from one host, with live chat and password-protected rooms. No account needed.' },
  '/landing': { title: 'Watch together, wherever you are | Fliccs', description: 'Make time for a watch party. Stream a local video to friends or sync the same file, with room chat and no account needed.' },
  '/pricing': { title: 'Plans & Pricing | Fliccs', description: 'Explore Fliccs Sync and Stream modes and planned Premium features for watching videos together with friends.' },
  '/privacy': { title: 'Privacy Policy | Fliccs', description: 'Learn how Fliccs handles session data, local storage, and privacy when you watch videos with friends.' },
  '/terms-and-conditions': { title: 'Terms of Service | Fliccs', description: 'Read the terms for using Fliccs, including user responsibilities and rules for sharing video content.' },
  '/refund': { title: 'Refund & Cancellation Policy | Fliccs', description: 'Read the refund and cancellation policy for Fliccs Premium subscriptions.' },
};
export const missing = { title: 'Page Not Found | Fliccs', description: 'This page does not exist. Return to Fliccs to start or join a watch party.' };
export function pageMeta(pathname) { return Object.hasOwn(pages, pathname) ? pages[pathname] : missing; }
export function structuredData(pathname) {
  const page = pageMeta(pathname);
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Fliccs', alternateName: 'Tessro', url: `${origin}/` },
    { '@type': 'WebPage', '@id': `${origin}${pathname}#webpage`, url: `${origin}${pathname}`, name: page.title, description: page.description, isPartOf: { '@id': `${origin}/#website` } },
    ...(pathname === '/' ? [{ '@type': 'WebApplication', name: 'Fliccs', url: `${origin}/`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', description: page.description, image: `${origin}/og/fliccs.png` }] : []),
  ] };
}

export const invite = { title: "You're invited to watch together | Fliccs", description: 'Join a Fliccs watch party. Sync or stream local videos with friends, with live chat and no account needed.' };
export function isInvite(path, search) { return path === '/' && Boolean(new URLSearchParams(search).get('join')); }
export function inviteUrl(search) {
  const params = new URLSearchParams(search);
  const url = new URL('/', origin);
  url.searchParams.set('join', params.get('join'));
  if (params.has('pass')) url.searchParams.set('pass', params.get('pass'));
  return url.href;
}
