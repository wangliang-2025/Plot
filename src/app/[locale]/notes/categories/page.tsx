import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { listCategories } from '@/lib/categories';
import { CategoryManager } from '@/components/category-manager';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ManageCategoriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect({ href: '/login', locale });

  const t = await getTranslations('categories');
  const tNotes = await getTranslations('notes');
  const cats = await listCategories({ ownerId: session!.user.id, includeOwnerless: true });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link href="/notes" className="btn-ghost mb-6 h-9">
        <ArrowLeft className="h-3.5 w-3.5" />
        {tNotes('back')}
      </Link>
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold gradient-text">{t('manage')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <CategoryManager initial={cats} />
    </div>
  );
}
