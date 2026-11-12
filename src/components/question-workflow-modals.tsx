'use client';

import React from 'react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ClipboardCopy, Send, Sparkles } from 'lucide-react';
import {
  buildRevisionContextPrompt,
  extractJsonFromLlmText,
  getDifficultyMeta,
  getQuestionStatusBadge,
  getSubtestDisplay,
  SolutionStepItem,
} from './question-lifecycle-types';
import { MathText } from './math-text';

type RevisionRequestModalProps = {
  open: boolean;
  questionSnippet: string;
  notes: string;
  submitting: boolean;
  onNotesChange: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function RevisionRequestModal({
  open,
  questionSnippet,
  notes,
  submitting,
  onNotesChange,
  onClose,
  onConfirm,
}: RevisionRequestModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle style={{ width: 16, height: 16 }} />
              Kembalikan ke Kotak Revisi
            </h3>
            <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '2px' }}>
              Soal tidak dikembalikan ke Draf, melainkan masuk ke <strong>Kotak Revisi</strong> dan dapat diajukan ulang ke QC setelah diperbaiki.
            </small>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted-fg)' }}>
            <strong style={{ color: 'var(--foreground)', display: 'block', marginBottom: '2px' }}>Potongan Soal:</strong>
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {questionSnippet}
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Catatan Revisi dari Tim QC <span style={{ color: '#fb7185' }}>*</span>
            </label>
            <textarea
              className="field-input"
              rows={4}
              style={{ width: '100%', fontSize: '12px', lineHeight: 1.5 }}
              placeholder="Contoh: Opsi C dan D nilainya sama, atau langkah ke-2 pembahasan salah tanda negatif. Tolong perbaiki pengecoh C..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button
            type="button"
            className="button button-primary"
            disabled={!notes.trim() || submitting}
            onClick={onConfirm}
            style={{ background: '#f43f5e', color: '#fff', borderColor: '#f43f5e', fontWeight: 700 }}
          >
            {submitting ? 'Mengirim ke Revisi...' : 'Kirim ke Kotak Revisi'}
          </button>
        </div>
      </div>
    </div>
  );
}

type KotakRevisiBannerProps = {
  questionId: string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  formState: {
    subtest: string;
    difficulty: string;
    type: string;
    narration: string;
    content: string;
    correctAnswer: string;
    options: Array<{ content: string; isCorrect: boolean; order: number }>;
    keyFormula: string;
    quickTrick: string;
    staticExplanation: string;
    solutionSteps: SolutionStepItem[];
  };
  onApplyRevisionJson: (parsed: Record<string, any>) => void;
  onResubmitQc?: () => void;
  submittingQc?: boolean;
};

export function KotakRevisiBanner({
  questionId,
  revisionNotes,
  reviewedBy,
  reviewedAt,
  formState,
  onApplyRevisionJson,
  onResubmitQc,
  submittingQc,
}: KotakRevisiBannerProps) {
  const [copied, setCopied] = React.useState(false);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [jsonText, setJsonText] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  async function copyPrompt() {
    const text = buildRevisionContextPrompt({
      id: questionId,
      revisionNotes,
      ...formState,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleApplyJson() {
    if (!jsonText.trim()) return;
    try {
      const raw = extractJsonFromLlmText(jsonText);
      const data = Array.isArray(raw) ? raw[0] : raw;
      if (!data || typeof data !== 'object') {
        setFeedback('Format JSON revisi harus berupa objek soal.');
        return;
      }
      onApplyRevisionJson(data);
      setFeedback('Hasil revisi JSON berhasil diterapkan ke form! Periksa sebentar lalu klik Simpan / Kirim Ulang ke QC.');
      setPasteOpen(false);
      setJsonText('');
    } catch (cause) {
      setFeedback(`JSON tidak valid: ${cause instanceof Error ? cause.message : 'Periksa format JSON'}`);
    }
  }

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'rgba(244, 63, 94, 0.08)',
        border: '1px solid rgba(244, 63, 94, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#fb7185' }}>
            <AlertTriangle style={{ width: 15, height: 15 }} />
            <span>KOTAK REVISI QC</span>
            {reviewedBy && (
              <span style={{ fontWeight: 500, color: 'var(--muted-fg)', fontSize: '11px' }}>
                · Reviewer: {reviewedBy}
                {reviewedAt ? ` (${new Date(reviewedAt).toLocaleDateString('id-ID')})` : ''}
              </span>
            )}
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
            {revisionNotes?.trim() || 'Soal perlu ditinjau ulang sebelum masuk bank Ready.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void copyPrompt()}
            style={{ height: '30px', fontSize: '11px', padding: '0 10px', borderColor: 'rgba(251, 191, 36, 0.45)', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {copied ? <Check style={{ width: 13, height: 13, color: '#34d399' }} /> : <ClipboardCopy style={{ width: 13, height: 13 }} />}
            <span>{copied ? 'Prompt Revisi Disalin!' : 'Salin Prompt Konteks Revisi'}</span>
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => setPasteOpen((v) => !v)}
            style={{ height: '30px', fontSize: '11px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>{pasteOpen ? 'Tutup Kotak JSON' : 'Tempel JSON Hasil Revisi'}</span>
          </button>

          {onResubmitQc && (
            <button
              type="button"
              className="button button-primary"
              disabled={submittingQc}
              onClick={onResubmitQc}
              style={{ height: '30px', fontSize: '11px', padding: '0 12px', color: '#000', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Send style={{ width: 13, height: 13 }} />
              <span>{submittingQc ? 'Mengirim...' : 'Simpan & Kirim Ulang ke QC'}</span>
            </button>
          )}
        </div>
      </div>

      {pasteOpen && (
        <div style={{ paddingTop: '8px', borderTop: '1px dashed rgba(244, 63, 94, 0.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            className="field-input"
            rows={4}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px' }}
            placeholder="Tempel JSON hasil revisi dari ChatGPT / Claude / Gemini di sini (atau langsung edit manual field soal di bawah)..."
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
              Atau abaikan kotak ini dan edit langsung secara manual pada form di bawah.
            </span>
            <button
              type="button"
              className="button button-primary"
              style={{ height: '30px', fontSize: '11px', color: '#000', fontWeight: 700 }}
              onClick={handleApplyJson}
            >
              Terapkan JSON ke Form
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div style={{ fontSize: '11px', color: feedback.startsWith('JSON tidak valid') || feedback.startsWith('Format JSON') ? '#fb7185' : '#34d399' }}>
          {feedback}
        </div>
      )}
    </div>
  );
}

type BulkRevisionModalProps = {
  open: boolean;
  selectedCount: number;
  notes: string;
  submitting: boolean;
  onNotesChange: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function BulkRevisionModal({
  open,
  selectedCount,
  notes,
  submitting,
  onNotesChange,
  onClose,
  onConfirm,
}: BulkRevisionModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle style={{ width: 16, height: 16 }} />
              Pindahkan {selectedCount} Soal ke Kotak Revisi
            </h3>
            <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '2px' }}>
              Seluruh soal terpilih akan berpindah ke status <strong>Kotak Revisi</strong> dan dikeluarkan dari pool Latihan jika sebelumnya aktif.
            </small>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
              Catatan Revisi Massal (Opsional)
            </label>
            <textarea
              className="field-input"
              rows={4}
              style={{ width: '100%', fontSize: '12px', lineHeight: 1.5 }}
              placeholder="Contoh: Periksa kembali pengecoh atau lengkapi langkah pembahasan sebelum diajukan ulang ke QC..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              autoFocus
            />
            <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '4px', fontSize: '11px' }}>
              Jika dikosongkan, catatan revisi sebelumnya (jika ada) akan tetap dipertahankan.
            </small>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button
            type="button"
            className="button button-primary"
            disabled={submitting || selectedCount === 0}
            onClick={onConfirm}
            style={{ background: '#f43f5e', color: '#fff', borderColor: '#f43f5e', fontWeight: 700 }}
          >
            {submitting ? 'Memindahkan...' : `Pindahkan ${selectedCount} Soal`}
          </button>
        </div>
      </div>
    </div>
  );
}

type QuestionPreviewData = {
  id: string;
  subtest?: string | null;
  difficulty?: string | null;
  type?: string | null;
  status?: string | null;
  topicTitle?: string | null;
  subtopicTitle?: string | null;
  narration?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  correctAnswer?: string | null;
  revisionNotes?: string | null;
  options?: Array<{
    id?: string;
    content: string;
    isCorrect: boolean;
    order?: number;
  }>;
  solution?: {
    keyFormula?: string | null;
    quickTrick?: string | null;
    staticContent?: string | null;
    steps?: Array<{
      stepNumber?: number;
      order?: number;
      category?: string;
      title?: string;
      content?: string;
    }> | null;
  } | null;
};

type QuestionPreviewModalProps = {
  question: QuestionPreviewData | null;
  slideIdx: number;
  onSlideChange: (idx: number) => void;
  onClose: () => void;
};

export function QuestionPreviewModal({
  question,
  slideIdx,
  onSlideChange,
  onClose,
}: QuestionPreviewModalProps) {
  if (!question) return null;

  const sub = getSubtestDisplay(question.subtest);
  const diff = getDifficultyMeta(question.difficulty);
  const statusBadge = getQuestionStatusBadge(question.status);
  const steps = Array.isArray(question.solution?.steps) ? question.solution!.steps! : [];
  const safeSlide = Math.max(0, Math.min(slideIdx, Math.max(0, steps.length - 1)));
  const activeStep = steps[safeSlide];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                className="pill"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  border: `1px solid ${statusBadge.border}`,
                }}
              >
                {statusBadge.label}
              </span>
              <span
                className="pill"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.14)',
                  color: '#7dd3fc',
                }}
              >
                {sub.code} — {sub.label}
              </span>
              <span
                className="pill"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: diff.bg,
                  color: diff.color,
                  border: `1px solid ${diff.border}`,
                }}
              >
                {diff.label}
              </span>
              <small style={{ color: 'var(--muted-fg)' }}>#{question.id.slice(0, 8)}</small>
            </div>
            {(question.topicTitle || question.subtopicTitle) && (
              <small style={{ color: 'var(--muted-fg)' }}>
                {question.topicTitle || 'Topik'}
                {question.subtopicTitle ? ` › ${question.subtopicTitle}` : ''}
              </small>
            )}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup pratinjau">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {question.revisionNotes && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                background: 'rgba(244, 63, 94, 0.08)',
                fontSize: '12px',
                color: '#fecdd3',
              }}
            >
              <strong>Catatan Revisi QC:</strong> {question.revisionNotes}
            </div>
          )}

          {question.narration && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#93c5fd', marginBottom: '4px' }}>
                Wacana / Stimulus
              </div>
              <MathText text={question.narration} />
            </div>
          )}

          {question.imageUrl && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={question.imageUrl}
                alt="Gambar soal"
                style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
          )}

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border)',
              fontSize: '14px',
              lineHeight: 1.65,
            }}
          >
            <MathText text={question.content || ''} />
          </div>

          {question.options && question.options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {question.options
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={opt.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: opt.isCorrect ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border)',
                        background: opt.isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.015)',
                        fontSize: '13px',
                      }}
                    >
                      <span
                        style={{
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          background: opt.isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)',
                          color: opt.isCorrect ? '#052e16' : 'var(--foreground)',
                        }}
                      >
                        {letter}
                      </span>
                      <div style={{ flex: 1, lineHeight: 1.5 }}>
                        <MathText text={opt.content} />
                      </div>
                      {opt.isCorrect && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>✓ Kunci</span>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.1)',
                fontSize: '13px',
                color: '#6ee7b7',
              }}
            >
              <strong>Kunci Isian Singkat:</strong> {question.correctAnswer || '-'}
            </div>
          )}

          {(question.solution?.keyFormula || question.solution?.quickTrick || steps.length > 0 || question.solution?.staticContent) && (
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24' }}>
                Pembahasan & Trik Cepat
              </div>

              {question.solution?.keyFormula && (
                <div style={{ fontSize: '12px' }}>
                  <strong style={{ color: '#fde68a' }}>Konsep / Rumus Inti: </strong>
                  <MathText text={question.solution.keyFormula} />
                </div>
              )}

              {question.solution?.quickTrick && (
                <div style={{ fontSize: '12px' }}>
                  <strong style={{ color: '#6ee7b7' }}>Trik Cepat 30 Detik: </strong>
                  <MathText text={question.solution.quickTrick} />
                </div>
              )}

              {steps.length > 0 && activeStep ? (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.28)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>
                      Langkah {safeSlide + 1}/{steps.length}: {activeStep.title || activeStep.category || 'Pembahasan'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ height: '26px', padding: '0 8px' }}
                        disabled={safeSlide <= 0}
                        onClick={() => onSlideChange(Math.max(0, safeSlide - 1))}
                      >
                        <ChevronLeft style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ height: '26px', padding: '0 8px' }}
                        disabled={safeSlide >= steps.length - 1}
                        onClick={() => onSlideChange(Math.min(steps.length - 1, safeSlide + 1))}
                      >
                        <ChevronRight style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                    <MathText text={activeStep.content || ''} />
                  </div>
                </div>
              ) : question.solution?.staticContent ? (
                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  <MathText text={question.solution.staticContent} />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
