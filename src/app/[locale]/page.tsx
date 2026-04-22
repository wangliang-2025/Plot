import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { listPosts, listAllTags } from '@/lib/posts';
import { listCategories } from '@/lib/categories';
import { PostCard } from '@/components/post-card';
import { auth } from '@/lib/auth';
import {
  ArrowRight,
  Sparkles,
  Folder,
  Hash,
  PenLine,
  BookOpen,
  NotebookPen,
} from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');

  const [{ items: posts }, tags, cats, session] = await Promise.all([
    listPosts({ locale, pageSize: 6 }),
    listAllTags(),
    listCategories(),
    auth(),
  ]);

  const isLoggedIn = Boolean(session?.user?.id);
  const greetingName =
    session?.user?.name?.split('@')[0] || session?.user?.email?.split('@')[0] || '';

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            {isLoggedIn ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--aurora-1)/0.15)] to-[hsl(var(--aurora-3)/0.15)] px-3 py-1 text-xs font-medium text-[hsl(var(--accent))] backdrop-blur">
                <Sparkles className="h-3 w-3" />
                {t('welcome_back', { name: greetingName })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1 text-xs font-medium text-[hsl(var(--accent))] backdrop-blur dark:bg-white/5">
                <Sparkles className="h-3 w-3" />
                {process.env.NEXT_PUBLIC_SITE_NAME || 'Ink'}
              </span>
            )}

            <h1 className="mt-6 text-balance font-serif text-4xl font-bold tracking-tight md:text-7xl">
              <span className="gradient-text">{t('hero_title')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              {t('hero_subtitle')}
            </p>

            {isLoggedIn ? (
              /* 已登录：写笔记为主，我的笔记次之，浏览文章辅助 */
              <div className="mt-9 flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/notes/new" className="btn-accent h-11 px-6">
                    <PenLine className="h-4 w-4" />
                    {t('write_new')}
                  </Link>
                  <Link href="/notes" className="btn-secondary h-11 px-6">
                    <NotebookPen className="h-4 w-4" />
                    {t('my_notes')}
                  </Link>
                  <Link href="/posts" className="btn-ghost h-11 px-5">
                    <BookOpen className="h-4 w-4" />
                    {tNav('posts')}
                  </Link>
                </div>
              </div>
            ) : (
              /* 未登录：浏览文章 + 注册 */
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/posts" className="btn-accent h-11 px-6">
                  {tNav('posts')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/register" className="btn-secondary h-11 px-6">
                  {tNav('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest posts */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">
            {t('latest_posts')}
          </h2>
          <Link
            href="/posts"
            className="inline-flex items-center gap-1 text-sm text-[hsl(var(--accent))] hover:underline"
          >
            {t('view_all')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="card p-16 text-center text-muted-foreground">{t('no_posts')}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      {cats.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
              <Folder className="h-5 w-5 text-[hsl(var(--accent))]" />
              {t('explore_categories')}
            </h2>
            <Link
              href="/categories"
              className="text-sm text-[hsl(var(--accent))] hover:underline"
            >
              {t('view_all')}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cats.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="card card-hover group flex items-center gap-3 p-4"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl text-white shadow"
                  style={{
                    background: c.color
                      ? `linear-gradient(135deg, ${c.color}, ${c.color}cc)`
                      : 'linear-gradient(135deg, hsl(var(--aurora-1)), hsl(var(--aurora-3)))',
                  }}
                >
                  <Folder className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="card p-8">
            <h3 className="mb-5 flex items-center gap-2 font-serif text-xl font-bold">
              <Hash className="h-5 w-5 text-[hsl(var(--accent))]" />
              {t('popular_tags')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`} className="chip">
                  #{tag.name}
                  <span className="ml-1 text-[10px] opacity-60">{tag.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
