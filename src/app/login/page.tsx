import { LoginForm } from '@/components/login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <LoginForm nextPath={next} initialError={error === 'auth-callback' ? 'This sign-in link is invalid or has expired. Ask an administrator to resend the invitation.' : undefined} />;
}
