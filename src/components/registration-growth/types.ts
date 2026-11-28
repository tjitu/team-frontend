export type VerificationStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
export type SocialItem = 'follow' | 'likeTag' | 'story';
export type AdminItem = 'follow' | 'like' | 'tag' | 'story' | 'mention';
export interface GrowthConfig {
  enabled: boolean; manualVerification: boolean; profileUrl: string; campaignUrl: string;
  items: Record<SocialItem, { enabled: boolean; required: boolean }>;
  mentionRequired: boolean;
  prize: { enabled: boolean; winners: number; type: string; info: string };
  community: { enabled: boolean; url: string };
}
export interface GrowthConfiguration { config: GrowthConfig; version: number }
export interface VerificationRow {
  id: string; userId: string; name: string; email: string; instagramUsername: string | null;
  status: VerificationStatus; submittedAt: string; version: number; approvalMethod: string | null;
  storyEnabled: boolean; storyChecked: boolean;
}
export interface VerificationDetail extends VerificationRow {
  submittedChecklist: Partial<Record<SocialItem, boolean>>;
  adminChecklist: Partial<Record<AdminItem, boolean>>;
  configSnapshot: GrowthConfig; verifiedAt: string | null; verifiedBy: string | null;
  rejectionReasons: string[];
}
export interface VerificationHistory {
  id: string; action: string; actorId: string; createdAt: string;
  after: { status: VerificationStatus; rejectionReasons: string[]; instagramUsername: string | null };
}
export interface VerificationQueue {
  items: VerificationRow[]; summary: { total: number; pending: number; approved: number; rejected: number };
  page: number; limit: number;
}
export const statusLabels: Record<VerificationStatus, string> = {
  PENDING_VERIFICATION: 'Menunggu verifikasi', APPROVED: 'Disetujui', REJECTED: 'Ditolak',
};
export const rejectionOptions = [
  'Belum follow Instagram @jituptn.', 'Belum like postingan tryout.', 'Belum tag 3 teman.',
  'Belum share ke Instagram Story.', 'Belum mention @jituptn.', 'Username Instagram tidak ditemukan.',
  'Aktivitas Instagram tidak dapat diverifikasi.',
];
export const formatGrowthDate = (value: string) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
}).format(new Date(value));
export function verificationItems(config: GrowthConfig): Array<{ key: AdminItem; label: string; required: boolean }> {
  const result: Array<{ key: AdminItem; label: string; required: boolean }> = [];
  if (config.items.follow.enabled) result.push({ key: 'follow', label: 'Follow Instagram @jituptn', required: config.items.follow.required });
  if (config.items.likeTag.enabled) result.push(
    { key: 'like', label: 'Like postingan kampanye', required: config.items.likeTag.required },
    { key: 'tag', label: 'Tag 3 teman di postingan kampanye', required: config.items.likeTag.required });
  if (config.items.story.enabled) {
    result.push({ key: 'story', label: 'Share postingan kampanye ke Instagram Story', required: config.items.story.required });
    if (config.mentionRequired) result.push({ key: 'mention', label: 'Mention @jituptn di Instagram Story', required: config.items.story.required });
  }
  return result;
}
