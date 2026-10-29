import { LoginForm } from '@/components/login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <LoginForm nextPath={next} initialError={error === 'auth-callback' ? 'Tautan masuk tidak valid atau sudah kedaluwarsa. Minta admin mengirim ulang undangan.' : undefined} />;
}
