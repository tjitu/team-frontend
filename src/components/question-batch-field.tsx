'use client';

import * as React from 'react';
import { FolderPlus, Layers, X } from 'lucide-react';
import { ComboboxSelect } from './ui/combobox';

export type QuestionBatchTargetKind = 'FOR_PRACTICE' | 'FOR_TRYOUT' | 'DRAFT';

export type QuestionBatchSummary = {
  batch: string;
  count?: number;
  targetKind?: QuestionBatchTargetKind;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
};

function inferItemTargetKind(item: {
  target?: string | null;
  tryoutId?: string | null;
  isPracticeAssigned?: boolean;
}): QuestionBatchTargetKind {
  const cleanTarget = String(item.target || 'DRAFT').toUpperCase().trim();
  if (item.tryoutId || cleanTarget === 'FOR_TRYOUT') return 'FOR_TRYOUT';
  if (item.isPracticeAssigned || cleanTarget === 'FOR_PRACTICE') return 'FOR_PRACTICE';
  return 'DRAFT';
}

export function getBatchTargetKindLabel(
  kind?: QuestionBatchTargetKind,
  tryoutTitle?: string | null,
): string {
  if (kind === 'FOR_PRACTICE') return 'Batch Latihan';
  if (kind === 'FOR_TRYOUT') {
    return tryoutTitle ? `Batch Tryout · ${tryoutTitle}` : 'Batch Tryout';
  }
  return 'Batch Eksperimen / Bank';
}

export function isBatchCompatibleWithTarget(
  entry: QuestionBatchSummary,
  expectedTarget?: QuestionBatchTargetKind,
  expectedTryoutId?: string | null,
): boolean {
  if (!expectedTarget) return true;
  const entryKind: QuestionBatchTargetKind = entry.targetKind || 'DRAFT';
  if (entryKind !== expectedTarget) return false;
  if (
    expectedTarget === 'FOR_TRYOUT' &&
    expectedTryoutId &&
    entry.tryoutId &&
    entry.tryoutId !== expectedTryoutId
  ) {
    return false;
  }
  return true;
}

/**
 * Merges server batch counts with batches present on loaded client items so newly
 * created or unsaved batch labels appear immediately across pickers and filters.
 */
export function mergeBatchSummaries(
  serverBatches: QuestionBatchSummary[],
  items: Array<{
    batch?: string | null;
    target?: string | null;
    tryoutId?: string | null;
    tryoutTitle?: string | null;
    isPracticeAssigned?: boolean;
  }> = [],
): QuestionBatchSummary[] {
  const map = new Map<string, QuestionBatchSummary>();

  for (const entry of serverBatches || []) {
    const clean = String(entry.batch || '').trim();
    if (!clean) continue;
    map.set(clean, {
      batch: clean,
      count: Number(entry.count) || 0,
      targetKind: entry.targetKind || 'DRAFT',
      tryoutId: entry.tryoutId ?? null,
      tryoutTitle: entry.tryoutTitle ?? null,
    });
  }

  const itemCounts = new Map<string, number>();
  for (const item of items || []) {
    const clean = String(item.batch || '').trim();
    if (!clean) continue;
    itemCounts.set(clean, (itemCounts.get(clean) || 0) + 1);
    const itemKind = inferItemTargetKind(item);
    const existing = map.get(clean);
    if (!existing) {
      map.set(clean, {
        batch: clean,
        count: 1,
        targetKind: itemKind,
        tryoutId: item.tryoutId ?? null,
        tryoutTitle: item.tryoutTitle ?? null,
      });
    } else {
      const nextKind: QuestionBatchTargetKind =
        existing.targetKind === 'FOR_TRYOUT' || itemKind === 'FOR_TRYOUT'
          ? 'FOR_TRYOUT'
          : existing.targetKind === 'FOR_PRACTICE' || itemKind === 'FOR_PRACTICE'
          ? 'FOR_PRACTICE'
          : 'DRAFT';
      map.set(clean, {
        ...existing,
        targetKind: nextKind,
        tryoutId: existing.tryoutId || item.tryoutId || null,
        tryoutTitle: existing.tryoutTitle || item.tryoutTitle || null,
      });
    }
  }

  for (const [key, itemCount] of itemCounts.entries()) {
    const entry = map.get(key);
    if (entry && (!entry.count || entry.count < itemCount)) {
      entry.count = itemCount;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.batch.localeCompare(b.batch, 'id', { numeric: true }),
  );
}

type QuestionBatchFieldProps = {
  value: string;
  onChange: (nextBatch: string) => void;
  existingBatches: QuestionBatchSummary[];
  expectedTarget?: QuestionBatchTargetKind;
  expectedTryoutId?: string | null;
  label?: string;
  helperText?: string;
  compact?: boolean;
};

/**
 * Reusable batch selector letting question authors either choose an existing batch
 * or switch to inline creation of a new batch name. Enforces single-target batch exclusivity.
 */
export function QuestionBatchField({
  value,
  onChange,
  existingBatches,
  expectedTarget,
  expectedTryoutId,
  label = 'Batch Soal',
  helperText,
  compact = false,
}: QuestionBatchFieldProps) {
  const normalizedValue = value.trim();

  const compatibleBatches = React.useMemo(
    () =>
      existingBatches.filter((item) =>
        isBatchCompatibleWithTarget(item, expectedTarget, expectedTryoutId),
      ),
    [existingBatches, expectedTarget, expectedTryoutId],
  );

  const incompatibleCount = existingBatches.length - compatibleBatches.length;

  const knownBatchNames = React.useMemo(
    () => new Set(compatibleBatches.map((item) => item.batch.trim())),
    [compatibleBatches],
  );

  const [mode, setMode] = React.useState<'EXISTING' | 'NEW'>(() =>
    normalizedValue && !knownBatchNames.has(normalizedValue) ? 'NEW' : 'EXISTING',
  );

  React.useEffect(() => {
    if (!normalizedValue) return;
    if (!knownBatchNames.has(normalizedValue)) {
      setMode('NEW');
    }
  }, [normalizedValue, knownBatchNames]);

  const comboboxOptions = React.useMemo(() => {
    const opts = [
      { label: '— Tanpa Batch —', value: '' },
      ...compatibleBatches.map((entry) => {
        const kindLabel = getBatchTargetKindLabel(entry.targetKind, entry.tryoutTitle);
        const countPart =
          typeof entry.count === 'number' && entry.count > 0 ? `${entry.count} soal` : '0 soal';
        return {
          value: entry.batch,
          label: `${entry.batch} (${countPart} · ${kindLabel})`,
        };
      }),
    ];

    if (normalizedValue && !knownBatchNames.has(normalizedValue)) {
      const existingAny = existingBatches.find(
        (b) => b.batch.toLowerCase() === normalizedValue.toLowerCase(),
      );
      if (!existingAny) {
        opts.push({ value: normalizedValue, label: `${normalizedValue} (baru)` });
      }
    }

    return opts;
  }, [compatibleBatches, existingBatches, knownBatchNames, normalizedValue]);

  const matchingExisting = React.useMemo(() => {
    if (!normalizedValue) return null;
    const lower = normalizedValue.toLowerCase();
    return existingBatches.find((entry) => entry.batch.toLowerCase() === lower) || null;
  }, [existingBatches, normalizedValue]);

  const isMatchingConflict = React.useMemo(() => {
    if (!matchingExisting) return false;
    return !isBatchCompatibleWithTarget(matchingExisting, expectedTarget, expectedTryoutId);
  }, [matchingExisting, expectedTarget, expectedTryoutId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '6px' : '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <label className="text-xs font-semibold text-zinc-300" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Layers style={{ width: 13, height: 13, color: '#fbbf24' }} />
          <span>{label}</span>
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted-fg)' }}>(Opsional)</span>
        </label>

        <div
          style={{
            display: 'inline-flex',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '2px',
            background: 'rgba(0, 0, 0, 0.22)',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('EXISTING');
              if (normalizedValue && !knownBatchNames.has(normalizedValue)) {
                onChange('');
              }
            }}
            style={{
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: mode === 'EXISTING' ? 'rgba(251, 191, 36, 0.18)' : 'transparent',
              color: mode === 'EXISTING' ? '#fbbf24' : 'var(--muted-fg)',
            }}
          >
            Pilih Existing
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('NEW');
              if (normalizedValue && knownBatchNames.has(normalizedValue)) {
                onChange('');
              }
            }}
            style={{
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: mode === 'NEW' ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
              color: mode === 'NEW' ? '#93c5fd' : 'var(--muted-fg)',
            }}
          >
            <FolderPlus style={{ width: 11, height: 11 }} />
            <span>Buat Batch Baru</span>
          </button>
        </div>
      </div>

      {mode === 'EXISTING' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ComboboxSelect
                value={normalizedValue}
                onValueChange={(nextVal) => onChange(nextVal)}
                options={comboboxOptions}
                searchable={true}
                align="start"
                fullWidth={true}
                placeholder={
                  compatibleBatches.length > 0
                    ? 'Pilih batch soal yang sejenis...'
                    : 'Belum ada batch untuk jenis soal ini — klik Buat Batch Baru'
                }
                triggerClassName="w-full h-9"
              />
            </div>
            {normalizedValue && (
              <button
                type="button"
                className="button button-secondary"
                style={{ height: '36px', padding: '0 10px', fontSize: '11px', flexShrink: 0 }}
                onClick={() => onChange('')}
                title="Kosongkan batch"
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
          {incompatibleCount > 0 && (
            <span style={{ fontSize: '10.5px', color: '#a1a1aa' }}>
              🔒 {incompatibleCount} batch dari jenis soal lain disembunyikan otomatis (1 batch tidak boleh mencampur jenis soal).
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="field-input"
              style={{
                width: '100%',
                height: '36px',
                fontSize: '12px',
                borderColor: isMatchingConflict ? 'rgba(239, 68, 68, 0.65)' : undefined,
              }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ketik nama batch baru, misal: Batch 1 - PK & PM"
            />
            {value && (
              <button
                type="button"
                className="button button-secondary"
                style={{ height: '36px', padding: '0 10px', fontSize: '11px', flexShrink: 0 }}
                onClick={() => onChange('')}
                title="Kosongkan nama batch"
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
          {matchingExisting &&
            (isMatchingConflict ? (
              <div
                style={{
                  fontSize: '11px',
                  color: '#fca5a5',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  padding: '6px 9px',
                  lineHeight: 1.4,
                }}
              >
                ⚠️ Nama batch <strong>{matchingExisting.batch}</strong> sudah terdaftar sebagai{' '}
                <strong>
                  {getBatchTargetKindLabel(matchingExisting.targetKind, matchingExisting.tryoutTitle)}
                </strong>
                . Batch tidak boleh mencampur jenis soal — silakan gunakan nama batch lain.
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#fbbf24' }}>
                Nama ini cocok dengan batch sejenis yang sudah ada:{' '}
                <strong>{matchingExisting.batch}</strong> — soal akan digabung ke batch tersebut.
              </div>
            ))}
        </div>
      )}

      {helperText && (
        <span style={{ fontSize: '11px', color: 'var(--muted-fg)', lineHeight: 1.4 }}>{helperText}</span>
      )}
    </div>
  );
}
