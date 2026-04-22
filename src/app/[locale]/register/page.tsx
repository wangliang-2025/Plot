import { setRequestLocale } from 'next-intl/server';
import { RegisterForm } from '@/components/register-form';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-prose flex min-h-[70vh] items-center justify-center py-16">
      <RegisterForm />
    </div>
  );
}
