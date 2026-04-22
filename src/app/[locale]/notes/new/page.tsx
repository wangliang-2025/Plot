import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { listCategories } from '@/lib/categories';
import { PostEditor } from '@/components/post-editor';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NewNotePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect({ href: '/login', locale });

  const t = await getTranslations('notes');
  const tEditor = await getTranslations('editor');
  const cats = await listCategories({ ownerId: session!.user.id, includeOwnerless: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/notes" className="btn-ghost mb-6 h-9">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('back')}
      </Link>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold gradient-text">{t('new')}</h1>
      </header>
      <PostEditor initial={{ locale }} categories={cats} />
    </div>
  );
}
