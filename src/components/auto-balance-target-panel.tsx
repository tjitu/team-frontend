'use client';

import React from 'react';
import { Check, Flame, Save, Sliders, Sparkles } from 'lucide-react';
import {
  DIFFICULTY_PRESETS,
  ISIAN_PRESETS,
  type AutoBalanceTargetConfig,
} from './auto-balance-settings';
import type { PackageAutoBalanceAnalysis } from './question-lifecycle-types';

export type AutoBalanceTargetPanelProps = {
  config: AutoBalanceTargetConfig;
  onChangeConfig: (next: AutoBalanceTargetConfig) => void;
  onSaveConfig: () => void;
  savedNotice: boolean;
  analysis: PackageAutoBalanceAnalysis;
  onGoToGenerator: () => void;
};

export function AutoBalanceTargetPanel({
  config,
  onChangeConfig,
  onSaveConfig,
  savedNotice,
  analysis,
  onGoToGenerator,
}: AutoBalanceTargetPanelProps) {
  function handlePresetDifficulty(ratio: { easy: number; medium: number; hard: number }) {
    onChangeConfig({
      ...config,
      difficulty: { ...ratio },
    });
  }

  function handleIsianChange(val: number) {
    const clamped = Math.max(0, Math.min(50, val));
    onChangeConfig({
      ...config,
      isianPercentage: clamped,
    });
  }

  function handleDifficultySlider(field: 'easy' | 'medium' | 'hard', val: number) {
    const clamped = Math.max(0, Math.min(100, val));
    const nextDiff = { ...config.difficulty, [field]: clamped };
    onChangeConfig({
      ...config,
      difficulty: nextDiff,
    });
  }

  const { deficit, targetIsianPct, targetDifficultyPct, existingIsianPct, existingDifficultyPct, totalInPackage } = analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* EXPLANATION BANNER */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontSize: '12px',
          color: '#cbd5e1',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: '#38bdf8' }}>💡 Konfigurasi Target Komposisi Ideal:</strong> Tentukan proporsi yang Anda inginkan untuk paket ini. Saat membuat soal baru dengan Auto-Balance, sistem otomatis menghitung <strong>(Target - Kondisi Saat Ini)</strong> dan membuatkan soal untuk menutupi gap tersebut.
      </div>

      {/* TARGET CONFIGURATION CONTROLS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {/* ISIAN TARGET */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc' }}>
              Target Soal Isian Singkat (%)
            </label>
            <span
              className="pill"
              style={{
                background: 'rgba(192, 132, 252, 0.15)',
                color: '#c084fc',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              {config.isianPercentage}% Isian · {100 - config.isianPercentage}% PG
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={config.isianPercentage}
              onChange={(e) => handleIsianChange(parseInt(e.target.value, 10) || 0)}
              style={{ flex: 1, accentColor: '#c084fc', cursor: 'pointer' }}
            />
            <input
              type="number"
              min={0}
              max={50}
              value={config.isianPercentage}
              onChange={(e) => handleIsianChange(parseInt(e.target.value, 10) || 0)}
              className="field-input"
              style={{ width: '56px', height: '30px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>%</span>
          </div>

          {/* ISIAN PRESETS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ISIAN_PRESETS.map((p) => {
              const active = config.isianPercentage === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleIsianChange(p.value)}
                  className={`pill ${active ? 'pill-active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    background: active ? '#c084fc' : 'rgba(255,255,255,0.06)',
                    color: active ? '#000' : 'var(--foreground)',
                    fontWeight: active ? 700 : 500,
                  }}
                  title={p.hint}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DIFFICULTY TARGET */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
              Target Rasio Kesulitan (%)
            </label>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
              <span style={{ color: '#34d399' }}>{config.difficulty.easy}% E</span> ·{' '}
              <span style={{ color: '#fbbf24' }}>{config.difficulty.medium}% M</span> ·{' '}
              <span style={{ color: '#f87171' }}>{config.difficulty.hard}% H</span>
            </span>
          </div>

          {/* DIFFICULTY PRESET BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {DIFFICULTY_PRESETS.map((p) => {
              const active =
                config.difficulty.easy === p.ratio.easy &&
                config.difficulty.medium === p.ratio.medium &&
                config.difficulty.hard === p.ratio.hard;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetDifficulty(p.ratio)}
                  className={`button ${active ? 'button-primary' : 'button-secondary'}`}
                  style={{
                    fontSize: '11px',
                    padding: '6px 8px',
                    height: 'auto',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    ...(active ? { background: '#0284c7', borderColor: '#38bdf8', color: '#fff' } : {}),
                  }}
                  title={p.description}
                >
                  <strong style={{ fontSize: '11px' }}>{p.label}</strong>
                  <span style={{ fontSize: '9.5px', opacity: 0.8 }}>{p.description}</span>
                </button>
              );
            })}
          </div>

          {/* FINE-TUNING SLIDERS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <span style={{ width: '42px', color: '#34d399', fontWeight: 600 }}>Easy:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={config.difficulty.easy}
                onChange={(e) => handleDifficultySlider('easy', parseInt(e.target.value, 10) || 0)}
                style={{ flex: 1, accentColor: '#34d399' }}
              />
              <span style={{ width: '32px', textAlign: 'right', fontWeight: 700 }}>{config.difficulty.easy}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <span style={{ width: '42px', color: '#fbbf24', fontWeight: 600 }}>Med:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={config.difficulty.medium}
                onChange={(e) => handleDifficultySlider('medium', parseInt(e.target.value, 10) || 0)}
                style={{ flex: 1, accentColor: '#fbbf24' }}
              />
              <span style={{ width: '32px', textAlign: 'right', fontWeight: 700 }}>{config.difficulty.medium}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <span style={{ width: '42px', color: '#f87171', fontWeight: 600 }}>Hard:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={config.difficulty.hard}
                onChange={(e) => handleDifficultySlider('hard', parseInt(e.target.value, 10) || 0)}
                style={{ flex: 1, accentColor: '#f87171' }}
              />
              <span style={{ width: '32px', textAlign: 'right', fontWeight: 700 }}>{config.difficulty.hard}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE GAP COMPARISON CARD */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
            📊 Analisis Defisit (Target vs Kondisi Saat Ini)
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            Total soal di paket saat ini: <strong style={{ color: '#fff' }}>{totalInPackage} butir</strong>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '11px' }}>
          {/* TIPE GAP */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: 'var(--muted-fg)', marginBottom: '2px' }}>Komposisi Tipe:</div>
            <div>
              Saat Ini: <strong style={{ color: '#c084fc' }}>{existingIsianPct}% Isian</strong> ({analysis.typeCounts.ISIAN_SINGKAT} butir)
            </div>
            <div>
              Target: <strong style={{ color: '#38bdf8' }}>{targetIsianPct}% Isian</strong>
            </div>
            <div style={{ marginTop: '4px', fontWeight: 700, color: deficit.isian > 0 ? '#fbbf24' : '#34d399' }}>
              {deficit.isian > 0 ? `Defisit: +${deficit.isian} butir Isian Singkat` : '✓ Target Isian tercapai'}
            </div>
          </div>

          {/* LEVEL GAP */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: 'var(--muted-fg)', marginBottom: '2px' }}>Komposisi Level:</div>
            <div>
              Saat Ini: {existingDifficultyPct.easy}% E · {existingDifficultyPct.medium}% M · {existingDifficultyPct.hard}% H
            </div>
            <div>
              Target: {targetDifficultyPct.easy}% E · {targetDifficultyPct.medium}% M · {targetDifficultyPct.hard}% H
            </div>
            <div style={{ marginTop: '4px', fontWeight: 700, color: '#38bdf8' }}>
              Defisit: {[
                deficit.easy > 0 ? `+${deficit.easy} Easy` : null,
                deficit.medium > 0 ? `+${deficit.medium} Med` : null,
                deficit.hard > 0 ? `+${deficit.hard} Hard` : null,
              ].filter(Boolean).join(' · ') || '✓ Seimbang'}
            </div>
          </div>
        </div>
      </div>

      {/* SAVE & ACTION STRIP */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="button button-primary"
          onClick={onSaveConfig}
          style={{
            height: '36px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: savedNotice ? '#10b981' : '#0284c7',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {savedNotice ? <Check style={{ width: 15, height: 15 }} /> : <Save style={{ width: 15, height: 15 }} />}
          <span>{savedNotice ? 'Pengaturan Target Tersimpan!' : 'Simpan Pengaturan Target'}</span>
        </button>

        <button
          type="button"
          className="button button-secondary"
          onClick={onGoToGenerator}
          style={{
            height: '36px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
          }}
        >
          <Sparkles style={{ width: 14, height: 14 }} />
          <span>Lihat Preview Soal Penyeimbang (Generator) →</span>
        </button>
      </div>
    </div>
  );
}
