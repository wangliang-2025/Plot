'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Menu, X, Search, Sparkles, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: t('home') },
    { href: '/posts', label: t('posts') },
    { href: '/categories', label: t('categories') },
    { href: '/tags', label: t('tags') },
    { href: '/me', label: t('me') },
    { href: '/about', label: t('about') },
  ] as const;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all',
        scrolled ? 'py-2' : 'py-3'
      )}
      style={{ transitionDuration: 'var(--dur-fluid)', transitionTimingFunction: 'var(--ease-fluid)' }}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'glass flex items-center justify-between gap-3 px-4 py-2.5',
            scrolled ? 'rounded-full' : 'rounded-2xl'
          )}
          style={{ transitionProperty: 'border-radius, padding' }}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 px-1 text-base font-bold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))] text-white shadow-md shadow-[hsl(var(--aurora-1)/0.4)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg gradient-text">
              {process.env.NEXT_PUBLIC_SITE_NAME || 'Ink'}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm transition',
                  'hover:bg-white/40 dark:hover:bg-white/5',
                  isActive(l.href) &&
                    'bg-white/60 dark:bg-white/10 text-[hsl(var(--accent))] font-medium shadow-inner'
                )}
                style={{ transitionDuration: 'var(--dur-snap)', transitionTimingFunction: 'var(--ease-fluid)' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/search"
              aria-label={t('search')}
              className="btn-ghost h-9 w-9 p-0"
            >
              <Search className="h-4 w-4" />
            </Link>
            <ThemeToggle />
            <LocaleSwitcher />

            {session ? (
              <Link
                href="/notes"
                className="btn-secondary hidden h-9 sm:inline-flex"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">
                  {session.user.name?.split('@')[0] || t('admin')}
                </span>
              </Link>
            ) : (
              <Link href="/login" className="btn-accent hidden h-9 sm:inline-flex">
                {t('login')}
              </Link>
            )}

            <button
              onClick={() => setOpen((v) => !v)}
              className="btn-ghost h-9 w-9 p-0 md:hidden"
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="container mx-auto mt-2 px-4 md:hidden">
          <nav className="glass flex flex-col gap-0.5 rounded-2xl p-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5',
                  isActive(l.href) && 'bg-white/60 dark:bg-white/10 text-[hsl(var(--accent))]'
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="my-1 border-t border-white/30 dark:border-white/10" />
            {session ? (
              <Link
                href="/notes"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5"
              >
                {t('notes')}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
