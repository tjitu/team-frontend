'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import {
  LIFECYCLE_SUBTESTS,
  type AutoBalanceSlot,
  type PackageAutoBalanceAnalysis,
} from './question-lifecycle-types';

export type AutoBalanceGeneratorPanelProps = {
  batchCount: number;
  onBatchChange: (val: number) => void;
  subtestScope: string;
  onSubtestScopeChange: (val: string) => void;
  customInstruction: string;
  onCustomInstructionChange: (val: string) => void;
  analysis: PackageAutoBalanceAnalysis;
};

export function AutoBalanceGeneratorPanel({
  batchCount,
  onBatchChange,
  subtestScope,
  onSubtestScopeChange,
  customInstruction,
  onCustomInstructionChange,
  analysis,
}: AutoBalanceGeneratorPanelProps) {
  const { slots, subtestCounts, targetIsianPct, targetDifficultyPct, deficit } = analysis;

  const isianInSlots = slots.filter((s) => s.questionType === 'ISIAN_SINGKAT').length;
  const pgInSlots = slots.filter((s) => s.questionType === 'PILIHAN_GANDA').length;
  const easyInSlots = slots.filter((s) => s.difficulty === 'EASY').length;
  const medInSlots = slots.filter((s) => s.difficulty === 'MEDIUM').length;
  const hardInSlots = slots.filter((s) => s.difficulty === 'HARD').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* BATCH DEFICIT SUMMARY BANNER */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '11px',
        }}
      >
        <div>
          <span style={{ color: 'var(--muted-fg)' }}>Alokasi Otomatis Batch Ini ({batchCount} butir): </span>
          <strong style={{ color: '#38bdf8' }}>{pgInSlots} PG</strong> ·{' '}
          <strong style={{ color: '#c084fc' }}>{isianInSlots} Isian</strong> ·{' '}
          <span style={{ color: '#34d399', fontWeight: 600 }}>{easyInSlots} Easy</span> ·{' '}
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{medInSlots} Med</span> ·{' '}
          <span style={{ color: '#f87171', fontWeight: 600 }}>{hardInSlots} Hard</span>
        </div>
        <div style={{ color: '#6ee7b7', fontSize: '10.5px' }}>
          Fokus menutup gap target ({targetIsianPct}% Isian · Level {targetDifficultyPct.easy}/{targetDifficultyPct.medium}/{targetDifficultyPct.hard})
        </div>
      </div>

      {/* CONTROLS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* BATCH SIZE */}
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', display: 'block', marginBottom: '6px' }}>
            Jumlah Butir Batch (1-25)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              min={1}
              max={25}
              value={batchCount}
              onChange={(e) => onBatchChange(parseInt(e.target.value, 10) || 1)}
              className="field-input"
              style={{ width: '70px', height: '32px', fontSize: '13px', fontWeight: 700 }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {[5, 8, 10, 15].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onBatchChange(preset)}
                  className={`pill ${batchCount === preset ? 'pill-active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '3px 7px',
                    fontSize: '11px',
                    background: batchCount === preset ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                    color: batchCount === preset ? '#000' : 'var(--foreground)',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SUBTEST SCOPE */}
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', display: 'block', marginBottom: '6px' }}>
            Fokus Subtes Sasaran
          </label>
          <select
            className="field-input"
            style={{ width: '100%', height: '32px', fontSize: '12px' }}
            value={subtestScope}
            onChange={(e) => onSubtestScopeChange(e.target.value)}
          >
            <option value="AUTO">Otomatis Seimbangkan Semua Subtes Defisit</option>
            {LIFECYCLE_SUBTESTS.map((st) => {
              const stat = subtestCounts[st.value];
              return (
                <option key={st.value} value={st.value}>
                  {st.code} — {st.label} ({stat?.count ?? 0}/{stat?.targetQuota ?? 20} soal)
                </option>
              );
            })}
          </select>
        </div>

        {/* CUSTOM INSTRUCTION */}
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', display: 'block', marginBottom: '6px' }}>
            Instruksi Tambahan (Opsional)
          </label>
          <input
            type="text"
            className="field-input"
            style={{ width: '100%', height: '32px', fontSize: '12px' }}
            placeholder="Contoh: Fokuskan bacaan sains, model P vs Q..."
            value={customInstruction}
            onChange={(e) => onCustomInstructionChange(e.target.value)}
          />
        </div>
      </div>

      {/* SLOTS PREVIEW TABLE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers style={{ width: 14, height: 14, color: '#38bdf8' }} />
            Rencana {slots.length} Butir Soal Penutup Gap
          </strong>
          <span style={{ fontSize: '10.5px', color: 'var(--muted-fg)' }}>
            Memprioritaskan subtopik 0 soal & menutupi defisit tipe/level
          </span>
        </div>

        <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.35)', color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 10px', width: '38px' }}>#</th>
                <th style={{ padding: '8px 10px', width: '70px' }}>Subtes</th>
                <th style={{ padding: '8px 10px', width: '90px' }}>Tipe</th>
                <th style={{ padding: '8px 10px' }}>Materi Kurikulum</th>
                <th style={{ padding: '8px 10px', width: '70px' }}>Level</th>
                <th style={{ padding: '8px 10px' }}>Status Alokasi</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '6px 10px', color: 'var(--muted-fg)', fontWeight: 700 }}>{s.index}</td>
                  <td style={{ padding: '6px 10px' }}>
                    <span className="pill" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontSize: '10px', fontWeight: 700 }}>
                      {s.subtestShort}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <span
                      className="pill"
                      style={{
                        background: s.questionType === 'ISIAN_SINGKAT' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: s.questionType === 'ISIAN_SINGKAT' ? '#c084fc' : '#60a5fa',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {s.questionType === 'ISIAN_SINGKAT' ? 'Isian' : 'PG (A-E)'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', color: '#f1f5f9' }}>
                    <div style={{ fontWeight: 600 }}>{s.topicTitle}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-fg)' }}>{s.subtopicTitle}</div>
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: s.difficulty === 'EASY' ? '#34d399' : s.difficulty === 'HARD' ? '#f87171' : '#fbbf24',
                      }}
                    >
                      {s.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', fontSize: '10px', color: 'var(--muted-fg)' }}>
                    {s.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
