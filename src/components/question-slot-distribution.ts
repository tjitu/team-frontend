import { supportsNumericSlot } from './question-import-answers';
import type { AutoBalanceSlot } from './question-lifecycle-types';

type Shares = { easyShare: number; mediumShare: number; hardShare: number };
type Target = { key: AutoBalanceSlot['difficulty']; share: number; target: number; used: number };

/** Balance each new subtest batch and distribute its slots throughout the sequence. */
export function balanceSlotDistributions(
  slots: AutoBalanceSlot[],
  subtests: Record<string, { count: number }>,
  existingShort: Map<string, number>,
  shares: Shares,
  shortPercent: number,
) {
  for (const [subtest, existing] of Object.entries(subtests)) {
    const group = slots.filter((slot) => slot.subtest === subtest);
    const targets: Target[] = [
      { key: 'EASY', share: shares.easyShare, target: 0, used: 0 },
      { key: 'MEDIUM', share: shares.mediumShare, target: 0, used: 0 },
      { key: 'HARD', share: shares.hardShare, target: 0, used: 0 },
    ];
    for (const item of targets) item.target = Math.floor(group.length * item.share);
    const remainder = group.length - targets.reduce((sum, item) => sum + item.target, 0);
    const byFraction = [...targets].sort((a, b) =>
      (group.length * b.share - b.target) - (group.length * a.share - a.target),
    );
    for (let i = 0; i < remainder; i++) byFraction[i].target++;
    group.forEach((slot, index) => {
      const candidates = targets.filter((item) => item.used < item.target).sort((a, b) =>
        ((index + 1) * b.share - b.used) - ((index + 1) * a.share - a.used),
      );
      const chosen = candidates[0];
      if (chosen) {
        chosen.used++;
        slot.difficulty = chosen.key;
        slot.reason = slot.reason.replace('MEDIUM', chosen.key);
      }
    });
    if (!supportsNumericSlot(subtest)) continue;
    const desired = Math.max(0, Math.round((existing.count + group.length) * shortPercent / 100) - (existingShort.get(subtest) ?? 0));
    const shortCount = Math.min(desired, Math.round(group.length * shortPercent / 100));
    group.forEach((slot, index) => {
      if (Math.floor((index + 1) * shortCount / group.length) > Math.floor(index * shortCount / group.length)) {
        slot.questionType = 'ISIAN_SINGKAT';
        slot.reason = slot.reason.replace('PG', 'Isian Singkat');
      }
    });
  }
}
