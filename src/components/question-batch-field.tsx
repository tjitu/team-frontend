'use client';

import * as React from 'react';
import { FolderPlus, Layers, X } from 'lucide-react';
import { ComboboxSelect } from './ui/combobox';

export type QuestionBatchSummary = {
  batch: string;
  count?: number;
};

/**
 * Merges server batch counts with batches present on loaded client items so newly
 * created or unsaved batch labels appear immediately across pickers and filters.
 */
export function mergeBatchSummaries(
  serverBatches: QuestionBatchSummary[],
  items: Array<{ batch?: string | null }> = [],
): QuestionBatchSummary[] {
  const counts = new Map<string, number>();

  for (const entry of serverBatches || []) {
    const clean = String(entry.batch || '').trim();
    if (!clean) continue;
    counts.set(clean, Number(entry.count) || 0);
  }

  for (const item of items || []) {
    const clean = String(item.batch || '').trim();
    if (!clean) continue;
    if (!counts.has(clean)) {
      counts.set(clean, 0);
    }
  }

  return Array.from(counts.entries())
    .map(([batch, count]) => ({ batch, count }))
    .sort((a, b) => a.batch.localeCompare(b.batch, 'id', { numeric: true }));
}

type QuestionBatchFieldProps = {
  value: string;
  onChange: (nextBatch: string) => void;
  existingBatches: QuestionBatchSummary[];
  label?: string;
  helperText?: string;
  compact?: boolean;
};

/**
 * Reusable batch selector letting question authors either choose an existing batch
 * or switch to inline creation of a new batch name.
 */
export function QuestionBatchField({
  value,
  onChange,
  existingBatches,
  label = 'Batch Soal',
  helperText,
  compact = false,
}: QuestionBatchFieldProps) {
  const normalizedValue = value.trim();
  const knownBatchNames = React.useMemo(
    () => new Set(existingBatches.map((item) => item.batch.trim())),
    [existingBatches],
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
      ...existingBatches.map((entry) => ({
        value: entry.batch,
        label:
          typeof entry.count === 'number' && entry.count > 0
            ? `${entry.batch} (${entry.count} soal)`
            : entry.batch,
      })),
    ];

    if (normalizedValue && !knownBatchNames.has(normalizedValue)) {
      opts.push({ value: normalizedValue, label: `${normalizedValue} (baru)` });
    }

    return opts;
  }, [existingBatches, knownBatchNames, normalizedValue]);

  const matchingExisting = React.useMemo(() => {
    if (!normalizedValue) return null;
    const lower = normalizedValue.toLowerCase();
    return existingBatches.find((entry) => entry.batch.toLowerCase() === lower) || null;
  }, [existingBatches, normalizedValue]);

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
                existingBatches.length > 0
                  ? 'Pilih batch soal yang sudah ada...'
                  : 'Belum ada batch — klik Buat Batch Baru'
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="field-input"
              style={{ width: '100%', height: '36px', fontSize: '12px' }}
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
          {matchingExisting && (
            <div style={{ fontSize: '11px', color: '#fbbf24' }}>
              Nama ini cocok dengan batch yang sudah ada: <strong>{matchingExisting.batch}</strong> — soal akan digabung ke batch tersebut.
            </div>
          )}
        </div>
      )}

      {helperText && (
        <span style={{ fontSize: '11px', color: 'var(--muted-fg)', lineHeight: 1.4 }}>{helperText}</span>
      )}
    </div>
  );
}
