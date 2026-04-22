import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import { prisma } from '@/lib/db';
import { Hash } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; tag: string }>;
}

export default async function TagPage({ params }: Props) {
  const { locale, tag: tagSlugRaw } = await params;
  setRequestLocale(locale);
  let tagSlug = tagSlugRaw;
  try {
    tagSlug = decodeURIComponent(tagSlugRaw);
  } catch {}

  const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
  if (!tag) notFound();

  const t = await getTranslations('tags');
  const { items } = await listPosts({ locale, tag: tagSlug, pageSize: 50 });

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Hash className="h-4 w-4" /> {t('title')}
        </p>
        <h1 className="mt-1 font-serif text-4xl font-bold">#{tag.name}</h1>
        <p className="mt-2 text-muted-foreground">{t('post_count', { count: items.length })}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">—</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
