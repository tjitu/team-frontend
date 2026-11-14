'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import {
  AutoBalanceTargetConfig,
  DEFAULT_AUTO_BALANCE_CONFIG,
  ISIAN_PERCENTAGE_PRESETS,
  DIFFICULTY_RATIO_PRESETS,
  normalizeDifficultyRatio,
} from './auto-balance-settings';

interface AutoBalanceTargetPanelProps {
  draftConfig: AutoBalanceTargetConfig;
  setDraftConfig: React.Dispatch<React.SetStateAction<AutoBalanceTargetConfig>>;
  totalCurrent: number;
  currentPg: number;
  currentIsian: number;
  currentPgPct: number;
  currentIsianPct: number;
  currentEasy: number;
  currentMedium: number;
  currentHard: number;
  currentEasyPct: number;
  currentMedPct: number;
  currentHardPct: number;
}

export function AutoBalanceTargetPanel({
  draftConfig,
  setDraftConfig,
  totalCurrent,
  currentPg,
  currentIsian,
  currentPgPct,
  currentIsianPct,
  currentEasy,
  currentMedium,
  currentHard,
  currentEasyPct,
  currentMedPct,
  currentHardPct,
}: AutoBalanceTargetPanelProps) {
  const pgPct = 100 - draftConfig.isianPercentage;
  const isianPct = draftConfig.isianPercentage;
  const { easy: dEasy, medium: dMed, hard: dHard } = draftConfig.difficulty;
  const diffSum = dEasy + dMed + dHard;

  const handleIsianChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setDraftConfig((prev) => ({
      ...prev,
      isianPercentage: clamped,
    }));
  };

  const handleDifficultyChange = (field: 'easy' | 'medium' | 'hard', rawVal: number) => {
    const val = Math.max(0, Math.min(100, Math.round(rawVal)));
    setDraftConfig((prev) => {
      const next = { ...prev.difficulty, [field]: val };
      const otherFields = (['easy', 'medium', 'hard'] as const).filter((f) => f !== field);
      const remaining = Math.max(0, 100 - val);
      const otherSum = prev.difficulty[otherFields[0]] + prev.difficulty[otherFields[1]];

      if (otherSum === 0) {
        next[otherFields[0]] = Math.round(remaining / 2);
        next[otherFields[1]] = remaining - next[otherFields[0]];
      } else {
        next[otherFields[0]] = Math.round((prev.difficulty[otherFields[0]] / otherSum) * remaining);
        next[otherFields[1]] = remaining - next[otherFields[0]];
      }
      return {
        ...prev,
        difficulty: next,
      };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. KOMPOSISI TIPE SOAL (PG vs ISIAN SINGKAT) */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
              1. Komposisi Tipe Soal (PG vs Isian Singkat)
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-fg)', marginTop: '2px' }}>
              Tentukan target persentase soal Pilihan Ganda dan Isian Singkat pada paket ini.
            </div>
          </div>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: '6px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          >
            PG {pgPct}% · Isian {isianPct}%
          </span>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ISIAN_PERCENTAGE_PRESETS.map((preset) => {
            const active = draftConfig.isianPercentage === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                className={`filter-btn ${active ? 'is-active' : ''}`}
                onClick={() => handleIsianChange(preset.value)}
                title={preset.hint}
              >
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inputs & Slider */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label className="field-label" style={{ margin: 0 }}>
            <span>Pilihan Ganda (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="field-input"
              value={pgPct}
              onChange={(e) => handleIsianChange(100 - (Number(e.target.value) || 0))}
            />
          </label>
          <label className="field-label" style={{ margin: 0 }}>
            <span>Isian Singkat (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="field-input"
              value={isianPct}
              onChange={(e) => handleIsianChange(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={isianPct}
            onChange={(e) => handleIsianChange(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-fg)' }}>
            <span>Pilihan Ganda: {pgPct}%</span>
            <span>Isian Singkat: {isianPct}%</span>
          </div>
        </div>
      </div>

      {/* 2. RASIO TINGKAT KESULITAN (EASY : MEDIUM : HARD) */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
              2. Rasio Tingkat Kesulitan (Easy : Medium : Hard)
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-fg)', marginTop: '2px' }}>
              Proporsi distribusi tingkat kesulitan soal dalam paket (total otomatis 100%).
            </div>
          </div>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: '6px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          >
            {dEasy}% : {dMed}% : {dHard}%
          </span>
        </div>

        {/* Difficulty Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {DIFFICULTY_RATIO_PRESETS.map((preset) => {
            const active =
              dEasy === preset.ratio.easy &&
              dMed === preset.ratio.medium &&
              dHard === preset.ratio.hard;
            return (
              <button
                key={preset.id}
                type="button"
                className={`filter-btn ${active ? 'is-active' : ''}`}
                onClick={() =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    difficulty: { ...preset.ratio },
                  }))
                }
                title={preset.description}
              >
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3 Number Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <label className="field-label" style={{ margin: 0 }}>
            <span>Easy / Mudah (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="field-input"
              value={dEasy}
              onChange={(e) => handleDifficultyChange('easy', Number(e.target.value) || 0)}
            />
          </label>
          <label className="field-label" style={{ margin: 0 }}>
            <span>Medium / Sedang (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="field-input"
              value={dMed}
              onChange={(e) => handleDifficultyChange('medium', Number(e.target.value) || 0)}
            />
          </label>
          <label className="field-label" style={{ margin: 0 }}>
            <span>Hard / Sulit (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="field-input"
              value={dHard}
              onChange={(e) => handleDifficultyChange('hard', Number(e.target.value) || 0)}
            />
          </label>
        </div>

        {diffSum !== 100 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--muted-fg)' }}>
            <span>Total saat ini: {diffSum}% (harus 100%)</span>
            <button
              type="button"
              className="button button-secondary compact-button"
              onClick={() =>
                setDraftConfig((prev) => ({
                  ...prev,
                  difficulty: normalizeDifficultyRatio(prev.difficulty),
                }))
              }
            >
              <RotateCcw style={{ width: 12, height: 12 }} /> Normalisasi ke 100%
            </button>
          </div>
        )}
      </div>

      {/* 3. KONTEKS KOMPOSISI PAKET SAAT INI (INFO RINGKAS) */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'var(--muted-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            Status Komposisi Paket Saat Ini ({totalCurrent} Soal)
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            Aktual vs Target
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--muted-fg)', fontSize: '11px', marginBottom: '2px' }}>Tipe Soal</div>
            <div style={{ color: 'var(--foreground)', fontWeight: 600 }}>
              PG {currentPg} ({currentPgPct}%) · Isian {currentIsian} ({currentIsianPct}%)
            </div>
            <div style={{ color: 'var(--muted-fg)', fontSize: '11px', marginTop: '2px' }}>
              Target: PG {pgPct}% · Isian {isianPct}%
            </div>
          </div>

          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--muted-fg)', fontSize: '11px', marginBottom: '2px' }}>Tingkat Kesulitan</div>
            <div style={{ color: 'var(--foreground)', fontWeight: 600 }}>
              E {currentEasy} ({currentEasyPct}%) · M {currentMedium} ({currentMedPct}%) · H {currentHard} ({currentHardPct}%)
            </div>
            <div style={{ color: 'var(--muted-fg)', fontSize: '11px', marginTop: '2px' }}>
              Target: E {dEasy}% · M {dMed}% · H {dHard}%
            </div>
          </div>
        </div>

        <small style={{ color: 'var(--muted-fg)', fontSize: '11px', lineHeight: 1.45 }}>
          Pengaturan ini disimpan sebagai konteks paket. Saat Anda membuat soal untuk paket ini dan mengaktifkan opsi{' '}
          <strong style={{ color: 'var(--foreground)' }}>Auto-Balance</strong>, sistem akan otomatis menghitung gap kekurangan soal dan menyusun prompt sesuai parameter di atas.
        </small>
      </div>
    </div>
  );
}
