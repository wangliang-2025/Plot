import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Github, Rss, Sparkles } from 'lucide-react';

export function SiteFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  const name = process.env.NEXT_PUBLIC_SITE_NAME || 'Ink';
  const githubUser = process.env.NEXT_PUBLIC_GITHUB_USERNAME?.trim();

  return (
    <footer className="mt-24 px-4 pb-8">
      <div className="container mx-auto">
        <div className="glass rounded-3xl px-8 py-10">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="font-serif text-base font-bold gradient-text">{name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('built_with')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('rights', { year, name })}
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-1">
              <Link href="/about" className="btn-ghost h-9">
                About
              </Link>
              <Link href="/posts" className="btn-ghost h-9">
                Posts
              </Link>
              <Link href="/me" className="btn-ghost h-9">
                <Github className="h-3.5 w-3.5" />
                <span>GitHub</span>
              </Link>
              <a href="/feed.xml" className="btn-ghost h-9" aria-label={t('rss')}>
                <Rss className="h-3.5 w-3.5" />
                <span>RSS</span>
              </a>
              {githubUser && (
                <a
                  href={`https://github.com/${githubUser}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost h-9 w-9 p-0"
                  aria-label="GitHub"
                  title={`github.com/${githubUser}`}
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
              )}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
