import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { listPosts } from '@/lib/posts';
import { formatDateShort } from '@/lib/utils';
import { PlusCircle, Edit3, Eye } from 'lucide-react';
import { DeletePostButton } from '@/components/delete-post-button';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const { items } = await listPosts({ pageSize: 200, includeAll: true });

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">{t('posts')}</h1>
        <Link href="/notes/new" className="btn-accent h-9">
          <PlusCircle className="h-3.5 w-3.5" /> {t('new_post')}
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground">{t('no_posts')}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/30 bg-white/30 text-left text-xs uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">{t('posts')}</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/30 dark:border-white/5 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/notes/${p.id}/edit`}
                      className="font-medium hover:text-[hsl(var(--accent))]"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.author?.displayName || p.author?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!p.published ? (
                      <span className="badge badge-draft">draft</span>
                    ) : p.visibility === 'private' ? (
                      <span className="badge badge-private">private</span>
                    ) : p.visibility === 'unlisted' ? (
                      <span className="badge badge-unlisted">unlisted</span>
                    ) : (
                      <span className="badge badge-public">published</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateShort(
                      p.publishedAt || p.createdAt,
                      locale === 'zh' ? 'zh-CN' : 'en-US'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.published && p.visibility !== 'private' && (
                        <Link
                          href={`/posts/${p.slug}`}
                          className="btn-ghost h-8 w-8 p-0"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <Link
                        href={`/notes/${p.id}/edit`}
                        className="btn-ghost h-8 w-8 p-0"
                        title={t('edit')}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Link>
                      <DeletePostButton id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
