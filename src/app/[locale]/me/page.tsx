import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  Sparkles,
  Star,
  GitBranch,
  FolderOpen,
  AlertTriangle,
  Github,
} from 'lucide-react';
import { safeGetGithubProfile, type GitHubRepo } from '@/lib/github';
import { GithubProfileCard } from '@/components/github-profile-card';
import { GithubRepoCard } from '@/components/github-repo-card';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'me' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function MePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('me');

  const result = await safeGetGithubProfile();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Page header */}
      <header className="mb-10 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1 text-xs font-medium text-[hsl(var(--accent))] backdrop-blur dark:bg-white/5">
          <Sparkles className="h-3 w-3" />
          {t('badge')}
        </span>
        <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight md:text-5xl">
          <span className="gradient-text">{t('title')}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>

      {/* Unconfigured state */}
      {!result.ok && result.reason === 'unconfigured' && (
        <div className="card glass p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-foreground/5 text-foreground">
            <Github className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold">{t('unconfigured_title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('unconfigured_hint')}</p>
          <pre className="mx-auto mt-4 inline-block rounded-xl bg-white/50 px-4 py-2 text-left text-xs font-mono shadow-inner dark:bg-white/5">
            <span className="text-muted-foreground"># .env</span>
            {'\n'}NEXT_PUBLIC_GITHUB_USERNAME=
            <span className="text-[hsl(var(--accent))]">your-username</span>
          </pre>
        </div>
      )}

      {/* Fetch failure state */}
      {!result.ok && result.reason === 'fetch_failed' && (
        <div className="card glass p-10">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl font-bold">{t('fetch_failed_title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('fetch_failed_hint', { username: result.username })}
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {t('show_error')}
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-white/50 p-3 text-[11px] font-mono text-muted-foreground dark:bg-white/5">
                  {result.error}
                </pre>
              </details>
              <div className="mt-4">
                <a
                  href={`https://github.com/${result.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-accent h-10"
                >
                  <Github className="h-4 w-4" />
                  {t('open_github_directly')}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Happy path */}
      {result.ok && (
        <>
          <GithubProfileCard user={result.data.user} />

          <RepoSection repos={result.data.repos} t={t} />
        </>
      )}
    </div>
  );
}

function RepoSection({
  repos,
  t,
}: {
  repos: GitHubRepo[];
  t: Awaited<ReturnType<typeof getTranslations<'me'>>>;
}) {
  // Featured: top 6 by stars; the rest go into a secondary grid.
  const sortedByStar = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count
  );
  const featured = sortedByStar.slice(0, 6);
  const featuredIds = new Set(featured.map((r) => r.id));
  const rest = repos.filter((r) => !featuredIds.has(r.id));

  if (repos.length === 0) {
    return (
      <section className="mt-10">
        <div className="card p-12 text-center text-muted-foreground">
          <FolderOpen className="mx-auto h-10 w-10 opacity-40" />
          <p className="mt-3 text-sm">{t('no_repos')}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
            <Star className="h-5 w-5 text-[hsl(var(--accent))]" />
            {t('featured_repos')}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t('repo_count', { count: repos.length })}
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((r) => (
            <GithubRepoCard key={r.id} repo={r} />
          ))}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 flex items-center gap-2 font-serif text-2xl font-bold">
            <GitBranch className="h-5 w-5 text-[hsl(var(--accent))]" />
            {t('other_repos')}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((r) => (
              <GithubRepoCard key={r.id} repo={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
