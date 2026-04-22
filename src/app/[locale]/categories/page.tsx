import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { listCategories } from '@/lib/categories';
import { Folder, Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CategoriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('categories');
  const cats = await listCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-serif text-4xl font-bold gradient-text">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </header>

      {cats.length === 0 ? (
        <div className="card p-16 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--accent))]" />
          <p className="text-muted-foreground">{t('no_categories')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="card card-hover group relative overflow-hidden p-5"
            >
              <div
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                style={{
                  background:
                    c.color ||
                    'linear-gradient(135deg, hsl(var(--aurora-1)), hsl(var(--aurora-2)))',
                }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-md"
                  style={{
                    background: c.color
                      ? `linear-gradient(135deg, ${c.color}, ${c.color}cc)`
                      : 'linear-gradient(135deg, hsl(var(--aurora-1)), hsl(var(--aurora-3)))',
                  }}
                >
                  <Folder className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('post_count', { count: c.count })}
                  </p>
                </div>
              </div>
              {c.description && (
                <p className="relative mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
