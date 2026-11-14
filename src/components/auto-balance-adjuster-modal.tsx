'use client';

import React from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  Sliders,
  X,
  FileQuestion,
  HelpCircle,
  Hash,
} from 'lucide-react';
import {
  buildAutoBalancedBatchPrompt,
  computePackageAutoBalancePlan,
  getSubtestDisplay,
  LIFECYCLE_SUBTESTS,
  type AutoBalanceSlot,
  type TryoutCurriculumTopic,
} from './question-lifecycle-types';

export type AutoBalanceAdjusterModalProps = {
  open: boolean;
  onClose: () => void;
  destination: 'FOR_TRYOUT' | 'FOR_PRACTICE' | 'DRAFT';
  packageTitle: string;
  packageQuestions: Array<{
    id?: string;
    subtest?: string | null;
    topicId?: string | null;
    subtopicId?: string | null;
    topicTitle?: string | null;
    subtopicTitle?: string | null;
    difficulty?: string | null;
    type?: string | null;
    status?: string | null;
  }>;
  curriculumTopics: TryoutCurriculumTopic[];
  onOpenAiGenerator?: (config: {
    slots: AutoBalanceSlot[];
    batchSize: number;
    prompt: string;
    subtestScope: string;
  }) => void;
};

export function AutoBalanceAdjusterModal({
  open,
  onClose,
  destination,
  packageTitle,
  packageQuestions,
  curriculumTopics,
  onOpenAiGenerator,
}: AutoBalanceAdjusterModalProps) {
  const [batchCount, setBatchCount] = React.useState<number>(8);
  const [subtestScope, setSubtestScope] = React.useState<string>('AUTO');
  const [customInstruction, setCustomInstruction] = React.useState<string>('');
  const [copied, setCopied] = React.useState<boolean>(false);

  const plan = React.useMemo(() => {
    return computePackageAutoBalancePlan({
      destination,
      packageQuestions,
      curriculumTopics,
      count: batchCount,
      scopeSubtest: subtestScope,
    });
  }, [destination, packageQuestions, curriculumTopics, batchCount, subtestScope]);

  const generatedPrompt = React.useMemo(() => {
    return buildAutoBalancedBatchPrompt({
      packageLabel: packageTitle,
      slots: plan.slots,
      customInstruction,
    });
  }, [packageTitle, plan.slots, customInstruction]);

  if (!open) return null;

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  function handleBatchChange(val: number) {
    const nextCount = Math.max(1, Math.min(25, val));
    setBatchCount(nextCount);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          background: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(15, 23, 42, 0.8))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Sliders style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Auto-Balance Engine
                </h3>
                <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.16)', color: '#34d399', fontSize: '10px' }}>
                  Paket: {packageTitle}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                Seimbangkan komposisi tipe soal (PG & Isian) serta cakupan materi kurikulum secara otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* STATS BANNER */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'var(--muted-fg)' }}>Soal di Paket: </span>
                <strong style={{ color: '#f8fafc' }}>{plan.totalInPackage} butir</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted-fg)' }}>Komposisi Saat Ini: </span>
                <strong style={{ color: '#38bdf8' }}>{plan.typeCounts.PILIHAN_GANDA} PG</strong> ·{' '}
                <strong style={{ color: '#c084fc' }}>{plan.typeCounts.ISIAN_SINGKAT} Isian</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted-fg)' }}>Materi Kurikulum Kosong: </span>
                <strong style={{ color: plan.uncoveredSubtopicsCount > 0 ? '#fbbf24' : '#34d399' }}>
                  {plan.uncoveredSubtopicsCount}/{plan.totalCurriculumSubtopics} subtopik
                </strong>
              </div>
            </div>
            <div style={{ color: '#34d399', fontWeight: 600 }}>
              Level kesulitan diseimbangkan otomatis (E/M/H)
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
                  onChange={(e) => handleBatchChange(parseInt(e.target.value, 10) || 1)}
                  className="field-input"
                  style={{ width: '80px', height: '32px', fontSize: '13px', fontWeight: 700 }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[5, 8, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleBatchChange(preset)}
                      className={`pill ${batchCount === preset ? 'pill-active' : ''}`}
                      style={{
                        cursor: 'pointer',
                        padding: '3px 8px',
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

            {/* QUESTION TYPE COMPOSITION (AUTO-BALANCED READ-ONLY SUMMARY) */}
            <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', margin: 0 }}>
                  Komposisi Tipe Soal (Otomatis)
                </label>
                <span className="pill" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontSize: '10px', padding: '1px 6px' }}>
                  Regulasi SNBT BP3
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  {plan.slots.filter((s) => s.questionType === 'PILIHAN_GANDA').length} PG (A-E)
                </span>
                {plan.slots.filter((s) => s.questionType === 'ISIAN_SINGKAT').length > 0 ? (
                  <>
                    <span style={{ color: 'var(--muted-fg)' }}>·</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc' }}>
                      {plan.slots.filter((s) => s.questionType === 'ISIAN_SINGKAT').length} Isian Singkat
                    </span>
                  </>
                ) : null}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--muted-fg)' }}>
                Isian dialokasikan otomatis khusus subtes Matematika (PK/PM) bila ada defisit; subtes lain 100% PG.
              </p>
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
                onChange={(e) => setSubtestScope(e.target.value)}
              >
                <option value="AUTO">Otomatis Seimbangkan Semua Subtes Defisit</option>
                {LIFECYCLE_SUBTESTS.map((st) => {
                  const stat = plan.subtestCounts[st.value];
                  return (
                    <option key={st.value} value={st.value}>
                      {st.code} — {st.label} ({stat?.count ?? 0}/{stat?.targetQuota ?? 20} soal)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* SLOTS PREVIEW TABLE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers style={{ width: 14, height: 14, color: '#38bdf8' }} />
                Rencana {plan.slots.length} Butir Soal Terseimbang
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                Tiap butir dialokasikan otomatis ke materi & subtes yang paling membutuhkan
              </span>
            </div>

            <div style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.35)', color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px', width: '38px' }}>#</th>
                    <th style={{ padding: '8px 10px', width: '70px' }}>Subtes</th>
                    <th style={{ padding: '8px 10px', width: '100px' }}>Tipe</th>
                    <th style={{ padding: '8px 10px' }}>Materi Kurikulum</th>
                    <th style={{ padding: '8px 10px', width: '70px' }}>Level</th>
                    <th style={{ padding: '8px 10px' }}>Status Alokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.slots.map((s) => (
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

        {/* FOOTER */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            Prompt memuat identitas kurator Jitu PTN & format standar psikometri SNBT.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleCopyPrompt}
              style={{
                height: '34px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: copied ? '#34d399' : undefined,
                borderColor: copied ? 'rgba(16, 185, 129, 0.4)' : undefined,
              }}
            >
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Prompt Siap Pakai'}</span>
            </button>

            {onOpenAiGenerator && (
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  onOpenAiGenerator({
                    slots: plan.slots,
                    batchSize: batchCount,
                    prompt: generatedPrompt,
                    subtestScope,
                  });
                  onClose();
                }}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284c7',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>Buka di Generator AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
