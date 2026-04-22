import { setRequestLocale, getTranslations } from 'next-intl/server';
import { listPosts } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import { SearchInput } from '@/components/search-input';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('search');
  const query = (q ?? '').trim();

  const { items } = query
    ? await listPosts({ locale, query, pageSize: 30 })
    : { items: [] };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-bold gradient-text">{t('title')}</h1>
        <div className="mt-6">
          <SearchInput initialQuery={query} placeholder={t('placeholder')} />
        </div>
      </header>

      {query && (
        <p className="mb-6 text-sm text-muted-foreground">
          {t('results_for', { query })} —{' '}
          <span className="font-medium">{t('result_count', { count: items.length })}</span>
        </p>
      )}

      {query && items.length === 0 ? (
        <div className="card p-16 text-center text-muted-foreground">{t('no_results')}</div>
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
