import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://backcountrycrews.com';

  // Static pages
  const staticPages = [
    '',
    '/forecast',
    '/trips',
    '/partners',
    '/login',
    '/signup',
  ];

  const staticEntries = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/forecast' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return staticEntries;
}
