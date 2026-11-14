'use client';

import React from 'react';
import {
  Check,
  Copy,
  Layers,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import {
  buildAutoBalancedBatchPrompt,
  computePackageAutoBalancePlan,
  type AutoBalanceSlot,
  type TryoutCurriculumTopic,
} from './question-lifecycle-types';
import {
  useAutoBalanceConfig,
  type AutoBalanceTargetConfig,
} from './auto-balance-settings';
import { AutoBalanceTargetPanel } from './auto-balance-target-panel';
import { AutoBalanceGeneratorPanel } from './auto-balance-generator-panel';

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
  scopeKey?: string;
  initialTab?: 'TARGET_CONFIG' | 'GENERATOR_GAP';
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
  scopeKey,
  initialTab = 'TARGET_CONFIG',
  onOpenAiGenerator,
}: AutoBalanceAdjusterModalProps) {
  const effectiveScope = scopeKey || (destination === 'FOR_PRACTICE' ? 'PRACTICE' : packageTitle);
  const { config: storedConfig, saveConfig } = useAutoBalanceConfig(effectiveScope);

  const [activeTab, setActiveTab] = React.useState<'TARGET_CONFIG' | 'GENERATOR_GAP'>(initialTab);
  const [draftConfig, setDraftConfig] = React.useState<AutoBalanceTargetConfig>(storedConfig);
  const [savedNotice, setSavedNotice] = React.useState<boolean>(false);

  const [batchCount, setBatchCount] = React.useState<number>(8);
  const [subtestScope, setSubtestScope] = React.useState<string>(storedConfig.subtestScope || 'AUTO');
  const [customInstruction, setCustomInstruction] = React.useState<string>('');
  const [copied, setCopied] = React.useState<boolean>(false);

  // Sync draftConfig when storedConfig loads/changes
  React.useEffect(() => {
    setDraftConfig(storedConfig);
  }, [storedConfig]);

  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const plan = React.useMemo(() => {
    return computePackageAutoBalancePlan({
      destination,
      packageQuestions,
      curriculumTopics,
      count: batchCount,
      scopeSubtest: subtestScope,
      targetIsianPct: draftConfig.isianPercentage,
      difficultyRatio: draftConfig.difficulty,
    });
  }, [destination, packageQuestions, curriculumTopics, batchCount, subtestScope, draftConfig]);

  const generatedPrompt = React.useMemo(() => {
    return buildAutoBalancedBatchPrompt({
      packageLabel: packageTitle,
      slots: plan.slots,
      customInstruction,
    });
  }, [packageTitle, plan.slots, customInstruction]);

  if (!open) return null;

  function handleSaveTargetConfig() {
    saveConfig(draftConfig);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '890px',
          maxHeight: '92vh',
          background: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(15, 23, 42, 0.85))',
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
                  Auto-Balance Engine & Settings
                </h3>
                <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.16)', color: '#34d399', fontSize: '10px' }}>
                  {packageTitle}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted-fg)' }}>
                Atur target komposisi dan seimbangkan defisit tipe & level secara otomatis.
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

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: 'flex',
            padding: '0 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.2)',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('TARGET_CONFIG')}
            style={{
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'TARGET_CONFIG' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'TARGET_CONFIG' ? '#38bdf8' : 'var(--muted-fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sliders style={{ width: 14, height: 14 }} />
            <span>1. Pengaturan Target Komposisi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GENERATOR_GAP')}
            style={{
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'GENERATOR_GAP' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'GENERATOR_GAP' ? '#38bdf8' : 'var(--muted-fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>2. Generator & Gap Soal ({plan.slots.length} Butir)</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'TARGET_CONFIG' ? (
            <AutoBalanceTargetPanel
              config={draftConfig}
              onChangeConfig={setDraftConfig}
              onSaveConfig={handleSaveTargetConfig}
              savedNotice={savedNotice}
              analysis={plan}
              onGoToGenerator={() => setActiveTab('GENERATOR_GAP')}
            />
          ) : (
            <AutoBalanceGeneratorPanel
              batchCount={batchCount}
              onBatchChange={setBatchCount}
              subtestScope={subtestScope}
              onSubtestScopeChange={setSubtestScope}
              customInstruction={customInstruction}
              onCustomInstructionChange={setCustomInstruction}
              analysis={plan}
            />
          )}
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
            Target aktif: <strong style={{ color: '#c084fc' }}>{draftConfig.isianPercentage}% Isian</strong> ·{' '}
            <strong style={{ color: '#38bdf8' }}>Level {draftConfig.difficulty.easy}/{draftConfig.difficulty.medium}/{draftConfig.difficulty.hard}</strong>
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
              <span>{copied ? 'Tersalin!' : 'Salin Prompt Penyeimbang'}</span>
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
