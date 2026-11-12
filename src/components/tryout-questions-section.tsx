'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Layers,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
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
  type TryoutAssignedQuestion,
  type TryoutCurationStatus,
  type TryoutCurriculumTopic,
} from './question-lifecycle-types';
import { QuestionPreviewModal, RevisionRequestModal } from './question-workflow-modals';
import {
  TryoutSubtestTimerPanel,
  TryoutWorkflowHeader,
} from './tryout-workflow-balancer';

type TryoutMeta = {
  id: string;
  code: number;
  title: string;
  description?: string | null;
  batch: string;
  status: string;
  curationStatus?: TryoutCurationStatus;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  questionCount: number;
  readyQuestionCount?: number;
  totalDurationMinutes?: number;
};

type TryoutSubtestSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  order: number;
  questionCount: number;
  readyCount?: number;
};

type TryoutPickerQuestion = {
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
  isLockedInOtherTryout: boolean;
  isInPoolTryout: boolean;
  isInBank: boolean;
  isInPractice: boolean;
  hasSolution: boolean;
};

type TryoutBatchSummary = {
  batch: string;
  totalInBatch: number;
  eligibleCount: number;
  poolTryoutCount: number;
  bankCount: number;
  practiceCount: number;
  notReadyCount: number;
  lockedOtherCount: number;
  alreadyHereCount: number;
  subtestBreakdown: Record<string, number>;
};

type TryoutWorkspaceResponse = {
  tryout: TryoutMeta;
  subtests: TryoutSubtestSummary[];
  assignedQuestions: TryoutAssignedQuestion[];
  pickerPool: TryoutPickerQuestion[];
  batchSummaries: TryoutBatchSummary[];
  curriculumTopics?: TryoutCurriculumTopic[];
};

const OFFICIAL_SUBTESTS: Array<{
  code: 'PU' | 'PPU' | 'PBM' | 'PK' | 'LBI' | 'LBE' | 'PM';
  key: string;
  label: string;
}> = [
  { code: 'PU', key: 'PENALARAN_UMUM', label: 'Penalaran Umum' },
  { code: 'PPU', key: 'PENGETAHUAN_PEMAHAMAN_UMUM', label: 'Pengetahuan & Pemahaman Umum' },
  { code: 'PBM', key: 'PEMAHAMAN_BACAAN_MENULIS', label: 'Pemahaman Bacaan & Menulis' },
  { code: 'PK', key: 'PENGETAHUAN_KUANTITATIF', label: 'Pengetahuan Kuantitatif' },
  { code: 'LBI', key: 'LITERASI_INDONESIA', label: 'Literasi Bahasa Indonesia' },
  { code: 'LBE', key: 'LITERASI_INGGRIS', label: 'Literasi Bahasa Inggris' },
  { code: 'PM', key: 'PENALARAN_MATEMATIKA', label: 'Penalaran Matematika' },
];

const STATUS_TABS: Array<{ key: 'ALL' | QuestionStatusType; label: string }> = [
  { key: 'ALL', label: 'Semua Status' },
  { key: 'DRAFT', label: 'Draf' },
  { key: 'QC_SANDBOX', label: 'Antrean QC (Sandbox)' },
  { key: 'NEEDS_REVISION', label: 'Kotak Revisi' },
  { key: 'READY', label: 'Siap (Ready)' },
];

function stripMarkdownPreview(raw: string): string {
  return (raw || '').replace(/\s+/g, ' ').trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan saat memproses permintaan.';
}

export function TryoutQuestionsSection({
  tryoutId,
  jituMainUrl = 'http://localhost:5173',
  onBack,
  onError,
  onNotice,
  onQuestionsChanged,
  onOpenCreateForTryout,
  onEditQuestion,
}: {
  tryoutId: string;
  jituMainUrl?: string;
  onBack: () => void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
  onQuestionsChanged?: () => void;
  onOpenCreateForTryout?: (tryoutId: string) => void;
  onEditQuestion?: (question: TryoutAssignedQuestion) => void;
}) {
  const [workspace, setWorkspace] = React.useState<TryoutWorkspaceResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [subtestFilter, setSubtestFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | QuestionStatusType>('ALL');
  const [batchFilter, setBatchFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [selectedTableIds, setSelectedTableIds] = React.useState<string[]>([]);
  const [busyQuestionId, setBusyQuestionId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState<string | null>(null);
  const [revisionTargetQuestion, setRevisionTargetQuestion] = React.useState<TryoutAssignedQuestion | null>(null);
  const [revisionNotesDraft, setRevisionNotesDraft] = React.useState('');
  const [revisionSaving, setRevisionSaving] = React.useState(false);
  const [previewSlideIdx, setPreviewSlideIdx] = React.useState(0);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSourceFilter, setPickerSourceFilter] = React.useState<'POOL_AND_BANK' | 'POOL_ONLY' | 'ALL'>('POOL_AND_BANK');
  const [pickerSubtest, setPickerSubtest] = React.useState<string>('ALL');
  const [pickerBatch, setPickerBatch] = React.useState<string>('ALL');
  const [pickerSearch, setPickerSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [assigning, setAssigning] = React.useState(false);
  const [assigningBatchName, setAssigningBatchName] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [removingBatch, setRemovingBatch] = React.useState(false);
  const [previewQuestion, setPreviewQuestion] = React.useState<TryoutAssignedQuestion | null>(null);

  const onErrorRef = React.useRef(onError);
  const onQuestionsChangedRef = React.useRef(onQuestionsChanged);
  React.useEffect(() => {
    onErrorRef.current = onError;
    onQuestionsChangedRef.current = onQuestionsChanged;
  });

  const loadWorkspace = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<TryoutWorkspaceResponse>(
        `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/workspace`,
      );
      setWorkspace(data);
    } catch (cause) {
      onErrorRef.current(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [tryoutId]);

  React.useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const assignedQuestions = React.useMemo(() => workspace?.assignedQuestions ?? [], [workspace]);
  const pickerPool = React.useMemo(() => workspace?.pickerPool ?? [], [workspace]);
  const batchSummaries = React.useMemo(() => workspace?.batchSummaries ?? [], [workspace]);
  const subtests = React.useMemo(() => workspace?.subtests ?? [], [workspace]);
  const tryoutMeta = workspace?.tryout;

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
      const st = (String(q.status || 'DRAFT').toUpperCase() as QuestionStatusType);
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

  const pickerBatchOptions = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const q of pickerPool) {
      if (q.isLockedInOtherTryout) continue;
      const b = (q.batch || '').trim();
      if (!b) continue;
      map.set(b, (map.get(b) || 0) + 1);
    }
    return Array.from(map.entries()).map(([batch, count]) => ({ batch, count }));
  }, [pickerPool]);

  const filteredPicker = React.useMemo(() => {
    return pickerPool.filter((q) => {
      if (pickerSourceFilter === 'POOL_ONLY' && !q.isInPoolTryout) {
        return false;
      }
      if (pickerSourceFilter === 'POOL_AND_BANK' && !q.isInPoolTryout && !q.isInBank) {
        return false;
      }
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
  }, [pickerPool, pickerSourceFilter, pickerSubtest, pickerBatch, pickerSearch]);

  const selectableFilteredIds = React.useMemo(
    () => filteredPicker.filter((q) => !q.isLockedInOtherTryout).map((q) => q.id),
    [filteredPicker],
  );

  const availablePoolAndBankCount = React.useMemo(
    () => pickerPool.filter((q) => !q.isLockedInOtherTryout && (q.isInPoolTryout || q.isInBank)).length,
    [pickerPool],
  );

  const assignableBatches = React.useMemo(
    () => batchSummaries.filter((b) => b.eligibleCount > 0 || b.alreadyHereCount > 0),
    [batchSummaries],
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
        SUBMIT_QC: 'Soal berhasil diajukan ke Antrean QC (Sandbox).',
        RESUBMIT_QC: 'Soal hasil revisi diajukan ulang ke Antrean QC.',
        APPROVE: 'Soal di-ACC ke status Siap (Ready) di dalam Tryout ini!',
        PULL_TO_DRAFT: 'Soal ditarik kembali ke status Draf.',
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
        DRAFT: 'Draf',
        QC_SANDBOX: 'Antrean QC (Sandbox)',
        READY: 'Siap (Ready)',
      };
      onNotice(`${res.updatedCount} soal di Tryout ini berhasil digeser ke ${labelMap[nextStatus]}.`);
      setSelectedTableIds([]);
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setBulkBusy(null);
    }
  }

  function openDefaultPicker() {
    setSelectedIds([]);
    setPickerSourceFilter('POOL_AND_BANK');
    setPickerSubtest(subtestFilter);
    setPickerBatch('ALL');
    setPickerSearch('');
    setPickerOpen(true);
  }

  async function handleAssignEntireBatch(batchName: string) {
    setAssigningBatchName(batchName);
    onError('');
    try {
      const res = await api.post<{
        assignedCount: number;
        removedFromPracticeCount: number;
        skippedAlreadyHere: number;
        skippedNotReady: number;
        skippedLockedOther: number;
      }>(`/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/questions/assign`, {
        batch: batchName,
      });
      const extras: string[] = [];
      if (res.removedFromPracticeCount > 0) extras.push(`${res.removedFromPracticeCount} ditarik dari Latihan`);
      if (res.skippedAlreadyHere > 0) extras.push(`${res.skippedAlreadyHere} sudah ada`);
      const extraText = extras.length > 0 ? ` (${extras.join(', ')})` : '';
      onNotice(`Batch "${batchName}": ${res.assignedCount} soal berhasil dimasukkan ke subtes Tryout${extraText}.`);
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setAssigningBatchName(null);
    }
  }

  async function handleAssignSelected() {
    if (selectedIds.length === 0) return;
    setAssigning(true);
    onError('');
    try {
      const res = await api.post<{ assignedCount: number; removedFromPracticeCount?: number }>(
        `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/questions/assign`,
        { questionIds: selectedIds },
      );
      const movedNote =
        res.removedFromPracticeCount && res.removedFromPracticeCount > 0
          ? ` (${res.removedFromPracticeCount} otomatis dipindahkan dari Latihan)`
          : '';
      onNotice(`Berhasil memasukkan ${res.assignedCount ?? selectedIds.length} soal ke subtes Tryout${movedNote}.`);
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

  async function handleUnassignQuestion(questionId: string) {
    setRemovingId(questionId);
    onError('');
    try {
      await api.delete(
        `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/questions/${encodeURIComponent(questionId)}`,
      );
      onNotice('Soal dikeluarkan dari Tryout dan dikembalikan ke Eksperimen (Bank Soal).');
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setRemovingId(null);
    }
  }

  async function handleUnassignFilteredBatch() {
    if (batchFilter === 'ALL' || batchFilter === '__NONE__') return;
    const countInBatch = assignedQuestions.filter((q) => (q.batch || '').trim() === batchFilter).length;
    if (countInBatch === 0) return;
    const ok = window.confirm(
      `Keluarkan seluruh ${countInBatch} soal pada batch "${batchFilter}" dari Tryout ini dan kembalikan ke Bank Soal?`,
    );
    if (!ok) return;

    setRemovingBatch(true);
    onError('');
    try {
      const res = await api.post<{ unassignedCount: number }>(
        `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/questions/unassign`,
        { batch: batchFilter },
      );
      onNotice(`${res.unassignedCount} soal batch "${batchFilter}" dikembalikan ke Bank Soal.`);
      setBatchFilter('ALL');
      await loadWorkspace();
      onQuestionsChangedRef.current?.();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setRemovingBatch(false);
    }
  }

  const allFilteredSelected =
    filteredAssigned.length > 0 && filteredAssigned.every((q) => selectedTableIds.includes(q.id));

  return (
    <section className="control-panel" aria-labelledby="tryout-questions-heading">
      {/* TOP NAVIGATION & HEADER */}
      <div className="section-heading control-panel-heading" style={{ alignItems: 'flex-start' }}>
        <div>
          <button
            type="button"
            className="button button-secondary"
            onClick={onBack}
            style={{ marginBottom: '10px', height: '30px', padding: '0 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
            <span>Kembali ke Daftar Tryout</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 id="tryout-questions-heading" style={{ margin: 0 }}>
              {tryoutMeta ? tryoutMeta.title : 'Kelola Soal Tryout'}
            </h2>
            {tryoutMeta && (
              <>
                <span className="pill" style={{ background: 'rgba(56, 189, 248, 0.14)', color: '#7dd3fc' }}>
                  #{tryoutMeta.code} · {tryoutMeta.batch}
                </span>
                <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#34d399', fontWeight: 700 }}>
                  {assignedQuestions.length} Soal Terdaftar ({statusCounts.READY} Siap)
                </span>
              </>
            )}
          </div>
          <p style={{ marginTop: '4px' }}>
            Semua soal Tryout ini (mulai dari <strong>Draf → Antrean QC (Sandbox) → Kotak Revisi → Siap (Ready)</strong>) dikelola langsung di tabel bawah. Setelah semua soal berstatus <strong>Siap</strong>, paket Tryout dapat langsung di-publish.
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
          {onOpenCreateForTryout && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => onOpenCreateForTryout(tryoutId)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#000', fontWeight: 700 }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              <span>Buat Soal ke Tryout Ini</span>
            </button>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={openDefaultPicker}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            <span>Ambil dari Bank / Eksperimen ({availablePoolAndBankCount})</span>
          </button>
        </div>
      </div>

      {/* PACKAGE PUBLISH & SANDBOX BAR */}
      <TryoutWorkflowHeader
        tryout={tryoutMeta}
        questionCount={assignedQuestions.length}
        readyQuestionCount={statusCounts.READY}
        totalDurationMinutes={
          tryoutMeta?.totalDurationMinutes ??
          subtests.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0)
        }
        jituMainUrl={jituMainUrl}
        onUpdated={async () => {
          await loadWorkspace();
          onQuestionsChangedRef.current?.();
        }}
        onError={onError}
        onNotice={onNotice}
      />

      {/* SUBTEST TIMER CONFIGURATOR (195M DEFAULT + 1M BUFFER) */}
      <TryoutSubtestTimerPanel
        tryoutId={tryoutId}
        subtests={subtests}
        onSaved={async () => {
          await loadWorkspace();
          onQuestionsChangedRef.current?.();
        }}
        onError={onError}
        onNotice={onNotice}
      />

      {/* QUICK 1-BATCH PICKER PANEL */}
      {assignableBatches.length > 0 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(15, 23, 42, 0.45))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers style={{ width: 16, height: 16, color: '#38bdf8' }} />
              <strong style={{ fontSize: '13px', color: '#e0f2fe' }}>Pilih Langsung 1 Batch ke Tryout Ini</strong>
              <span style={{ fontSize: '12px', color: 'var(--muted-fg)' }}>
                Klik 1 tombol untuk memasukkan seluruh soal bebas dari satu batch langsung ke subtesnya.
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '10px',
            }}
          >
            {assignableBatches.map((b) => {
              const breakdownParts = Object.entries(b.subtestBreakdown)
                .map(([code, cnt]) => `${code}:${cnt}`)
                .join(' · ');
              const isAllHere = b.eligibleCount === 0 && b.alreadyHereCount > 0;
              return (
                <div
                  key={b.batch}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isAllHere ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
                    background: isAllHere ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        className="pill"
                        style={{
                          fontSize: '11px',
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          fontWeight: 700,
                        }}
                      >
                        Batch: {b.batch}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
                        Total {b.totalInBatch} soal
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--muted-fg)', marginTop: '6px', lineHeight: 1.45 }}>
                      {b.eligibleCount > 0 ? (
                        <>
                          <strong style={{ color: '#38bdf8' }}>{b.eligibleCount} soal dapat dimasukkan</strong>
                          {breakdownParts ? ` (${breakdownParts})` : ''}
                        </>
                      ) : (
                        <span style={{ color: '#34d399', fontWeight: 600 }}>
                          ✓ {b.alreadyHereCount} soal sudah di Tryout ini
                        </span>
                      )}
                      {b.alreadyHereCount > 0 && b.eligibleCount > 0 && (
                        <div>· {b.alreadyHereCount} sudah masuk di Tryout ini</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {b.eligibleCount > 0 ? (
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={assigningBatchName !== null}
                        onClick={() => void handleAssignEntireBatch(b.batch)}
                        style={{
                          width: '100%',
                          height: '30px',
                          fontSize: '11px',
                          color: '#000',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                      >
                        <Plus style={{ width: 12, height: 12 }} />
                        <span>
                          {assigningBatchName === b.batch
                            ? 'Memasukkan Batch…'
                            : `Masukkan 1 Batch (${b.eligibleCount} Soal)`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => setBatchFilter(b.batch)}
                        style={{ width: '100%', height: '30px', fontSize: '11px' }}
                      >
                        Filter Batch Ini ({b.alreadyHereCount})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7 OFFICIAL SUBTEST CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {OFFICIAL_SUBTESTS.map((st) => {
          const matchedSubtest = subtests.find((s) => s.name === st.code);
          const count = assignedQuestions.filter((q) => normalizeSubtestKey(q.subtest) === st.key).length;
          const readyInSubtest = assignedQuestions.filter(
            (q) => normalizeSubtestKey(q.subtest) === st.key && String(q.status || '').toUpperCase() === 'READY',
          ).length;
          const active = subtestFilter === st.key;
          return (
            <button
              key={st.code}
              type="button"
              onClick={() => setSubtestFilter(active ? 'ALL' : st.key)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '10px',
                border: active ? '1px solid #38bdf8' : '1px solid var(--border)',
                background: active ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{st.code}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted-fg)' }}>
                  {matchedSubtest ? `${matchedSubtest.durationMinutes} mnt` : '—'}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: count > 0 ? '#f8fafc' : '#f87171' }}>
                {count} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-fg)' }}>soal</span>
              </div>
              <div style={{ fontSize: '11px', color: readyInSubtest === count && count > 0 ? '#34d399' : 'var(--muted-fg)', marginTop: '2px' }}>
                {readyInSubtest}/{count} Siap · {st.label}
              </div>
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
            {selectedTableIds.length} soal dipilih di Tryout ini
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
              {bulkBusy === 'READY' ? 'Memproses…' : 'ACC ke Siap (Ready)'}
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

      {/* FILTER BAR FOR ASSIGNED QUESTIONS */}
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
            placeholder="Cari ID soal, isi pertanyaan, topik, catatan revisi, atau batch…"
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
          {OFFICIAL_SUBTESTS.map((st) => (
            <option key={st.key} value={st.key}>
              {st.code} — {st.label}
            </option>
          ))}
        </select>

        <select
          className="field-input"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '185px' }}
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

        {batchFilter !== 'ALL' && batchFilter !== '__NONE__' && (
          <button
            type="button"
            className="button button-secondary"
            disabled={removingBatch}
            onClick={() => void handleUnassignFilteredBatch()}
            style={{
              color: '#f87171',
              borderColor: 'rgba(248, 113, 113, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Trash2 style={{ width: 13, height: 13 }} />
            <span>{removingBatch ? 'Mengeluarkan…' : `Keluarkan Batch "${batchFilter}"`}</span>
          </button>
        )}
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
              <th>Status QC</th>
              <th>Subtes &amp; Topik</th>
              <th>Kesulitan</th>
              <th>Cuplikan Soal &amp; Catatan QC</th>
              <th style={{ textAlign: 'right' }}>Aksi QC &amp; Paket</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-copy">
                  Memuat daftar soal Tryout…
                </td>
              </tr>
            ) : filteredAssigned.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-copy">
                  Belum ada soal pada filter ini. Klik <strong>Buat Soal ke Tryout Ini</strong> atau pilih dari Bank Soal.
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
                    <td style={{ maxWidth: '340px' }}>
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
                          title="Pratinjau soal & pembahasan"
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
                              <span>ACC Siap</span>
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
                            title="Tarik kembali ke status Draf di Tryout ini"
                          >
                            <RotateCcw style={{ width: 11, height: 11 }} />
                            <span>Tarik ke Draf</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={removingId === q.id || (q.answerCount ?? 0) > 0}
                          title={
                            (q.answerCount ?? 0) > 0
                              ? 'Sudah dikerjakan siswa di Tryout ini'
                              : 'Keluarkan dari Tryout ke Eksperimen (Bank Soal)'
                          }
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
                          onClick={() => void handleUnassignQuestion(q.id)}
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

      {/* PICKER MODAL */}
      {pickerOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="modal-card"
            style={{
              width: '100%',
              maxWidth: '980px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#0f172a',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>
                  Ambil Soal dari Bank / Eksperimen ke {tryoutMeta?.title || 'Tryout'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted-fg)' }}>
                  Soal yang diambil akan otomatis masuk ke subtes yang sesuai dan dapat langsung di-QC di dalam Tryout ini.
                </p>
              </div>
              <button type="button" className="button button-secondary" onClick={() => setPickerOpen(false)}>
                Tutup
              </button>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="search"
                  className="field-input"
                  placeholder="Cari ID soal, pertanyaan, topik, atau batch…"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  style={{ flex: '1 1 220px' }}
                />
                <select
                  className="field-input"
                  value={pickerSubtest}
                  onChange={(e) => setPickerSubtest(e.target.value)}
                  style={{ width: 'auto', minWidth: '180px' }}
                >
                  <option value="ALL">Semua Subtes</option>
                  {OFFICIAL_SUBTESTS.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.code} — {st.label}
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
                  {pickerBatchOptions.map((b) => (
                    <option key={b.batch} value={b.batch}>
                      Batch: {b.batch} ({b.count})
                    </option>
                  ))}
                  <option value="__NONE__">Tanpa Batch</option>
                </select>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    const allSelected =
                      selectableFilteredIds.length > 0 &&
                      selectableFilteredIds.every((id) => selectedIds.includes(id));
                    if (allSelected) {
                      setSelectedIds((prev) => prev.filter((id) => !selectableFilteredIds.includes(id)));
                    } else {
                      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableFilteredIds])));
                    }
                  }}
                >
                  Pilih Semua di Filter ({selectableFilteredIds.length})
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {filteredPicker.length === 0 ? (
                <p className="empty-copy">Tidak ada soal yang cocok dengan filter ini.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredPicker.map((q) => {
                    const checked = selectedIds.includes(q.id);
                    const sub = getSubtestDisplay(q.subtest);
                    const diff = getDifficultyMeta(q.difficulty);
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
                          background: q.isLockedInOtherTryout
                            ? 'rgba(239, 68, 68, 0.05)'
                            : checked
                              ? 'rgba(56, 189, 248, 0.1)'
                              : 'rgba(255,255,255,0.02)',
                          opacity: q.isLockedInOtherTryout ? 0.55 : 1,
                          cursor: q.isLockedInOtherTryout ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={q.isLockedInOtherTryout}
                          checked={checked}
                          onChange={() => {
                            setSelectedIds((prev) =>
                              prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id],
                            );
                          }}
                          style={{ marginTop: '4px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                            <code style={{ fontSize: '11px', fontWeight: 700 }}>{q.id}</code>
                            {q.batch && (
                              <span
                                className="pill"
                                style={{
                                  fontSize: '10px',
                                  background: 'rgba(245, 158, 11, 0.14)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
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
                            <span className="pill" style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.14)', color: '#7dd3fc' }}>
                              {sub.code}
                            </span>
                            <span className="pill" style={{ fontSize: '10px', background: diff.bg, color: diff.color }}>
                              {diff.label}
                            </span>
                            {q.isLockedInOtherTryout && (
                              <span className="pill" style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5' }}>
                                <Lock style={{ width: 10, height: 10, marginRight: 3 }} />
                                Terikat di {q.tryoutTitle}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                            <MathText text={stripMarkdownPreview(q.content)} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                  style={{ color: '#000', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check style={{ width: 14, height: 14 }} />
                  <span>{assigning ? 'Memasukkan…' : `Masukkan ke Tryout (${selectedIds.length})`}</span>
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
    </section>
  );
}
