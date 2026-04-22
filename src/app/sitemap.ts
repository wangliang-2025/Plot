import type { MetadataRoute } from 'next';
import { listPosts, listAllTags } from '@/lib/posts';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) => [
    { url: `${siteUrl}/${locale}`, lastModified: now },
    { url: `${siteUrl}/${locale}/posts`, lastModified: now },
    { url: `${siteUrl}/${locale}/tags`, lastModified: now },
    { url: `${siteUrl}/${locale}/about`, lastModified: now },
  ]);

  const { items } = await listPosts({ pageSize: 1000 });
  const postEntries: MetadataRoute.Sitemap = items.map((p) => ({
    url: `${siteUrl}/${p.locale}/posts/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const tags = await listAllTags();
  const tagEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    tags.map((t) => ({ url: `${siteUrl}/${locale}/tags/${t.slug}`, lastModified: now }))
  );

  return [...staticEntries, ...postEntries, ...tagEntries];
}
