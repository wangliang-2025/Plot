import { useTranslations, useLocale } from 'next-intl';
import {
  Star,
  GitFork,
  Lock,
  GitBranch,
  ExternalLink,
  Archive,
  CircleDot,
  Tag as TagIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { languageColor, type GitHubRepo } from '@/lib/github';

interface Props {
  repo: GitHubRepo;
}

export function GithubRepoCard({ repo }: Props) {
  const t = useTranslations('me');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  const topics = (repo.topics ?? []).slice(0, 4);

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${repo.full_name} on GitHub`}
      className="card card-hover group relative flex h-full flex-col overflow-hidden p-5"
    >
      {/* Accent bar reveals on hover */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${languageColor(repo.language)}, hsl(var(--aurora-1)), hsl(var(--aurora-3)))`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow"
            style={{
              background: `linear-gradient(135deg, ${languageColor(repo.language)}, ${languageColor(repo.language)}cc)`,
            }}
          >
            <GitBranch className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold tracking-tight transition-colors group-hover:text-[hsl(var(--accent))]">
              {repo.name}
            </h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {repo.full_name}
            </p>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {repo.description ? (
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {repo.description}
        </p>
      ) : (
        <p className="mt-3 line-clamp-2 flex-1 text-sm italic text-muted-foreground/60">
          {t('no_description')}
        </p>
      )}

      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--accent)/0.1)] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--accent))]"
            >
              <TagIcon className="h-2.5 w-2.5" />
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {repo.language && (
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: languageColor(repo.language) }}
            />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3" />
          {repo.stargazers_count}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          {repo.forks_count}
        </span>
        {repo.open_issues_count > 0 && (
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3" />
            {repo.open_issues_count}
          </span>
        )}
        {repo.private && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
            <Lock className="h-2.5 w-2.5" />
            {t('private_repo')}
          </span>
        )}
        {repo.archived && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-1.5 py-0.5 text-zinc-600 dark:text-zinc-400">
            <Archive className="h-2.5 w-2.5" />
            {t('archived_repo')}
          </span>
        )}
        {repo.fork && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-violet-600 dark:text-violet-400">
            fork
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/80">
        <span>
          {t('updated_on', {
            date: formatDate(
              new Date(repo.pushed_at || repo.updated_at),
              dateLocale
            ),
          })}
        </span>
        {repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' && (
          <span className="rounded bg-white/40 px-1.5 py-0.5 dark:bg-white/5">
            {repo.license.spdx_id}
          </span>
        )}
      </div>
    </a>
  );
}
