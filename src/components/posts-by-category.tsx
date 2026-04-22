'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Settings2,
  X,
  Calendar,
  Clock,
  MessageSquare,
  Hash,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { formatDate, readingTime, cn } from '@/lib/utils';

interface PostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  content: string;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  visibility: string;
  category?: {
    id: string;
    slug: string;
    name: string;
    color: string | null;
  } | null;
  tags: { tag: { name: string; slug: string } }[];
  _count?: { comments: number };
}

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  ownerId: string | null;
  count: number;
}

interface Props {
  initialCategories: CategoryItem[];
  posts: PostItem[];
  canManage: boolean;
}

const PRESET_COLORS = [
  '#7c5cff',
  '#5c8aff',
  '#5cd6ff',
  '#5cffaa',
  '#ffd45c',
  '#ff7c5c',
  '#ff5c9e',
  '#b35cff',
];

const STORAGE_KEY = 'posts-expanded-groups';

export function PostsByCategory({
  initialCategories,
  posts,
  canManage,
}: Props) {
  const t = useTranslations('posts');
  const tPost = useTranslations('post');
  const tCat = useTranslations('categories');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [manageOpen, setManageOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const arr = JSON.parse(saved) as string[];
        if (Array.isArray(arr)) setExpanded(new Set(arr));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(expanded))
      );
    } catch {}
  }, [expanded]);

  const groups = useMemo(() => {
    const byCategoryId = new Map<string, PostItem[]>();
    const uncategorized: PostItem[] = [];

    for (const p of posts) {
      if (p.category?.id) {
        const list = byCategoryId.get(p.category.id) ?? [];
        list.push(p);
        byCategoryId.set(p.category.id, list);
      } else {
        uncategorized.push(p);
      }
    }

    const groupIdsSet = new Set<string>(categories.map((c) => c.id));
    for (const id of byCategoryId.keys()) groupIdsSet.add(id);

    const categoryIndex = new Map<string, CategoryItem>(
      categories.map((c) => [c.id, c])
    );

    for (const p of posts) {
      if (p.category?.id && !categoryIndex.has(p.category.id)) {
        categoryIndex.set(p.category.id, {
          id: p.category.id,
          slug: p.category.slug,
          name: p.category.name,
          color: p.category.color,
          description: null,
          ownerId: null,
          count: byCategoryId.get(p.category.id)?.length ?? 0,
        });
      }
    }

    const list = Array.from(groupIdsSet)
      .map((id) => {
        const cat = categoryIndex.get(id)!;
        const list = byCategoryId.get(id) ?? [];
        return { category: cat, posts: list };
      })
      .sort((a, b) => {
        if (b.posts.length !== a.posts.length) return b.posts.length - a.posts.length;
        return a.category.name.localeCompare(b.category.name);
      });

    return { list, uncategorized };
  }, [categories, posts]);

  const allGroupKeys = useMemo(() => {
    const keys = groups.list.map((g) => g.category.id);
    if (groups.uncategorized.length > 0) keys.push('__uncategorized__');
    return keys;
  }, [groups]);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(allGroupKeys));
  const collapseAll = () => setExpanded(new Set());

  const create = () => {
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            color,
          }),
        });
        if (!res.ok) {
          setError('Create failed');
          return;
        }
        const { category } = (await res.json()) as {
          category: Omit<CategoryItem, 'count'>;
        };
        setCategories((prev) => [...prev, { ...category, count: 0 }]);
        setName('');
        setDescription('');
        setColor(PRESET_COLORS[0]);
        setCreating(false);
        router.refresh();
      } catch {
        setError('Create failed');
      }
    });
  };

  const remove = (id: string) => {
    if (!confirm(tCat('delete_confirm'))) return;
    startTransition(async () => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    });
  };

  const hasAny =
    groups.list.some((g) => g.posts.length > 0) ||
    groups.uncategorized.length > 0;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="btn-ghost h-9 text-xs"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            {t('expand_all')}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="btn-ghost h-9 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            {t('collapse_all')}
          </button>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link href="/notes/new" className="btn-accent h-9">
              <PenLine className="h-3.5 w-3.5" />
              {tHome('write_new')}
            </Link>
            <button
              type="button"
              onClick={() => setManageOpen((v) => !v)}
              className={cn(
                'btn-secondary h-9',
                manageOpen && 'bg-white/70 dark:bg-white/10'
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {manageOpen ? t('close_manager') : t('manage_categories')}
            </button>
          </div>
        )}
      </div>

      {/* Inline category manager */}
      {canManage && manageOpen && (
        <div className="card glass-strong space-y-4 p-5">
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold">
              <Settings2 className="h-4 w-4 text-[hsl(var(--accent))]" />
              {t('manage_categories')}
            </h2>
          </header>

          {categories.length > 0 && (
            <div className="space-y-1 rounded-xl bg-white/30 p-2 dark:bg-white/5">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                    style={{
                      background: c.color
                        ? `linear-gradient(135deg, ${c.color}, ${c.color}cc)`
                        : 'hsl(var(--accent))',
                    }}
                  >
                    <Folder className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    {c.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {c.count}
                  </span>
                  {c.ownerId && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      disabled={isPending}
                      className="btn-ghost h-8 w-8 p-0 text-destructive opacity-0 transition group-hover:opacity-100"
                      title={tCat('delete_confirm')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {creating ? (
            <div className="space-y-3 rounded-xl bg-white/40 p-4 dark:bg-white/5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tCat('name')}
                className="input"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tCat('description')}
                className="textarea min-h-[60px]"
              />
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  {tCat('color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="h-8 w-8 rounded-full border-2 transition hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${c}, ${c}cc)`,
                        borderColor:
                          color === c ? 'hsl(var(--foreground))' : 'transparent',
                      }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="btn-ghost"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="button"
                  onClick={create}
                  disabled={isPending || !name.trim()}
                  className="btn-accent"
                >
                  <Save className="h-4 w-4" />
                  {tCommon('create')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="card card-hover flex w-full items-center justify-center gap-2 p-3 text-sm font-medium text-muted-foreground transition hover:text-[hsl(var(--accent))]"
            >
              <Plus className="h-4 w-4" />
              {tCat('create')}
            </button>
          )}
        </div>
      )}

      {/* Groups */}
      {!hasAny ? (
        <div className="card p-16 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--accent))]" />
          <p className="text-muted-foreground">{t('no_posts')}</p>
          {canManage && (
            <Link href="/notes/new" className="btn-accent mx-auto mt-5 inline-flex">
              <PenLine className="h-4 w-4" />
              {t('write_first')}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.list.map((g) => {
            const key = g.category.id;
            const isOpen = expanded.has(key);
            return (
              <CategoryPanel
                key={key}
                open={isOpen}
                onToggle={() => toggle(key)}
                name={g.category.name}
                description={g.category.description}
                color={g.category.color}
                count={g.posts.length}
                posts={g.posts}
                locale={locale}
                tPost={tPost}
                tPosts={t}
              />
            );
          })}

          {groups.uncategorized.length > 0 && (
            <CategoryPanel
              open={expanded.has('__uncategorized__')}
              onToggle={() => toggle('__uncategorized__')}
              name={t('uncategorized')}
              description={null}
              color={null}
              count={groups.uncategorized.length}
              posts={groups.uncategorized}
              locale={locale}
              tPost={tPost}
              tPosts={t}
              dashed
            />
          )}
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  open: boolean;
  onToggle: () => void;
  name: string;
  description: string | null;
  color: string | null;
  count: number;
  posts: PostItem[];
  locale: string;
  tPost: ReturnType<typeof useTranslations<'post'>>;
  tPosts: ReturnType<typeof useTranslations<'posts'>>;
  dashed?: boolean;
}

function CategoryPanel({
  open,
  onToggle,
  name,
  description,
  color,
  count,
  posts,
  locale,
  tPost,
  tPosts,
  dashed,
}: PanelProps) {
  return (
    <section
      className={cn(
        'card overflow-hidden transition-all',
        dashed && 'border-dashed'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'group flex w-full items-center gap-4 px-5 py-4 text-left transition',
          'hover:bg-white/40 dark:hover:bg-white/5'
        )}
        aria-expanded={open}
      >
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-md transition-transform group-hover:scale-105"
          style={{
            background: color
              ? `linear-gradient(135deg, ${color}, ${color}cc)`
              : 'linear-gradient(135deg, hsl(var(--aurora-1)), hsl(var(--aurora-3)))',
          }}
        >
          {open ? (
            <FolderOpen className="h-5 w-5" />
          ) : (
            <Folder className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-serif text-lg font-bold">{name}</h3>
            <span
              className="chip"
              style={{
                color: color || undefined,
                borderColor: color ? `${color}66` : undefined,
              }}
            >
              {tPosts('post_count', { count })}
            </span>
          </div>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="border-t border-white/40 px-5 py-4 dark:border-white/10">
          {posts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {tPosts('no_posts_in_category')}
            </p>
          ) : (
            <ul className="divide-y divide-white/40 dark:divide-white/10">
              {posts.map((p) => (
                <li key={p.id}>
                  <PostRow post={p} locale={locale} tPost={tPost} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function PostRow({
  post,
  locale,
  tPost,
}: {
  post: PostItem;
  locale: string;
  tPost: ReturnType<typeof useTranslations<'post'>>;
}) {
  const date = post.publishedAt || post.createdAt;
  const minutes = readingTime(post.content);
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex gap-4 py-3 transition"
    >
      {post.coverImage && (
        <div className="relative hidden aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-xl sm:block">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-base font-bold leading-snug transition group-hover:text-[hsl(var(--accent))]">
          {post.title}
        </h4>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(dateObj, locale === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tPost('reading_time', { minutes })}
          </span>
          {post._count && post._count.comments > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post._count.comments}
            </span>
          )}
          {post.tags.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-1">
              <Hash className="h-3 w-3" />
              {post.tags.slice(0, 3).map(({ tag }) => (
                <span key={tag.slug} className="opacity-80">
                  {tag.name}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
