'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import {
  TryoutCurriculumTopic,
} from './question-lifecycle-types';
import {
  AutoBalanceTargetConfig,
  DEFAULT_AUTO_BALANCE_CONFIG,
  useAutoBalanceConfig,
} from './auto-balance-settings';
import { AutoBalanceTargetPanel } from './auto-balance-target-panel';

interface AutoBalanceAdjusterModalProps {
  open: boolean;
  onClose: () => void;
  scopeId: string;
  scopeLabel: string;
  scopeQuestions: Array<{
    id?: string;
    type?: string | null;
    difficulty?: string | null;
    subtest?: string | null;
  }>;
  topics?: TryoutCurriculumTopic[];
  onOpenAiGenerator?: (subtestCounts: Record<string, number>) => void;
}

export function AutoBalanceAdjusterModal({
  open,
  onClose,
  scopeId,
  scopeLabel,
  scopeQuestions,
}: AutoBalanceAdjusterModalProps) {
  const { config: savedConfig, saveConfig } = useAutoBalanceConfig(scopeId);
  const [draftConfig, setDraftConfig] = useState<AutoBalanceTargetConfig>(savedConfig);

  useEffect(() => {
    if (open) {
      setDraftConfig(savedConfig);
    }
  }, [open, savedConfig]);

  if (!open) return null;

  const totalCurrent = scopeQuestions.length;
  const currentIsian = scopeQuestions.filter((q) => {
    const t = String(q.type || '').toUpperCase();
    return t === 'SHORT_ANSWER' || t === 'ISIAN_SINGKAT';
  }).length;
  const currentPg = totalCurrent - currentIsian;
  const currentIsianPct = totalCurrent > 0 ? Math.round((currentIsian / totalCurrent) * 100) : 0;
  const currentPgPct = totalCurrent > 0 ? 100 - currentIsianPct : 0;

  const currentEasy = scopeQuestions.filter((q) => q.difficulty === 'EASY').length;
  const currentMedium = scopeQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
  const currentHard = scopeQuestions.filter((q) => q.difficulty === 'HARD').length;

  const currentEasyPct = totalCurrent > 0 ? Math.round((currentEasy / totalCurrent) * 100) : 0;
  const currentMedPct = totalCurrent > 0 ? Math.round((currentMedium / totalCurrent) * 100) : 0;
  const currentHardPct =
    totalCurrent > 0 ? Math.max(0, 100 - currentEasyPct - currentMedPct) : 0;

  const handleSave = () => {
    saveConfig(draftConfig);
    onClose();
  };

  const handleReset = () => {
    setDraftConfig(DEFAULT_AUTO_BALANCE_CONFIG);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sliders style={{ width: 16, height: 16, color: 'var(--muted-fg)', flexShrink: 0 }} />
              <span>Pengaturan Auto-Balance Paket</span>
            </h3>
            <small style={{ color: 'var(--muted-fg)' }}>
              Atur parameter target komposisi tipe soal & rasio kesulitan untuk <strong>{scopeLabel}</strong>.
            </small>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <AutoBalanceTargetPanel
            draftConfig={draftConfig}
            setDraftConfig={setDraftConfig}
            totalCurrent={totalCurrent}
            currentPg={currentPg}
            currentIsian={currentIsian}
            currentPgPct={currentPgPct}
            currentIsianPct={currentIsianPct}
            currentEasy={currentEasy}
            currentMedium={currentMedium}
            currentHard={currentHard}
            currentEasyPct={currentEasyPct}
            currentMedPct={currentMedPct}
            currentHardPct={currentHardPct}
          />
        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleReset}
          >
            <RotateCcw style={{ width: 13, height: 13 }} /> Reset Default
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handleSave}
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
