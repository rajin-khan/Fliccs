import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { origin, pages, pageMeta, structuredData, invite, isInvite, inviteUrl } from './pages';

export default function Metadata() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/$/, '') || '/';
    const invited = isInvite(path, search);
    const page = invited ? invite : pageMeta(path);
    const image = `${origin}/og/${invited ? 'invite' : 'fliccs'}.png`;
    const alt = invited ? "Fliccs. You're invited. Watch together." : 'Fliccs. Watch together. Wherever you are.';
    document.title = page.title;
    const values = {
      description: page.description,
      robots: !Object.hasOwn(pages, path) || new URLSearchParams(search).has('join') || new URLSearchParams(search).has('pass') ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      'og:title': page.title, 'og:description': page.description, 'og:url': invited ? inviteUrl(search) : origin + path,
      'og:image': image, 'og:image:alt': alt, 'twitter:image': image, 'twitter:image:alt': alt,
      'twitter:title': page.title, 'twitter:description': page.description,
    };
    for (const [key, content] of Object.entries(values)) {
      const attribute = key.startsWith('og:') ? 'property' : 'name';
      let meta = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, key); document.head.append(meta); }
      meta.setAttribute('content', content);
    }
    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', invited ? inviteUrl(search) : origin + path);
    const schema = document.getElementById('structured-data');
    if (schema) schema.textContent = JSON.stringify(invited ? {} : structuredData(path));
  }, [pathname, search]);
  return null;
}
