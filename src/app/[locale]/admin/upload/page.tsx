import { setRequestLocale, getTranslations } from 'next-intl/server';
import { UploadForm } from '@/components/upload-form';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function UploadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold">{t('upload_md')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('upload_help')}</p>
      </header>
      <UploadForm locale={locale} />
    </div>
  );
}
