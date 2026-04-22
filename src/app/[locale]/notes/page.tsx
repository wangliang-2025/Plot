import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { listPosts } from '@/lib/posts';
import { listCategories } from '@/lib/categories';
import { formatDateShort } from '@/lib/utils';
import { PlusCircle, Edit3, Eye, Folder, Settings, User as UserIcon } from 'lucide-react';
import { DeletePostButton } from '@/components/delete-post-button';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function NotesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { filter } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect({ href: '/login', locale });

  const t = await getTranslations('notes');
  const [{ items }, cats] = await Promise.all([
    listPosts({ pageSize: 100, includeAll: true, authorId: session!.user.id }),
    listCategories({ ownerId: session!.user.id, includeOwnerless: true }),
  ]);

  const filtered = items.filter((p) => {
    if (filter === 'published') return p.published && p.visibility === 'public';
    if (filter === 'draft') return !p.published;
    if (filter === 'private') return p.visibility === 'private';
    return true;
  });

  const tabs: Array<{ key: 'all' | 'published' | 'draft' | 'private'; label: string }> = [
    { key: 'all', label: t('filter_all') },
    { key: 'published', label: t('filter_published') },
    { key: 'draft', label: t('filter_draft') },
    { key: 'private', label: t('filter_private') },
  ];
  const active = (filter as 'all' | 'published' | 'draft' | 'private') || 'all';

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold gradient-text">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile" className="btn-ghost h-9">
            <UserIcon className="h-3.5 w-3.5" />
            {t('profile')}
          </Link>
          <Link href="/notes/categories" className="btn-secondary h-9">
            <Settings className="h-3.5 w-3.5" />
            {t('manage_categories')}
          </Link>
          <Link href="/notes/new" className="btn-accent h-9">
            <PlusCircle className="h-3.5 w-3.5" />
            {t('new')}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card glass p-2">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('filter')}
            </p>
            <nav className="flex flex-col gap-0.5">
              {tabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.key === 'all' ? '/notes' : `/notes?filter=${tab.key}`}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    active === tab.key
                      ? 'bg-white/70 dark:bg-white/10 text-[hsl(var(--accent))] font-medium'
                      : 'hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            {cats.length > 0 && (
              <>
                <p className="mt-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('categories')}
                </p>
                <nav className="flex flex-col gap-0.5">
                  {cats.map((c) => (
                    <Link
                      key={c.id}
                      href={`/categories/${c.slug}`}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition hover:bg-white/40 dark:hover:bg-white/5"
                    >
                      <Folder
                        className="h-3.5 w-3.5"
                        style={{ color: c.color || 'hsl(var(--accent))' }}
                      />
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.count}</span>
                    </Link>
                  ))}
                </nav>
              </>
            )}
          </div>
        </aside>

        <section>
          {filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-muted-foreground">{t('no_notes')}</p>
              <Link href="/notes/new" className="btn-accent mx-auto mt-5 inline-flex">
                <PlusCircle className="h-4 w-4" />
                {t('new')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="card glass-sheen group flex items-center gap-4 p-4 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.published ? (
                        p.visibility === 'private' ? (
                          <span className="badge badge-private">private</span>
                        ) : p.visibility === 'unlisted' ? (
                          <span className="badge badge-unlisted">unlisted</span>
                        ) : (
                          <span className="badge badge-public">published</span>
                        )
                      ) : (
                        <span className="badge badge-draft">draft</span>
                      )}
                      {p.category && (
                        <span
                          className="chip"
                          style={{
                            color: p.category.color || undefined,
                            borderColor: p.category.color
                              ? `${p.category.color}66`
                              : undefined,
                          }}
                        >
                          <Folder className="h-2.5 w-2.5" />
                          {p.category.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(
                          p.publishedAt || p.createdAt,
                          locale === 'zh' ? 'zh-CN' : 'en-US'
                        )}
                      </span>
                    </div>
                    <Link
                      href={`/notes/${p.id}/edit`}
                      className="mt-1.5 block truncate text-base font-bold transition group-hover:text-[hsl(var(--accent))]"
                    >
                      {p.title}
                    </Link>
                    {p.excerpt && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {p.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {p.published && p.visibility !== 'private' && (
                      <Link
                        href={`/posts/${p.slug}`}
                        className="btn-ghost h-9 w-9 p-0"
                        title={t('view')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    <Link
                      href={`/notes/${p.id}/edit`}
                      className="btn-ghost h-9 w-9 p-0"
                      title={t('edit')}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Link>
                    <DeletePostButton id={p.id} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
