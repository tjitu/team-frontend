import { InvitationAcceptance } from '@/components/invitation-acceptance';

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string; completed?: string }> }) {
  const params = await searchParams;
  return <InvitationAcceptance token={params.token ?? null} completed={params.completed === '1'} />;
}
