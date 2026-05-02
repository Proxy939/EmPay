import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    {
      url: baseUrl,
      lastModified: new Date('2026-05-02'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ];
}