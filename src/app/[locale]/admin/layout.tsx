import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { LayoutDashboard, FileText, Upload, Users, LogOut } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect({ href: '/login', locale });
  }
  const safeSession = session!;

  const t = await getTranslations('admin');

  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="card glass p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('dashboard')}
          </p>
          <nav className="flex flex-col gap-0.5">
            <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5">
              <LayoutDashboard className="h-4 w-4" /> {t('dashboard')}
            </Link>
            <Link href="/admin/posts" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5">
              <FileText className="h-4 w-4" /> {t('posts')}
            </Link>
            <Link href="/admin/upload" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5">
              <Upload className="h-4 w-4" /> {t('upload_md')}
            </Link>
            <div className="my-1 border-t border-white/30 dark:border-white/10" />
            <Link href="/notes" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5">
              <Users className="h-4 w-4" /> My notes
            </Link>
            <SignOutButton />
          </nav>
          <div className="mt-3 border-t border-white/30 px-3 pt-3 text-xs text-muted-foreground dark:border-white/10">
            <p className="truncate font-medium text-foreground">
              {safeSession.user.name || safeSession.user.email}
            </p>
            <p className="truncate">{safeSession.user.email}</p>
          </div>
        </div>
      </aside>

      <section className="min-w-0">{children}</section>
    </div>
  );
}
