import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { origin, pages, pageMeta, structuredData } from './pages';

export default function Metadata() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/$/, '') || '/';
    const page = pageMeta(path);
    document.title = page.title;
    const values = {
      description: page.description,
      robots: !Object.hasOwn(pages, path) || new URLSearchParams(search).has('join') || new URLSearchParams(search).has('pass') ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      'og:title': page.title, 'og:description': page.description, 'og:url': origin + path,
      'twitter:title': page.title, 'twitter:description': page.description,
    };
    for (const [key, content] of Object.entries(values)) {
      const attribute = key.startsWith('og:') ? 'property' : 'name';
      document.head.querySelector(`meta[${attribute}="${key}"]`)?.setAttribute('content', content);
    }
    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', origin + path);
    const schema = document.getElementById('structured-data');
    if (schema) schema.textContent = JSON.stringify(structuredData(path));
  }, [pathname, search]);
  return null;
}
