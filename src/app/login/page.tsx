import { LoginForm } from '@/components/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string }>;
}) {
  const { next, error, reason } = await searchParams;
  const initialNotice =
    reason === 'inactivity'
      ? 'You have been logged out after 12 hours of inactivity in this browser.'
      : undefined;

  return (
    <LoginForm
      nextPath={next}
      initialError={
        error === 'auth-callback'
          ? 'This sign-in link is invalid or has expired. Ask an administrator to resend the invitation.'
          : undefined
      }
      initialNotice={initialNotice}
    />
  );
}
