export const boostNames = { COMMISSION: 'Commission Boost', DISCOUNT: 'Discount Boost', SUPER_DISCOUNT: 'Super Discount Boost' };
export type BoostType = keyof typeof boostNames;
export interface BoostPolicy { additional: number; quota: number; durationHours: number; available: boolean; maxTransactions: number | null }
export interface Config { discount: number; commission: number; boosts: Record<BoostType, BoostPolicy> }
export interface Boost { id: string; type: BoostType; group: string; baseRate: number; additional: number; activatedAt: string; expiresAt: string; maxTransactions: number | null; successfulTransactions: number; reservedTransactions: number; impact: number }
export interface Quota { id: string; type: BoostType; month: string; allocated: number; bonus: number; used: number }
export interface Transaction { id: string; createdAt: string; reference: string; product: string; code: string; originalAmount: number; discountAmount: number; paidAmount: number; commissionRate: number; commission: number; earned: number; commissionStatus: string; boostIds: string[]; refundTotal: number }
export interface ReferralCode { id: string; code: string; isActive: boolean; expiresAt: string | null; successfulUsage: number; sales: number; earnings: number }
export interface Payout { id: string; amount: number; paidAt: string; reference: string; status: string; notes?: string }
export interface Agreement { id: string; title: string; version: number; content: string; party: string; summary: string; status: string; effectiveAt: string | null; requiresAcceptance: boolean }
export interface Acceptance { id: string; agreementId: string; version: number; acceptedAt: string; snapshot: string; contentHash: string; status: string }
export interface AgreementState {
  member: { id: string; name: string; identifier: string }; current: Agreement | null;
  preview: { content: string; hash: string; config: Config } | null; required: boolean; history: Acceptance[];
  upcoming: Agreement[]; serverTime: string;
}
export interface AffiliateReport {
  profile: { id: string; name: string; identifier: string; isActive: boolean; config: Config; serverTime: string; nextReset: string };
  totals: { successfulReferrals: number; generatedSales: number; earned: number; pending: number; paid: number; reservedPayout: number; outstanding: number };
  transactions: Transaction[]; codes: ReferralCode[]; quotas: Quota[]; boosts: Boost[]; payouts: Payout[];
  trend: Array<{ day: string; commission: number }>;
  terms: Array<{ id: string; config: Config; effectiveAt: string; agreementId: string | null }>;
  agreementStatus: Array<{ id: string; version: number; effectiveAt: string; acceptedAt: string | null; snapshot: string | null; contentHash: string | null }>;
  pagination: { offset: number; limit: number; hasMore: boolean };
  audit?: Array<{ id: string; event: string; actorId: string; createdAt: string; after: unknown }>;
}
export interface AffiliateListItem { id: string; name: string; identifier: string; isActive: boolean; config: Config; earned: number; paid: number; referrals: number; sales: number; agreementAccepted: boolean }
export const money = (amount: number) => new Intl.NumberFormat('id-ID',{ style: 'currency',currency: 'IDR',maximumFractionDigits: 0 }).format(amount);
export const dateTime = (date: string) => new Intl.DateTimeFormat('id-ID',{ dateStyle: 'medium',timeStyle: 'short',timeZone: 'Asia/Jakarta' }).format(new Date(date));
export const percent = (bps: number) => `${bps / 100}%`;
export function effectiveRates(report: AffiliateReport, now: number) {
  const active = report.boosts.filter(b => new Date(b.expiresAt).getTime()>now && (b.maxTransactions === null || b.reservedTransactions < b.maxTransactions));
  const commission = active.find(b => b.group==='COMMISSION');
  const discount = active.find(b => b.group==='DISCOUNT');
  return { commission: commission ? commission.baseRate+commission.additional : report.profile.config.commission,
    discount: discount ? discount.baseRate+discount.additional : report.profile.config.discount };
}
