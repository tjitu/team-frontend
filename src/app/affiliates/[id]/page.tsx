import { AffiliateAdminDetail } from '@/components/affiliate/admin-detail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AffiliateAdminDetail id={id} />;
}
