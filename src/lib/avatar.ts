/**
 * Deterministic Cartoon People Avatars (DiceBear Open-Peeps / Adventurer / Lorelei)
 * Generates fun, friendly illustrated character avatars for users across the platform.
 */

export type CartoonStyle = 'open-peeps' | 'adventurer' | 'lorelei' | 'personas';

const PASTEL_PALETTE = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'd5f4e6', 'fed7aa'];

export function getCartoonAvatarUrl(
  seed: string | null | undefined,
  style: CartoonStyle = 'open-peeps'
): string {
  const cleanSeed = encodeURIComponent((seed || 'jitu-student').trim().toLowerCase());
  const bg = PASTEL_PALETTE.join(',');
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${cleanSeed}&backgroundColor=${bg}`;
}

