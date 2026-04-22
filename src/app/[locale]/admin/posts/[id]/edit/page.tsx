import { redirect } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminEditRedirect({ params }: Props) {
  const { locale, id } = await params;
  redirect({ href: `/notes/${id}/edit`, locale });
}
