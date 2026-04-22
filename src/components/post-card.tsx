import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { formatDate, readingTime } from '@/lib/utils';
import { Calendar, Clock, MessageSquare, Folder, Lock, EyeOff } from 'lucide-react';

interface PostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    visibility: string;
    content: string;
    category?: { name: string; slug: string; color: string | null } | null;
    tags: { tag: { name: string; slug: string } }[];
    _count?: { comments: number };
  };
}

export function PostCard({ post }: PostCardProps) {
  const locale = useLocale();
  const t = useTranslations('post');
  const date = post.publishedAt || post.createdAt;
  const minutes = readingTime(post.content);

  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden">
      {post.coverImage && (
        <Link
          href={`/posts/${post.slug}`}
          className="relative block aspect-[16/9] overflow-hidden"
        >
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700"
            style={{ transitionTimingFunction: 'var(--ease-fluid)' }}
            onLoad={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.category && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition"
              style={{
                background: post.category.color
                  ? `${post.category.color}22`
                  : 'hsl(var(--accent) / 0.12)',
                color: post.category.color || 'hsl(var(--accent))',
              }}
            >
              <Folder className="h-3 w-3" />
              {post.category.name}
            </Link>
          )}
          {post.visibility === 'private' && (
            <span className="badge badge-private">
              <Lock className="h-2.5 w-2.5" />
              private
            </span>
          )}
          {post.visibility === 'unlisted' && (
            <span className="badge badge-unlisted">
              <EyeOff className="h-2.5 w-2.5" />
              unlisted
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(date, locale === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('reading_time', { minutes })}
          </span>
          {post._count && post._count.comments > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post._count.comments}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-xl font-bold leading-tight tracking-tight">
          <Link
            href={`/posts/${post.slug}`}
            className="bg-gradient-to-r from-foreground to-foreground bg-[length:0%_2px] bg-bottom bg-no-repeat transition-all hover:bg-[length:100%_2px] group-hover:text-[hsl(var(--accent))]"
            style={{ transitionDuration: 'var(--dur-fluid)' }}
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map(({ tag }) => (
              <Link key={tag.slug} href={`/tags/${tag.slug}`} className="chip">
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
