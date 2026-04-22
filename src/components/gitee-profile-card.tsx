import { useTranslations } from 'next-intl';
import { ExternalLink, Calendar, Users, BookOpen, Star } from 'lucide-react';
import { GiteeIcon } from './icons/gitee';
import type { GiteeUser } from '@/lib/gitee';

interface Props {
  user: GiteeUser;
}

export function GiteeProfileCard({ user }: Props) {
  const t = useTranslations('me');
  const joined = new Date(user.created_at).getFullYear();

  return (
    <section className="card glass relative overflow-hidden p-8 sm:p-10">
      {/* 装饰渐变光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--aurora-1) / 0.7), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--aurora-3) / 0.6), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-3))] opacity-70 blur" />
          <img
            src={user.avatar_url}
            alt={user.name || user.login}
            className="relative h-24 w-24 rounded-3xl object-cover shadow-lg ring-2 ring-white/60 dark:ring-white/10 sm:h-28 sm:w-28"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              {user.name || user.login}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C71D23]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#C71D23]">
              <GiteeIcon size={12} brand />
              @{user.login}
            </span>
          </div>

          {user.bio && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {user.blog && (
              <a
                href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-[hsl(var(--accent))]"
              >
                <ExternalLink className="h-3 w-3" />
                {user.blog.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t('joined_in', { year: joined })}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={user.html_url}
              target="_blank"
              rel="noreferrer"
              className="btn-accent h-10"
            >
              <GiteeIcon size={14} />
              {t('view_on_gitee')}
            </a>
          </div>
        </div>

        {/* 数字仪表盘 */}
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex-shrink-0">
          <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label={t('repos')} value={user.public_repos} />
          <Stat icon={<Users className="h-3.5 w-3.5" />} label={t('followers')} value={user.followers} />
          <Stat icon={<Star className="h-3.5 w-3.5" />} label={t('stars')} value={user.stared} />
        </div>
      </div>

    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/40 p-3 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold gradient-text">{value}</div>
    </div>
  );
}
