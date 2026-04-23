import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { NotesImportForm } from '@/components/notes-import-form';
import { ArrowLeft, Upload } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function NotesImportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect({ href: '/login', locale });

  const t = await getTranslations('notes');

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link href="/notes" className="btn-ghost mb-6 h-9">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('back')}
      </Link>
      <header className="mb-8">
        <h1 className="flex items-center gap-3 font-serif text-3xl font-bold gradient-text">
          <Upload className="h-6 w-6 text-[hsl(var(--accent))]" />
          {t('import_md')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('import_subtitle')}</p>
      </header>

      <NotesImportForm locale={locale} />
    </div>
  );
}
