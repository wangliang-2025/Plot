import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { getCategoryBySlug } from '@/lib/categories';
import { PostCard } from '@/components/post-card';
import { Folder } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const t = await getTranslations('categories');
  const { items } = await listPosts({ locale, category: slug, pageSize: 50 });

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Folder className="h-4 w-4" /> {t('title')}
        </p>
        <h1
          className="mt-1 font-serif text-4xl font-bold"
          style={cat.color ? { color: cat.color } : undefined}
        >
          {cat.name}
        </h1>
        {cat.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{cat.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {t('post_count', { count: items.length })}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="card p-16 text-center text-muted-foreground">—</div>
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
