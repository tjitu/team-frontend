'use client';

import React from 'react';
import {
  Archive,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  buildSoalAsliSolutionPrompt,
  extractJsonFromLlmText,
  getSubtestDisplay,
  LIFECYCLE_SUBTESTS,
  normalizeSubtestKey,
  SoalAsliPackageDetail,
  SoalAsliPackageSummary,
  SoalAsliQuestionItem,
  SolutionStepItem,
} from './question-lifecycle-types';

type SoalAsliSectionProps = {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
};

type QuestionSolutionDraft = {
  correctOptionId: string;
  correctAnswer: string;
  keyFormula: string;
  quickTrick: string;
  staticExplanation: string;
  solutionSteps: SolutionStepItem[];
  llmJsonText: string;
};

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  return 'Terjadi kesalahan saat memproses data Arsip Soal.';
}

async function copyClipboardText(text: string): Promise<void> {
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
}

export function SoalAsliSection({ onNotice, onError }: SoalAsliSectionProps) {
  const [packages, setPackages] = React.useState<SoalAsliPackageSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [yearFilter, setYearFilter] = React.useState<string>('ALL');
  const [subtestFilter, setSubtestFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Package Detail & Solution Enrichment Modal State
  const [activePackage, setActivePackage] = React.useState<SoalAsliPackageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [detailFilterMissing, setDetailFilterMissing] = React.useState(false);
  const [copiedPromptId, setCopiedPromptId] = React.useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<QuestionSolutionDraft | null>(null);
  const [savingSolution, setSavingSolution] = React.useState(false);
  const [jsonFeedback, setJsonFeedback] = React.useState<string>('');

  const onErrorRef = React.useRef(onError);
  onErrorRef.current = onError;

  const loadPackages = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<SoalAsliPackageSummary[]>('/team/control-center/soal-asli/packages');
      setPackages(Array.isArray(data) ? data : []);
    } catch (cause) {
      onErrorRef.current(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  const availableYears = React.useMemo(() => {
    const set = new Set<number>(packages.map((p) => Number(p.year)).filter((y) => y > 0));
    return Array.from(set).sort((a, b) => b - a);
  }, [packages]);

  const filteredPackages = React.useMemo(() => {
    return packages.filter((pkg) => {
      if (yearFilter !== 'ALL' && String(pkg.year) !== yearFilter) return false;
      if (subtestFilter !== 'ALL' && normalizeSubtestKey(pkg.subtest) !== subtestFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [pkg.title, pkg.subtestName, pkg.subtest, pkg.dateLabel, pkg.slug, String(pkg.year)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [packages, yearFilter, subtestFilter, searchQuery]);

  const stats = React.useMemo(() => {
    const totalPackages = packages.length;
    const activePackages = packages.filter((p) => p.isActive).length;
    const totalQuestions = packages.reduce((acc, p) => acc + (p.actualQuestionCount || 0), 0);
    const totalSolved = packages.reduce((acc, p) => acc + (p.solvedCount || 0), 0);
    const totalKeyed = packages.reduce((acc, p) => acc + (p.keyedCount || 0), 0);
    return { totalPackages, activePackages, totalQuestions, totalSolved, totalKeyed };
  }, [packages]);

  async function togglePackageActive(pkg: SoalAsliPackageSummary) {
    setTogglingId(pkg.id);
    onError('');
    try {
      const updated = await api.patch<{ isActive: boolean }>(`/team/control-center/soal-asli/packages/${encodeURIComponent(pkg.id)}`, {
        isActive: !pkg.isActive,
      });
      const nextState = typeof updated?.isActive === 'boolean' ? updated.isActive : !pkg.isActive;
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, isActive: nextState } : p)));
      if (activePackage?.id === pkg.id) {
        setActivePackage((prev) => (prev ? { ...prev, isActive: nextState } : prev));
      }
      onNotice(`Paket "${pkg.title}" sekarang ${nextState ? 'Aktif (Ditampilkan ke siswa)' : 'Disembunyikan dari siswa'}.`);
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setTogglingId(null);
    }
  }

  async function openPackageDetail(pkgId: string) {
    setLoadingDetail(true);
    setEditingQuestionId(null);
    setDraft(null);
    setJsonFeedback('');
    onError('');
    try {
      const detail = await api.get<SoalAsliPackageDetail>(`/team/control-center/soal-asli/packages/${encodeURIComponent(pkgId)}`);
      setActivePackage(detail);
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setLoadingDetail(false);
    }
  }

  function startEditQuestionSolution(q: SoalAsliQuestionItem) {
    const correctOpt = q.options.find((o) => o.isCorrect);
    setEditingQuestionId(q.id);
    setJsonFeedback('');
    setDraft({
      correctOptionId: correctOpt?.id || '',
      correctAnswer: q.correctAnswer || '',
      keyFormula: q.solution?.keyFormula || '',
      quickTrick: q.solution?.quickTrick || '',
      staticExplanation: q.solution?.staticContent || '',
      solutionSteps:
        q.solution?.steps && q.solution.steps.length > 0
          ? q.solution.steps.map((s, idx) => ({
              stepNumber: s.stepNumber || idx + 1,
              category: s.category || `Langkah ${idx + 1}`,
              title: s.title || '',
              content: s.content || '',
            }))
          : [],
      llmJsonText: '',
    });
  }

  function applyLlmSolutionJson(q: SoalAsliQuestionItem) {
    if (!draft?.llmJsonText.trim()) return;
    try {
      const parsed = extractJsonFromLlmText(draft.llmJsonText);
      const data = Array.isArray(parsed) ? parsed[0] : parsed;
      if (!data || typeof data !== 'object') {
        setJsonFeedback('Format JSON tidak valid.');
        return;
      }

      let nextOptionId = draft.correctOptionId;
      if (q.options.length > 0) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        if (typeof data.correctOptionLetter === 'string') {
          const idx = letters.indexOf(data.correctOptionLetter.trim().toUpperCase());
          if (idx >= 0 && q.options[idx]) nextOptionId = q.options[idx].id;
        } else if (typeof data.correctOptionIndex === 'number' && q.options[data.correctOptionIndex]) {
          nextOptionId = q.options[data.correctOptionIndex].id;
        } else if (Array.isArray(data.options)) {
          const idx = data.options.findIndex((o: any) => Boolean(o?.isCorrect));
          if (idx >= 0 && q.options[idx]) nextOptionId = q.options[idx].id;
        } else if (typeof data.correctAnswer === 'string' && data.correctAnswer.trim().length === 1) {
          const idx = letters.indexOf(data.correctAnswer.trim().toUpperCase());
          if (idx >= 0 && q.options[idx]) nextOptionId = q.options[idx].id;
        }
      }

      const rawSteps = Array.isArray(data.solutionSteps)
        ? data.solutionSteps
        : Array.isArray(data.steps)
        ? data.steps
        : null;

      setDraft((prev) =>
        prev
          ? {
              ...prev,
              correctOptionId: nextOptionId,
              correctAnswer:
                q.options.length === 0 && typeof data.correctAnswer === 'string'
                  ? data.correctAnswer
                  : prev.correctAnswer,
              keyFormula: typeof data.keyFormula === 'string' ? data.keyFormula : prev.keyFormula,
              quickTrick: typeof data.quickTrick === 'string' ? data.quickTrick : prev.quickTrick,
              staticExplanation:
                typeof data.staticExplanation === 'string'
                  ? data.staticExplanation
                  : typeof data.staticContent === 'string'
                  ? data.staticContent
                  : prev.staticExplanation,
              solutionSteps: rawSteps
                ? rawSteps.map((s: any, idx: number) => ({
                    stepNumber: Number(s?.stepNumber) || idx + 1,
                    category: String(s?.category || `Langkah ${idx + 1}`),
                    title: String(s?.title || `Langkah ${idx + 1}`),
                    content: String(s?.content || ''),
                  }))
                : prev.solutionSteps,
            }
          : prev,
      );
      setJsonFeedback('JSON pembahasan berhasil diterapkan ke form! Periksa sebentar lalu klik Simpan.');
    } catch (cause) {
      setJsonFeedback(`Gagal membaca JSON: ${getErrorMessage(cause)}`);
    }
  }

  async function saveQuestionSolution(q: SoalAsliQuestionItem) {
    if (!draft || !activePackage) return;
    setSavingSolution(true);
    onError('');
    try {
      const payload: Record<string, unknown> = {
        keyFormula: draft.keyFormula.trim() || null,
        quickTrick: draft.quickTrick.trim() || null,
        staticExplanation: draft.staticExplanation.trim() || null,
        solutionSteps: draft.solutionSteps.map((s, idx) => ({
          stepNumber: idx + 1,
          category: s.category?.trim() || `Langkah ${idx + 1}`,
          title: s.title.trim() || `Langkah ${idx + 1}`,
          content: s.content.trim(),
        })),
      };

      if (q.options.length > 0) {
        payload.options = q.options.map((opt) => ({
          id: opt.id,
          content: opt.content,
          isCorrect: opt.id === draft.correctOptionId,
          order: opt.order,
        }));
      } else {
        payload.correctAnswer = draft.correctAnswer.trim() || null;
      }

      await api.patch(
        `/team/control-center/soal-asli/questions/${encodeURIComponent(q.id)}/solution`,
        payload,
      );

      onNotice(`Kunci & pembahasan Soal No. ${q.number} berhasil disimpan!`);
      const refreshedDetail = await api.get<SoalAsliPackageDetail>(
        `/team/control-center/soal-asli/packages/${encodeURIComponent(activePackage.id)}`,
      );
      setActivePackage(refreshedDetail);
      setEditingQuestionId(null);
      setDraft(null);
      void loadPackages();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setSavingSolution(false);
    }
  }

  const displayedDetailQuestions = React.useMemo(() => {
    if (!activePackage) return [];
    return activePackage.questions.filter((q) => {
      if (!detailFilterMissing) return true;
      const hasKey = q.options.some((o) => o.isCorrect) || Boolean(q.correctAnswer);
      const hasSol = Boolean(
        q.solution &&
          ((q.solution.steps && q.solution.steps.length > 0) ||
            q.solution.staticContent ||
            q.solution.quickTrick),
      );
      return !hasKey || !hasSol;
    });
  }, [activePackage, detailFilterMissing]);

  return (
    <section className="control-panel" aria-labelledby="arsip-heading">
      <div className="section-heading control-panel-heading">
        <div>
          <h2 id="arsip-heading">Arsip Soal UTBK / SNBT (Fixed Archive)</h2>
          <p>
            Koleksi paket soal historis resmi (target <code>SOAL_ASLI</code>). Naskah soal dikunci tetap (read-only) untuk menjaga keaslian arsip; admin mengatur status tayang paket dan melengkapi Kunci Jawaban + Pembahasan.
          </p>
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => void loadPackages()}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* ARCHIVE SUMMARY STRIP */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Total Paket Arsip</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
            {stats.totalPackages} Paket
          </div>
          <div style={{ fontSize: '11px', color: '#34d399' }}>{stats.activePackages} paket aktif tayang</div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Total Butir Soal Historis</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
            {stats.totalQuestions.toLocaleString('id-ID')} Soal
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Naskah & opsi terproteksi read-only</div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Kelengkapan Kunci Jawaban</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
            {stats.totalKeyed.toLocaleString('id-ID')} / {stats.totalQuestions.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            {stats.totalQuestions > 0 ? Math.round((stats.totalKeyed / stats.totalQuestions) * 100) : 0}% berkunci
          </div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>Kelengkapan Pembahasan</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
            {stats.totalSolved.toLocaleString('id-ID')} / {stats.totalQuestions.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            {stats.totalQuestions > 0 ? Math.round((stats.totalSolved / stats.totalQuestions) * 100) : 0}% terbahas
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search style={{ width: 14, height: 14, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }} />
          <input
            type="text"
            className="field-input"
            style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '12px' }}
            placeholder="Cari paket arsip (judul, tahun, label sesi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="field-input"
          style={{ width: '150px', height: '36px', fontSize: '12px' }}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="ALL">Semua Tahun</option>
          {availableYears.map((yr) => (
            <option key={yr} value={String(yr)}>
              Tahun {yr}
            </option>
          ))}
        </select>

        <select
          className="field-input"
          style={{ width: '230px', height: '36px', fontSize: '12px' }}
          value={subtestFilter}
          onChange={(e) => setSubtestFilter(e.target.value)}
        >
          <option value="ALL">Semua Subtes</option>
          {LIFECYCLE_SUBTESTS.map((sub) => (
            <option key={sub.value} value={sub.value}>
              [{sub.code}] {sub.label}
            </option>
          ))}
        </select>

        {(yearFilter !== 'ALL' || subtestFilter !== 'ALL' || searchQuery.trim()) && (
          <button
            type="button"
            className="button button-secondary"
            style={{ height: '36px', fontSize: '12px' }}
            onClick={() => {
              setYearFilter('ALL');
              setSubtestFilter('ALL');
              setSearchQuery('');
            }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* PACKAGES TABLE */}
      {loading ? (
        <div className="control-empty">Memuat daftar paket Arsip Soal…</div>
      ) : filteredPackages.length === 0 ? (
        <div className="control-empty">Tidak ada paket arsip soal yang cocok dengan filter.</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Tahun & Subtes</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Nama Paket Arsip</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Kelengkapan Kunci & Bahas</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Status Tayang</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => {
                const sub = getSubtestDisplay(pkg.subtest);
                const totalQ = pkg.actualQuestionCount || pkg.questionCount || 0;
                const fullySolved = totalQ > 0 && pkg.solvedCount >= totalQ && pkg.keyedCount >= totalQ;
                return (
                  <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{pkg.year}</span>
                        <span className="pill" style={{ background: 'rgba(99, 102, 241, 0.16)', color: '#a5b4fc' }}>
                          {sub.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted-fg)', marginTop: '2px' }}>
                        {pkg.durationMinutes} menit
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{pkg.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                        {pkg.dateLabel || pkg.archiveLabel || pkg.slug}
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: pkg.keyedCount >= totalQ && totalQ > 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                            color: pkg.keyedCount >= totalQ && totalQ > 0 ? '#34d399' : '#fbbf24',
                          }}
                        >
                          Kunci: {pkg.keyedCount}/{totalQ}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: fullySolved ? 'rgba(59, 130, 246, 0.16)' : 'rgba(113, 113, 122, 0.16)',
                            color: fullySolved ? '#60a5fa' : '#a1a1aa',
                          }}
                        >
                          Bahas: {pkg.solvedCount}/{totalQ}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <button
                        type="button"
                        disabled={togglingId === pkg.id}
                        onClick={() => void togglePackageActive(pkg)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          border: pkg.isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(113, 113, 122, 0.4)',
                          background: pkg.isActive ? 'rgba(16, 185, 129, 0.14)' : 'rgba(113, 113, 122, 0.14)',
                          color: pkg.isActive ? '#34d399' : '#a1a1aa',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {pkg.isActive ? <Eye style={{ width: 12, height: 12 }} /> : <EyeOff style={{ width: 12, height: 12 }} />}
                        {togglingId === pkg.id ? 'Menyimpan...' : pkg.isActive ? 'Tayang' : 'Tersembunyi'}
                      </button>
                    </td>

                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ height: '30px', padding: '0 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => void openPackageDetail(pkg.id)}
                      >
                        <BookOpen style={{ width: 13, height: 13 }} />
                        <span>Naskah & Pembahasan ({totalQ})</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PACKAGE DETAIL MODAL */}
      {(loadingDetail || activePackage) && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!savingSolution) setActivePackage(null);
          }}
        >
          <div
            className="modal-dialog modal-wide"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '1040px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Archive style={{ width: 16, height: 16, color: 'var(--muted-fg)' }} />
                  <h3 style={{ margin: 0 }}>
                    {activePackage ? activePackage.title : 'Memuat Paket Arsip...'}
                  </h3>
                </div>
                {activePackage && (
                  <small style={{ color: 'var(--muted-fg)', display: 'block', marginTop: '3px' }}>
                    Tahun {activePackage.year} · {activePackage.subtestName} · {activePackage.questions.length} Soal · Status: {activePackage.isActive ? 'Tayang' : 'Disembunyikan'}
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activePackage && (
                  <button
                    type="button"
                    className={`filter-btn ${detailFilterMissing ? 'is-active' : ''}`}
                    style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}
                    onClick={() => setDetailFilterMissing((v) => !v)}
                  >
                    {detailFilterMissing ? 'Menampilkan Soal Belum Lengkap' : 'Filter: Belum Kunci / Bahas'}
                  </button>
                )}
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setActivePackage(null)}
                  aria-label="Tutup detail paket"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  color: 'var(--muted-fg)',
                }}
              >
                <Lock style={{ width: 15, height: 15, flexShrink: 0, color: 'var(--muted-fg)' }} />
                <span>
                  Naskah soal dan opsi jawaban bersifat <strong style={{ color: 'var(--foreground)' }}>read-only (terkunci)</strong> demi integritas arsip resmi. Anda bisa menggunakan <strong style={{ color: 'var(--foreground)' }}>Salin Prompt Bahas ke LLM</strong> lalu tempel hasilnya atau edit kunci & pembahasan secara manual.
                </span>
              </div>

              {loadingDetail ? (
                <div className="control-empty">Memuat seluruh butir soal arsip…</div>
              ) : displayedDetailQuestions.length === 0 ? (
                <div className="control-empty">Semua soal pada paket ini sudah memiliki kunci jawaban dan pembahasan!</div>
              ) : (
                displayedDetailQuestions.map((q) => {
                  const isEditing = editingQuestionId === q.id && draft !== null;
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  const hasKey = q.options.some((o) => o.isCorrect) || Boolean(q.correctAnswer);
                  const hasSol = Boolean(
                    q.solution &&
                      ((q.solution.steps && q.solution.steps.length > 0) ||
                        q.solution.staticContent ||
                        q.solution.quickTrick),
                  );

                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: isEditing ? '1.5px solid var(--foreground)' : '1px solid var(--border)',
                        background: 'var(--surface)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--foreground)' }}>
                            Soal No. {q.number}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: hasKey ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)',
                              color: hasKey ? '#10b981' : '#ef4444',
                            }}
                          >
                            {hasKey ? '✓ Ada Kunci' : '✕ Kunci Kosong'}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: hasSol ? 'var(--muted-bg)' : 'rgba(245, 158, 11, 0.14)',
                              color: hasSol ? 'var(--foreground)' : '#f59e0b',
                              border: hasSol ? '1px solid var(--border)' : 'none',
                            }}
                          >
                            {hasSol ? '✓ Ada Pembahasan' : 'Pembahasan Kosong'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ height: '30px', fontSize: '11px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={async () => {
                              await copyClipboardText(buildSoalAsliSolutionPrompt(q, activePackage?.title || 'Arsip UTBK'));
                              setCopiedPromptId(q.id);
                              setTimeout(() => setCopiedPromptId(null), 2000);
                            }}
                          >
                            {copiedPromptId === q.id ? <Check style={{ width: 13, height: 13 }} /> : <ClipboardCopy style={{ width: 13, height: 13 }} />}
                            <span>{copiedPromptId === q.id ? 'Prompt Disalin!' : 'Copy Prompt Bahas ke LLM'}</span>
                          </button>

                          <button
                            type="button"
                            className={`button ${isEditing ? 'button-secondary' : 'button-primary'}`}
                            style={{ height: '30px', fontSize: '11px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              if (isEditing) {
                                setEditingQuestionId(null);
                                setDraft(null);
                              } else {
                                startEditQuestionSolution(q);
                              }
                            }}
                          >
                            <Sparkles style={{ width: 13, height: 13 }} />
                            <span>{isEditing ? 'Tutup Editor' : 'Lengkapi Kunci & Bahas'}</span>
                          </button>
                        </div>
                      </div>

                      {/* READ-ONLY QUESTION CONTENT */}
                      {q.narration && (
                        <div style={{ fontSize: '12px', color: 'var(--muted-fg)', padding: '8px 10px', borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                          {q.narration}
                        </div>
                      )}
                      <div style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                        {q.content}
                      </div>

                      {q.options.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '6px' }}>
                          {q.options.map((opt, idx) => (
                            <div
                              key={opt.id}
                              style={{
                                fontSize: '12px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: opt.isCorrect ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border)',
                                background: opt.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                color: opt.isCorrect ? '#34d399' : 'var(--foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <strong>{letters[idx] || idx + 1}.</strong>
                              <span style={{ flex: 1 }}>{opt.content}</span>
                              {opt.isCorrect && <CheckCircle2 style={{ width: 13, height: 13, flexShrink: 0 }} />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#34d399' }}>
                          Kunci Isian Singkat: <strong>{q.correctAnswer || '(Belum diisi)'}</strong>
                        </div>
                      )}

                      {/* INLINE ENRICHMENT EDITOR (JSON PASTE + MANUAL FALLBACK) */}
                      {isEditing && draft && (
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed rgba(251, 191, 36, 0.4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Paste JSON Box */}
                          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
                                Tempel Output JSON dari LLM (Opsional)
                              </label>
                              <button
                                type="button"
                                className="button button-secondary"
                                style={{ height: '26px', fontSize: '11px', padding: '0 10px' }}
                                onClick={() => applyLlmSolutionJson(q)}
                              >
                                Terapkan JSON ke Form
                              </button>
                            </div>
                            <textarea
                              className="field-input"
                              rows={3}
                              style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px' }}
                              placeholder='Tempel JSON dari ChatGPT/Claude/Gemini di sini, lalu klik "Terapkan JSON ke Form"...'
                              value={draft.llmJsonText}
                              onChange={(e) => setDraft({ ...draft, llmJsonText: e.target.value })}
                            />
                            {jsonFeedback && (
                              <div style={{ fontSize: '11px', color: jsonFeedback.startsWith('Gagal') ? '#fb7185' : '#34d399', marginTop: '4px' }}>
                                {jsonFeedback}
                              </div>
                            )}
                          </div>

                          {/* Kunci Jawaban Selector */}
                          {q.options.length > 0 ? (
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>
                                Pilih Kunci Jawaban Benar
                              </label>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {q.options.map((opt, idx) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setDraft({ ...draft, correctOptionId: opt.id })}
                                    className={`filter-btn ${draft.correctOptionId === opt.id ? 'is-active' : ''}`}
                                    style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                                  >
                                    Opsi {letters[idx] || idx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                Kunci Jawaban Isian Singkat
                              </label>
                              <input
                                type="text"
                                className="field-input"
                                style={{ width: '260px', fontSize: '12px' }}
                                value={draft.correctAnswer}
                                onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
                                placeholder="Masukkan kunci jawaban..."
                              />
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                Rumus Kunci (Key Formula)
                              </label>
                              <input
                                type="text"
                                className="field-input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={draft.keyFormula}
                                onChange={(e) => setDraft({ ...draft, keyFormula: e.target.value })}
                                placeholder="Contoh: $x = \\frac{-b}{2a}$"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                Trik Cepat (Quick Trick)
                              </label>
                              <input
                                type="text"
                                className="field-input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={draft.quickTrick}
                                onChange={(e) => setDraft({ ...draft, quickTrick: e.target.value })}
                                placeholder="Cara cepat menyingkirkan pengecoh..."
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                              Ringkasan Pembahasan Statis (Static Explanation)
                            </label>
                            <textarea
                              className="field-input"
                              rows={2}
                              style={{ width: '100%', fontSize: '12px' }}
                              value={draft.staticExplanation}
                              onChange={(e) => setDraft({ ...draft, staticExplanation: e.target.value })}
                              placeholder="Penjelasan ringkas keseluruhan soal..."
                            />
                          </div>

                          {/* Solution Steps */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)' }}>
                                Langkah Pembahasan Bertahap ({draft.solutionSteps.length})
                              </label>
                              <button
                                type="button"
                                className="button button-secondary"
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() =>
                                  setDraft({
                                    ...draft,
                                    solutionSteps: [
                                      ...draft.solutionSteps,
                                      {
                                        stepNumber: draft.solutionSteps.length + 1,
                                        category: `Langkah ${draft.solutionSteps.length + 1}`,
                                        title: '',
                                        content: '',
                                      },
                                    ],
                                  })
                                }
                              >
                                <Plus style={{ width: 12, height: 12 }} />
                                Tambah Langkah
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {draft.solutionSteps.map((step, sIdx) => (
                                <div key={sIdx} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      className="field-input"
                                      style={{ width: '140px', height: '30px', fontSize: '11px' }}
                                      value={step.category || ''}
                                      onChange={(e) => {
                                        const next = [...draft.solutionSteps];
                                        next[sIdx] = { ...next[sIdx], category: e.target.value };
                                        setDraft({ ...draft, solutionSteps: next });
                                      }}
                                      placeholder="Kategori"
                                    />
                                    <input
                                      type="text"
                                      className="field-input"
                                      style={{ flex: 1, height: '30px', fontSize: '11px' }}
                                      value={step.title}
                                      onChange={(e) => {
                                        const next = [...draft.solutionSteps];
                                        next[sIdx] = { ...next[sIdx], title: e.target.value };
                                        setDraft({ ...draft, solutionSteps: next });
                                      }}
                                      placeholder="Judul langkah..."
                                    />
                                    <button
                                      type="button"
                                      className="button button-secondary"
                                      style={{ height: '30px', padding: '0 8px', color: '#fb7185' }}
                                      onClick={() => {
                                        const next = draft.solutionSteps.filter((_, i) => i !== sIdx);
                                        setDraft({ ...draft, solutionSteps: next });
                                      }}
                                    >
                                      <Trash2 style={{ width: 12, height: 12 }} />
                                    </button>
                                  </div>
                                  <textarea
                                    className="field-input"
                                    rows={2}
                                    style={{ width: '100%', fontSize: '12px' }}
                                    value={step.content}
                                    onChange={(e) => {
                                      const next = [...draft.solutionSteps];
                                      next[sIdx] = { ...next[sIdx], content: e.target.value };
                                      setDraft({ ...draft, solutionSteps: next });
                                    }}
                                    placeholder="Isi langkah pembahasan..."
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() => {
                                setEditingQuestionId(null);
                                setDraft(null);
                              }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              className="button button-primary"
                              style={{ color: '#000', fontWeight: 700 }}
                              disabled={savingSolution}
                              onClick={() => void saveQuestionSolution(q)}
                            >
                              {savingSolution ? 'Menyimpan...' : 'Simpan Kunci & Pembahasan'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
