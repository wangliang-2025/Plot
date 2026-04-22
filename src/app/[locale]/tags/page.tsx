import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { listAllTags } from '@/lib/posts';
import { Hash } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function TagsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('tags');
  const tags = await listAllTags();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-bold gradient-text">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </header>

      {tags.length === 0 ? (
        <div className="card p-16 text-center text-muted-foreground">—</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="card card-hover flex items-center justify-between p-4"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <Hash className="h-4 w-4 text-[hsl(var(--accent))]" />
                {tag.name}
              </span>
              <span className="text-sm text-muted-foreground">{tag.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
