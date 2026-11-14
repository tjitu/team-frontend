'use client';

import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MathText } from './math-text';
import {
  getDifficultyMeta,
  getQuestionStatusBadge,
  getSubtestDisplay,
  normalizeSubtestKey,
  type QuestionStatusType,
  type TryoutCurriculumTopic,
} from './question-lifecycle-types';
import { QuestionPreviewModal, RevisionRequestModal } from './question-workflow-modals';
import { AutoBalanceAdjusterModal } from './auto-balance-adjuster-modal';

export type PracticeAssignedQuestion = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  pattern?: string | null;
  batch?: string | null;
  difficulty: string;
  type: string;
  target: string;
  status: string;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  tryoutId?: string | null;
  narration?: string | null;
  content: string;
  imageUrl?: string | null;
  points: number;
  correctAnswer?: string | null;
  createdAt: string;
  updatedAt?: string;
  assignedAt?: string | null;
  assignedBy?: string | null;
  sortOrder?: number | null;
  isLiveInPractice?: boolean;
  subtopicTitle?: string | null;
  topicTitle?: string | null;
  tryoutTitle?: string | null;
  tryoutStatus?: string | null;
  answeredCount: number;
  skippedCount: number;
  options: Array<{ id?: string; content: string; isCorrect: boolean; order: number }>;
  solution?: {
    id: string;
    steps: Array<{ order: number; title: string; content: string }>;
    staticContent?: string | null;
    quickTrick?: string | null;
    keyFormula?: string | null;
    defaultView?: string | null;
  } | null;
};

type PracticePickerQuestion = {
  id: string;
  subtest: string;
  topicId?: string | null;
  subtopicId?: string | null;
  pattern?: string | null;
  batch?: string | null;
  difficulty: string;
  type: string;
  target: string;
  status: string;
  tryoutId?: string | null;
  narration?: string | null;
  content: string;
  points: number;
  createdAt: string;
  subtopicTitle?: string | null;
  topicTitle?: string | null;
  tryoutTitle?: string | null;
  tryoutStatus?: string | null;
  isLockedInTryout: boolean;
  hasSolution: boolean;
};

type SubtestStockStat = {
  total: number;
  minRemaining: number;
  maxAccessed: number;
};

type PracticeWorkspaceResponse = {
  assignedQuestions: PracticeAssignedQuestion[];
  pickerPool: PracticePickerQuestion[];
  subtestStocks: Record<string, number>;
  subtestStockStats?: Record<string, SubtestStockStat>;
};

const SUBTEST_CARDS = [
  { key: 'PENALARAN_UMUM', short: 'PU', label: 'Penalaran Umum' },
  { key: 'PENGETAHUAN_PEMAHAMAN_UMUM', short: 'PPU', label: 'Pengetahuan & Pemahaman Umum' },
  { key: 'PEMAHAMAN_BACAAN_MENULIS', short: 'PBM', label: 'Pemahaman Bacaan & Menulis' },
  { key: 'PENGETAHUAN_KUANTITATIF', short: 'PK', label: 'Pengetahuan Kuantitatif' },
  { key: 'LITERASI_INDONESIA', short: 'LBI', label: 'Literasi Bahasa Indonesia' },
  { key: 'LITERASI_INGGRIS', short: 'LBE', label: 'Literasi Bahasa Inggris' },
  { key: 'PENALARAN_MATEMATIKA', short: 'PM', label: 'Penalaran Matematika' },
];

const STATUS_TABS: Array<{ key: 'ALL' | QuestionStatusType; label: string }> = [
  { key: 'ALL', label: 'Semua Soal Latihan' },
  { key: 'DRAFT', label: 'Draf' },
  { key: 'QC_SANDBOX', label: 'Antrean QC (Sandbox)' },
  { key: 'NEEDS_REVISION', label: 'Kotak Revisi' },
  { key: 'READY', label: 'Tayang di /latihan (Ready)' },
];

function stripMarkdownPreview(raw: string): string {
  return (raw || '').replace(/\s+/g, ' ').trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan saat memproses permintaan.';
}

export function PracticeSection({
  jituMainUrl = 'http://localhost:5173',
  curriculumTopics = [],
  onError,
  onNotice,
  onOpenCreateForPractice,
  onEditQuestion,
  onQuestionsChanged,
}: {
  jituMainUrl?: string;
  curriculumTopics?: TryoutCurriculumTopic[];
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
  onOpenCreateForPractice?: () => void;
  onEditQuestion?: (question: PracticeAssignedQuestion) => void;
  onQuestionsChanged?: () => void;
}) {
  const [workspace, setWorkspace] = React.useState<PracticeWorkspaceResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [subtestFilter, setSubtestFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | QuestionStatusType>('ALL');
  const [batchFilter, setBatchFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [selectedTableIds, setSelectedTableIds] = React.useState<string[]>([]);
  const [busyQuestionId, setBusyQuestionId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState<string | null>(null);
  const [revisionTargetQuestion, setRevisionTargetQuestion] = React.useState<PracticeAssignedQuestion | null>(null);
  const [revisionNotesDraft, setRevisionNotesDraft] = React.useState('');
  const [revisionSaving, setRevisionSaving] = React.useState(false);
  const [previewSlideIdx, setPreviewSlideIdx] = React.useState(0);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSubtest, setPickerSubtest] = React.useState<string>('ALL');
  const [pickerBatch, setPickerBatch] = React.useState<string>('ALL');
  const [pickerSearch, setPickerSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [assigning, setAssigning] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const [previewQuestion, setPreviewQuestion] = React.useState<PracticeAssignedQuestion | null>(null);
  const [autoBalanceModalOpen, setAutoBalanceModalOpen] = React.useState(false);

  const onErrorRef = React.useRef(onError);
  const onQuestionsChangedRef = React.useRef(onQuestionsChanged);
  React.useEffect(() => {
    onErrorRef.current = onError;
    onQuestionsChangedRef.current = onQuestionsChanged;
  });

  const loadWorkspace = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PracticeWorkspaceResponse>('/team/control-center/practice');
      setWorkspace(data);
    } catch (cause) {
      onErrorRef.current(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const assignedQuestions = React.useMemo(
    () => workspace?.assignedQuestions ?? [],
    [workspace],
  );
  const pickerPool = React.useMemo(
    () => workspace?.pickerPool ?? [],
    [workspace],
  );
  const stocks = workspace?.subtestStocks ?? {};
  const stockStats = workspace?.subtestStockStats ?? {};

  const statusCounts = React.useMemo(() => {
    const counts: Record<'ALL' | QuestionStatusType, number> = {
      ALL: assignedQuestions.length,
      DRAFT: 0,
      QC_SANDBOX: 0,
      NEEDS_REVISION: 0,
      READY: 0,
      RETIRED: 0,
    };
    for (const q of assignedQuestions) {
      const st = String(q.status || 'DRAFT').toUpperCase() as QuestionStatusType;
      if (st in counts) counts[st] += 1;
    }
    return counts;
  }, [assignedQuestions]);

  const assignedBatchOptions = React.useMemo(() => {
    const map = new Map<string, number>();
    let noBatch = 0;
    for (const q of assignedQuestions) {
      const clean = (q.batch || '').trim();
      if (!clean) {
        noBatch += 1;
      } else {
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    }
    return {
      batches: Array.from(map.entries()).map(([batch, count]) => ({ batch, count })),
      noBatchCount: noBatch,
    };
  }, [assignedQuestions]);

  const pickerBatchOptions = React.useMemo(() => {
    const map = new Map<string, number>();
    let noBatch = 0;
    for (const q of pickerPool) {
      const clean = (q.batch || '').trim();
      if (!clean) {
        noBatch += 1;
      } else {
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    }
    return {
      batches: Array.from(map.entries()).map(([batch, count]) => ({ batch, count })),
      noBatchCount: noBatch,
    };
  }, [pickerPool]);

  const filteredAssigned = React.useMemo(() => {
    return assignedQuestions.filter((q) => {
      if (subtestFilter !== 'ALL' && normalizeSubtestKey(q.subtest) !== subtestFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && String(q.status || 'DRAFT').toUpperCase() !== statusFilter) {
        return false;
      }
      if (batchFilter !== 'ALL') {
        const cleanBatch = (q.batch || '').trim();
        if (batchFilter === '__NONE__' && cleanBatch !== '') return false;
        if (batchFilter !== '__NONE__' && cleanBatch !== batchFilter) return false;
      }
      if (searchQuery.trim()) {
        const needle = searchQuery.toLowerCase();
        const hay = `${q.id} ${q.content} ${q.topicTitle || ''} ${q.subtopicTitle || ''} ${q.batch || ''} ${q.revisionNotes || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [assignedQuestions, subtestFilter, statusFilter, batchFilter, searchQuery]);

  const filteredPicker = React.useMemo(() => {
    return pickerPool.filter((q) => {
      if (pickerSubtest !== 'ALL' && normalizeSubtestKey(q.subtest) !== pickerSubtest) {
        return false;
      }
      if (pickerBatch !== 'ALL') {
        const cleanBatch = (q.batch || '').trim();
        if (pickerBatch === '__NONE__' && cleanBatch !== '') return false;
        if (pickerBatch !== '__NONE__' && cleanBatch !== pickerBatch) return false;
      }
      if (pickerSearch.trim()) {
        const needle = pickerSearch.toLowerCase();
        const hay = `${q.id} ${q.content} ${q.topicTitle || ''} ${q.subtopicTitle || ''} ${q.batch || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [pickerPool, pickerSubtest, pickerBatch, pickerSearch]);

  const selectableFilteredIds = React.useMemo(
    () => filteredPicker.filter((q) => !q.isLockedInTryout).map((q) => q.id),
    [filteredPicker],
  );

  async function handleQuestionWorkflow(
    questionId: string,
    action: 'SUBMIT_QC' | 'RESUBMIT_QC' | 'APPROVE' | 'PULL_TO_DRAFT',
  ) {
    setBusyQuestionId(questionId);
    onError('');
    try {
      await api.post(`/team/control-center/questions/${encodeURIComponent(questionId)}/workflow`, {
        action,
      });
      const msgMap: Record<typeof action, string> = {
        SUBMIT_QC: 'Soal Latihan diajukan ke Antrean QC (Sandbox).',
        RESUBMIT_QC: 'Soal Latihan hasil revisi diajukan ulang ke Antrean QC.',
        APPROVE: 'Soal di-ACC ke Siap (Ready) dan langsung tayang di /latihan!',
        PULL_TO_DRAFT: 'Soal ditarik dari /latihan kembali ke Draf.',
      };
      onNotice(msgMap[action]);
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setBusyQuestionId(null);
    }
  }

  async function handleConfirmRevision() {
    if (!revisionTargetQuestion) return;
    setRevisionSaving(true);
    onError('');
    try {
      await api.post(
        `/team/control-center/questions/${encodeURIComponent(revisionTargetQuestion.id)}/workflow`,
        {
          action: 'REQUEST_REVISION',
          revisionNotes: revisionNotesDraft,
        },
      );
      onNotice(`Soal ${revisionTargetQuestion.id} dipindahkan ke Kotak Revisi.`);
      setRevisionTargetQuestion(null);
      setRevisionNotesDraft('');
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setRevisionSaving(false);
    }
  }

  async function handleOpenQuestionSandbox(questionId: string) {
    setBusyQuestionId(questionId);
    onError('');
    try {
      const res = await api.post<{ token: string }>('/team/control-center/sandbox-preview', {
        questionId,
      });
      const url = new URL('/sandbox', jituMainUrl);
      url.searchParams.set('token', res.token);
      url.searchParams.set('questionId', questionId);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      onNotice('Pratinjau soal di Sandbox dibuka di tab baru.');
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setBusyQuestionId(null);
    }
  }

  async function handleBulkStatusChange(nextStatus: 'DRAFT' | 'QC_SANDBOX' | 'READY') {
    if (selectedTableIds.length === 0) return;
    setBulkBusy(nextStatus);
    onError('');
    try {
      const res = await api.post<{ updatedCount: number }>(
        '/team/control-center/questions/bulk-status',
        {
          questionIds: selectedTableIds,
          status: nextStatus,
        },
      );
      const labelMap: Record<typeof nextStatus, string> = {
        DRAFT: 'Draf (ditarik dari /latihan)',
        QC_SANDBOX: 'Antrean QC (Sandbox)',
        READY: 'Siap & Tayang di /latihan',
      };
      onNotice(`${res.updatedCount} soal Latihan berhasil digeser ke ${labelMap[nextStatus]}.`);
      setSelectedTableIds([]);
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setBulkBusy(null);
    }
  }

  async function handleAssignSelected() {
    if (selectedIds.length === 0) return;
    setAssigning(true);
    onError('');
    try {
      const res = await api.post<{ assignedCount: number }>(
        '/team/control-center/practice/assign',
        { questionIds: selectedIds },
      );
      onNotice(`Berhasil memasukkan ${res.assignedCount ?? selectedIds.length} soal ke paket Latihan.`);
      setSelectedIds([]);
      setPickerOpen(false);
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign(questionId: string) {
    setRemovingId(questionId);
    onError('');
    try {
      await api.delete(`/team/control-center/practice/assign/${encodeURIComponent(questionId)}`);
      onNotice('Soal dikeluarkan dari Latihan dan dikembalikan ke Eksperimen (Bank Soal).');
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setRemovingId(null);
    }
  }

  const allFilteredSelected =
    filteredAssigned.length > 0 && filteredAssigned.every((q) => selectedTableIds.includes(q.id));

  return (
    <section className="control-panel" aria-labelledby="practice-heading">
      {/* HEADER */}
      <div className="section-heading control-panel-heading">
        <div>
          <span className="section-kicker">Kurasi &amp; Stok Soal</span>
          <h2 id="practice-heading">Manajemen Soal Latihan (/latihan)</h2>
          <p>
            Kelola seluruh soal Latihan mulai dari <strong>Draf → Antrean QC (Sandbox) → Kotak Revisi → Tayang di /latihan</strong>. Soal yang di-ACC ke <strong>Siap (Ready)</strong> otomatis langsung tayang ke siswa di <code>/latihan</code>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadWorkspace()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setAutoBalanceModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.08)',
            }}
          >
            <Sliders style={{ width: 14, height: 14 }} />
            <span>Atur Auto-Balance Latihan</span>
          </button>
          {onOpenCreateForPractice && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => onOpenCreateForPractice()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#000', fontWeight: 700 }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              <span>Buat Soal Latihan Baru</span>
            </button>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setSelectedIds([]);
              setPickerSubtest(subtestFilter);
              setPickerBatch('ALL');
              setPickerOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            <span>Ambil dari Bank / Eksperimen ({pickerPool.filter((q) => !q.isLockedInTryout).length})</span>
          </button>
        </div>
      </div>

      {/* SUBTEST STOCK CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {SUBTEST_CARDS.map((card) => {
          const count = stocks[card.key] ?? 0;
          const totalInPipeline = assignedQuestions.filter((q) => normalizeSubtestKey(q.subtest) === card.key).length;
          const stat = stockStats[card.key];
          const minRemaining = stat ? stat.minRemaining : count;
          const maxAccessed = stat ? stat.maxAccessed : 0;
          const active = subtestFilter === card.key;
          const isDepletedForTopUser = count === 0 || minRemaining === 0;
          const isLowForTopUser = !isDepletedForTopUser && minRemaining < 5;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setSubtestFilter(active ? 'ALL' : card.key)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '10px',
                border: active
                  ? '1px solid #38bdf8'
                  : isDepletedForTopUser
                    ? '1px solid rgba(248, 113, 113, 0.35)'
                    : '1px solid var(--border)',
                background: active
                  ? 'rgba(56, 189, 248, 0.1)'
                  : isDepletedForTopUser
                    ? 'rgba(248, 113, 113, 0.05)'
                    : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{card.short}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isDepletedForTopUser
                      ? 'rgba(239, 68, 68, 0.18)'
                      : isLowForTopUser
                        ? 'rgba(245, 158, 11, 0.18)'
                        : 'rgba(16, 185, 129, 0.16)',
                    color: isDepletedForTopUser ? '#f87171' : isLowForTopUser ? '#fbbf24' : '#34d399',
                    fontWeight: 600,
                  }}
                >
                  {count === 0
                    ? 'Kosong'
                    : isDepletedForTopUser
                      ? 'Habis (Siswa Aktif)'
                      : isLowForTopUser
                        ? `Sisa ${minRemaining}`
                        : 'Aman'}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                {count}{' '}
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-fg)' }}>
                  tayang ({totalInPipeline} total)
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted-fg)', marginTop: '2px' }}>{card.label}</div>
              {maxAccessed > 0 && (
                <div style={{ fontSize: '10px', color: isDepletedForTopUser ? '#fca5a5' : 'var(--muted-fg)', marginTop: '4px' }}>
                  Siswa teraktif sudah akses {maxAccessed}/{count} soal
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* LIFECYCLE STATUS TABS */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          const cnt = statusCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={active ? 'button button-primary' : 'button button-secondary'}
              style={{
                height: '34px',
                padding: '0 12px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="pill"
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  background: active ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.08)',
                  color: active ? '#fff' : 'var(--muted-fg)',
                }}
              >
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* BULK QC BAR */}
      {selectedTableIds.length > 0 && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            background: 'rgba(14, 165, 233, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e0f2fe' }}>
            {selectedTableIds.length} soal Latihan dipilih
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button button-secondary"
              disabled={bulkBusy !== null}
              onClick={() => void handleBulkStatusChange('QC_SANDBOX')}
              style={{ height: '30px', fontSize: '11px', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.4)' }}
            >
              {bulkBusy === 'QC_SANDBOX' ? 'Memproses…' : 'Geser ke Antrean QC'}
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={bulkBusy !== null}
              onClick={() => void handleBulkStatusChange('READY')}
              style={{ height: '30px', fontSize: '11px', background: '#059669', borderColor: '#10b981' }}
            >
              {bulkBusy === 'READY' ? 'Memproses…' : 'ACC & Tayangkan di /latihan'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={bulkBusy !== null}
              onClick={() => void handleBulkStatusChange('DRAFT')}
              style={{ height: '30px', fontSize: '11px' }}
            >
              {bulkBusy === 'DRAFT' ? 'Memproses…' : 'Tarik ke Draf'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSelectedTableIds([])}
              style={{ height: '30px', fontSize: '11px' }}
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            style={{
              width: 14,
              height: 14,
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted-fg)',
            }}
          />
          <input
            type="search"
            className="field-input"
            placeholder="Cari ID soal, pertanyaan, topik, catatan revisi, atau batch…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', width: '100%' }}
          />
        </div>

        <select
          className="field-input"
          value={subtestFilter}
          onChange={(e) => setSubtestFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '200px' }}
        >
          <option value="ALL">Semua Subtes ({assignedQuestions.length})</option>
          {SUBTEST_CARDS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.short} — {c.label}
            </option>
          ))}
        </select>

        <select
          className="field-input"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '175px' }}
        >
          <option value="ALL">Semua Batch</option>
          {assignedBatchOptions.batches.map((item) => (
            <option key={item.batch} value={item.batch}>
              Batch: {item.batch} ({item.count})
            </option>
          ))}
          {assignedBatchOptions.noBatchCount > 0 && (
            <option value="__NONE__">Tanpa Batch ({assignedBatchOptions.noBatchCount})</option>
          )}
        </select>
      </div>

      {/* ASSIGNED QUESTIONS TABLE WITH FULL QC WORKFLOW */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={() => {
                    if (allFilteredSelected) {
                      const removeSet = new Set(filteredAssigned.map((q) => q.id));
                      setSelectedTableIds((prev) => prev.filter((id) => !removeSet.has(id)));
                    } else {
                      setSelectedTableIds((prev) =>
                        Array.from(new Set([...prev, ...filteredAssigned.map((q) => q.id)])),
                      );
                    }
                  }}
                />
              </th>
              <th>ID &amp; Batch</th>
              <th>Status QC &amp; Tayang</th>
              <th>Subtes &amp; Topik</th>
              <th>Kesulitan</th>
              <th>Cuplikan Soal &amp; Catatan QC</th>
              <th>Statistik Siswa</th>
              <th style={{ textAlign: 'right' }}>Aksi QC &amp; Latihan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-copy">
                  Memuat daftar soal latihan…
                </td>
              </tr>
            ) : filteredAssigned.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-copy">
                  Belum ada soal latihan pada filter ini. Klik <strong>Buat Soal Latihan Baru</strong> atau ambil dari Bank Soal.
                </td>
              </tr>
            ) : (
              filteredAssigned.map((q) => {
                const subDisplay = getSubtestDisplay(q.subtest);
                const diffMeta = getDifficultyMeta(q.difficulty);
                const statusBadge = getQuestionStatusBadge(q.status);
                const statusUpper = String(q.status || 'DRAFT').toUpperCase();
                const isBusy = busyQuestionId === q.id;
                const isChecked = selectedTableIds.includes(q.id);

                return (
                  <tr key={q.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedTableIds((prev) =>
                            prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id],
                          );
                        }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <code style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>{q.id}</code>
                        {q.batch && (
                          <span
                            className="pill"
                            style={{
                              fontSize: '10px',
                              padding: '1px 7px',
                              background: 'rgba(245, 158, 11, 0.14)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.28)',
                            }}
                          >
                            {q.batch}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span
                          className="pill"
                          style={{
                            fontSize: '11px',
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                            fontWeight: 700,
                          }}
                        >
                          {statusBadge.label}
                        </span>
                        {statusUpper === 'READY' && (
                          <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>
                            ● Tayang di /latihan
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                        <span
                          className="pill"
                          style={{
                            fontSize: '11px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#7dd3fc',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                          }}
                        >
                          {subDisplay.code} — {subDisplay.label}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                          {q.topicTitle || 'Tanpa Topik'} {q.subtopicTitle ? `› ${q.subtopicTitle}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="pill"
                        style={{
                          fontSize: '11px',
                          background: diffMeta.bg,
                          color: diffMeta.color,
                          border: `1px solid ${diffMeta.border}`,
                        }}
                      >
                        ● {diffMeta.label}
                      </span>
                    </td>
                    <td style={{ maxWidth: '330px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--foreground)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <MathText text={stripMarkdownPreview(q.content)} />
                      </div>
                      {q.revisionNotes && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid rgba(244, 63, 94, 0.35)',
                            fontSize: '11px',
                            color: '#fda4af',
                          }}
                        >
                          <strong>Catatan Revisi{q.reviewedBy ? ` (${q.reviewedBy})` : ''}:</strong> {q.revisionNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--muted-fg)', lineHeight: 1.4 }}>
                        <div>
                          Dijawab: <strong style={{ color: '#34d399' }}>{q.answeredCount}</strong>
                        </div>
                        <div>
                          Dilewati: <strong style={{ color: '#fbbf24' }}>{q.skippedCount}</strong>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '5px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            setPreviewSlideIdx(0);
                            setPreviewQuestion(q);
                          }}
                          title="Pratinjau Soal"
                        >
                          <Eye style={{ width: 12, height: 12 }} />
                          <span>Preview</span>
                        </button>

                        {onEditQuestion && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => onEditQuestion(q)}
                            title="Edit soal / pembahasan"
                          >
                            <Pencil style={{ width: 12, height: 12 }} />
                            <span>Edit</span>
                          </button>
                        )}

                        {statusUpper === 'DRAFT' && (
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={isBusy}
                            onClick={() => void handleQuestionWorkflow(q.id, 'SUBMIT_QC')}
                            style={{ height: '28px', padding: '0 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send style={{ width: 11, height: 11 }} />
                            <span>{isBusy ? '…' : 'Ajukan QC'}</span>
                          </button>
                        )}

                        {statusUpper === 'QC_SANDBOX' && (
                          <>
                            <button
                              type="button"
                              className="button button-secondary"
                              disabled={isBusy}
                              onClick={() => void handleOpenQuestionSandbox(q.id)}
                              style={{
                                height: '28px',
                                padding: '0 8px',
                                fontSize: '11px',
                                color: '#93c5fd',
                                borderColor: 'rgba(59, 130, 246, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <ExternalLink style={{ width: 11, height: 11 }} />
                              <span>Sandbox</span>
                            </button>
                            <button
                              type="button"
                              className="button button-primary"
                              disabled={isBusy}
                              onClick={() => void handleQuestionWorkflow(q.id, 'APPROVE')}
                              style={{
                                height: '28px',
                                padding: '0 9px',
                                fontSize: '11px',
                                background: '#059669',
                                borderColor: '#10b981',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle2 style={{ width: 11, height: 11 }} />
                              <span>ACC &amp; Tayangkan</span>
                            </button>
                            <button
                              type="button"
                              className="button button-secondary"
                              disabled={isBusy}
                              onClick={() => {
                                setRevisionTargetQuestion(q);
                                setRevisionNotesDraft(q.revisionNotes || '');
                              }}
                              style={{
                                height: '28px',
                                padding: '0 8px',
                                fontSize: '11px',
                                color: '#fb7185',
                                borderColor: 'rgba(244, 63, 94, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <AlertTriangle style={{ width: 11, height: 11 }} />
                              <span>Revisi</span>
                            </button>
                          </>
                        )}

                        {statusUpper === 'NEEDS_REVISION' && (
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={isBusy}
                            onClick={() => void handleQuestionWorkflow(q.id, 'RESUBMIT_QC')}
                            style={{ height: '28px', padding: '0 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send style={{ width: 11, height: 11 }} />
                            <span>{isBusy ? '…' : 'Ajukan Ulang QC'}</span>
                          </button>
                        )}

                        {statusUpper === 'READY' && (
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={isBusy}
                            onClick={() => void handleQuestionWorkflow(q.id, 'PULL_TO_DRAFT')}
                            style={{
                              height: '28px',
                              padding: '0 8px',
                              fontSize: '11px',
                              color: '#fbbf24',
                              borderColor: 'rgba(245, 158, 11, 0.35)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Tarik dari /latihan kembali ke Draf"
                          >
                            <RotateCcw style={{ width: 11, height: 11 }} />
                            <span>Tarik ke Draf</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={removingId === q.id}
                          style={{
                            height: '28px',
                            padding: '0 8px',
                            fontSize: '11px',
                            color: '#f87171',
                            borderColor: 'rgba(248, 113, 113, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => void handleUnassign(q.id)}
                          title="Keluarkan dari Latihan ke Eksperimen (Bank Soal)"
                        >
                          <Trash2 style={{ width: 11, height: 11 }} />
                          <span>{removingId === q.id ? '…' : 'Keluarkan'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PICKER MODAL: AMBIL SOAL DARI EKSPERIMEN / BANK SOAL */}
      {pickerOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '940px',
              maxHeight: '86vh',
              background: '#0f172a',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen style={{ width: 16, height: 16, color: '#38bdf8' }} />
                  <span>Ambil Soal dari Bank / Eksperimen ke Latihan</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                  Soal yang sudah Siap (Ready) akan langsung tayang di <code>/latihan</code>, sedangkan soal Draf / QC dapat langsung dilanjutkan QC-nya di halaman Latihan ini.
                </p>
              </div>
              <button type="button" className="button button-secondary" onClick={() => setPickerOpen(false)}>
                Tutup
              </button>
            </div>

            {/* PICKER FILTERS */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <input
                type="search"
                className="field-input"
                placeholder="Cari soal, ID, topik, atau batch…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                style={{ flex: '1 1 220px' }}
              />
              <select
                className="field-input"
                value={pickerSubtest}
                onChange={(e) => setPickerSubtest(e.target.value)}
                style={{ width: 'auto', minWidth: '190px' }}
              >
                <option value="ALL">Semua Subtes</option>
                {SUBTEST_CARDS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.short} — {c.label}
                  </option>
                ))}
              </select>
              <select
                className="field-input"
                value={pickerBatch}
                onChange={(e) => setPickerBatch(e.target.value)}
                style={{ width: 'auto', minWidth: '170px' }}
              >
                <option value="ALL">Semua Batch</option>
                {pickerBatchOptions.batches.map((item) => (
                  <option key={item.batch} value={item.batch}>
                    Batch: {item.batch} ({item.count})
                  </option>
                ))}
                {pickerBatchOptions.noBatchCount > 0 && (
                  <option value="__NONE__">Tanpa Batch ({pickerBatchOptions.noBatchCount})</option>
                )}
              </select>
              <button
                type="button"
                className="button button-secondary"
                disabled={selectableFilteredIds.length === 0}
                onClick={() => {
                  const allSelected = selectableFilteredIds.every((id) => selectedIds.includes(id));
                  if (allSelected) {
                    setSelectedIds((prev) => prev.filter((id) => !selectableFilteredIds.includes(id)));
                  } else {
                    setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableFilteredIds])));
                  }
                }}
                style={{ fontSize: '12px' }}
              >
                Pilih Semua di Filter ({selectableFilteredIds.length})
              </button>
            </div>

            {/* PICKER LIST */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
              {filteredPicker.length === 0 ? (
                <div className="empty-copy" style={{ padding: '40px 0', textAlign: 'center' }}>
                  Tidak ada soal Eksperimen / Bank Soal yang tersedia untuk filter ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredPicker.map((q) => {
                    const checked = selectedIds.includes(q.id);
                    const subDisplay = getSubtestDisplay(q.subtest);
                    const diffMeta = getDifficultyMeta(q.difficulty);
                    const stBadge = getQuestionStatusBadge(q.status);
                    return (
                      <label
                        key={q.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: checked ? '1px solid #38bdf8' : '1px solid var(--border)',
                          background: q.isLockedInTryout
                            ? 'rgba(239, 68, 68, 0.05)'
                            : checked
                              ? 'rgba(56, 189, 248, 0.08)'
                              : 'rgba(255,255,255,0.02)',
                          opacity: q.isLockedInTryout ? 0.6 : 1,
                          cursor: q.isLockedInTryout ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={q.isLockedInTryout}
                          checked={checked}
                          onChange={() => {
                            if (q.isLockedInTryout) return;
                            setSelectedIds((prev) =>
                              prev.includes(q.id) ? prev.filter((x) => x !== q.id) : [...prev, q.id],
                            );
                          }}
                          style={{ marginTop: '4px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <code style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>{q.id}</code>
                            {q.batch && (
                              <span
                                className="pill"
                                style={{
                                  fontSize: '10px',
                                  background: 'rgba(245, 158, 11, 0.14)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.28)',
                                }}
                              >
                                {q.batch}
                              </span>
                            )}
                            <span
                              className="pill"
                              style={{
                                fontSize: '10px',
                                background: stBadge.bg,
                                color: stBadge.color,
                                border: `1px solid ${stBadge.border}`,
                              }}
                            >
                              {stBadge.label}
                            </span>
                            <span
                              className="pill"
                              style={{
                                fontSize: '10px',
                                background: 'rgba(56, 189, 248, 0.14)',
                                color: '#7dd3fc',
                              }}
                            >
                              {subDisplay.code}
                            </span>
                            <span
                              className="pill"
                              style={{
                                fontSize: '10px',
                                background: diffMeta.bg,
                                color: diffMeta.color,
                              }}
                            >
                              {diffMeta.label}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                              {q.topicTitle || 'Tanpa Topik'} {q.subtopicTitle ? `› ${q.subtopicTitle}` : ''}
                            </span>
                            {q.isLockedInTryout && (
                              <span
                                className="pill"
                                style={{
                                  fontSize: '10px',
                                  background: 'rgba(239, 68, 68, 0.18)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Lock style={{ width: 10, height: 10 }} />
                                <span>Terkunci di Tryout ({q.tryoutTitle || 'Aktif'})</span>
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--foreground)' }}>
                            <MathText text={stripMarkdownPreview(q.content)} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PICKER FOOTER */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--muted-fg)' }}>
                <strong>{selectedIds.length}</strong> soal dipilih
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="button button-secondary" onClick={() => setPickerOpen(false)}>
                  Batal
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={selectedIds.length === 0 || assigning}
                  onClick={() => void handleAssignSelected()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#000', fontWeight: 700 }}
                >
                  <Check style={{ width: 14, height: 14 }} />
                  <span>{assigning ? 'Menyimpan…' : `Masukkan ${selectedIds.length} Soal ke Latihan`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      <QuestionPreviewModal
        question={previewQuestion as any}
        slideIdx={previewSlideIdx}
        onSlideChange={setPreviewSlideIdx}
        onClose={() => setPreviewQuestion(null)}
      />

      {/* REVISION REQUEST MODAL */}
      <RevisionRequestModal
        open={Boolean(revisionTargetQuestion)}
        questionSnippet={revisionTargetQuestion?.content || ''}
        notes={revisionNotesDraft}
        submitting={revisionSaving}
        onNotesChange={setRevisionNotesDraft}
        onClose={() => {
          setRevisionTargetQuestion(null);
          setRevisionNotesDraft('');
        }}
        onConfirm={() => void handleConfirmRevision()}
      />

      {/* AUTO-BALANCE ADJUSTER MODAL */}
      <AutoBalanceAdjusterModal
        open={autoBalanceModalOpen}
        onClose={() => setAutoBalanceModalOpen(false)}
        destination="FOR_PRACTICE"
        scopeKey="PRACTICE"
        packageTitle="Paket Global Latihan (/latihan)"
        packageQuestions={workspace?.assignedQuestions || []}
        curriculumTopics={curriculumTopics}
        onOpenAiGenerator={
          onOpenCreateForPractice
            ? () => onOpenCreateForPractice()
            : undefined
        }
      />
    </section>
  );
}
