import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProfileForm } from '@/components/profile-form';
import { PasswordForm } from '@/components/password-form';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      bio: true,
      website: true,
      location: true,
      image: true,
      role: true,
    },
  });
  if (!user) redirect({ href: '/login', locale });

  const t = await getTranslations('profile');

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-bold gradient-text">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="space-y-6">
        <ProfileForm initial={user!} />
        <PasswordForm />
      </div>
    </div>
  );
}
