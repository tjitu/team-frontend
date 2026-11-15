'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Lock,
  Rocket,
  RotateCcw,
  Save,
  Sliders,
  Wrench,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  getTryoutStatusBadge,
  OFFICIAL_SNBT_SUBTEST_SPEC,
  type TryoutCurationStatus,
} from './question-lifecycle-types';

type SubtestRow = {
  id: string;
  name: string;
  durationMinutes: number;
  targetQuestionCount?: number;
  order: number;
  questionCount: number;
  readyCount?: number;
};

type TryoutHeaderMeta = {
  id: string;
  code: number;
  title: string;
  releaseDate?: string | null;
  curationStatus?: TryoutCurationStatus;
  questionsReleased?: boolean;
  questionsReleasedAt?: string | null;
  breakSeconds?: number;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  totalDurationMinutes?: number;
  totalTargetQuestions?: number;
  questionCount?: number;
  readyQuestionCount?: number;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan saat memproses permintaan.';
}

export function TryoutWorkflowHeader({
  tryout,
  questionCount,
  readyQuestionCount,
  totalDurationMinutes,
  totalTargetQuestions = 160,
  jituMainUrl,
  onUpdated,
  onError,
  onNotice,
  onOpenAutoBalance,
}: {
  tryout: TryoutHeaderMeta | undefined;
  questionCount: number;
  readyQuestionCount: number;
  totalDurationMinutes: number;
  totalTargetQuestions?: number;
  jituMainUrl: string;
  onUpdated: () => Promise<void> | void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
  onOpenAutoBalance?: () => void;
}) {
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  if (!tryout) return null;

  const isPublished = (tryout.curationStatus || 'DRAFT') === 'PUBLISHED';
  const questionsReleased = Boolean(tryout.questionsReleased);
  const badge = getTryoutStatusBadge(isPublished ? 'PUBLISHED' : 'DRAFT');
  const pendingCount = Math.max(0, questionCount - readyQuestionCount);
  const allReady = questionCount > 0 && pendingCount === 0;
  const breakSeconds = Number(tryout.breakSeconds ?? 60);

  async function runWorkflow(
    action: 'PUBLISH_CATALOG' | 'RELEASE_QUESTIONS' | 'UNRELEASE_QUESTIONS' | 'UNPUBLISH',
  ) {
    if (!tryout) return;

    if (action === 'PUBLISH_CATALOG') {
      const ok = window.confirm(
        `Tahap 1 — Buka Pendaftaran Tryout "${tryout.title}" ke Publik?\n\n` +
          `• Tryout akan tampil di katalog siswa agar siswa bisa mulai mendaftar lebih awal.\n` +
          `• Tanggal rilis (Release Date) otomatis diset ke waktu publish saat ini.\n` +
          `• Soal ujian tetap terkunci (belum bisa dikerjakan) sampai Anda menekan "Luncurkan Soal Ujian" (misal H-1).`,
      );
      if (!ok) return;
    }

    if (action === 'RELEASE_QUESTIONS') {
      if (!allReady) {
        onError(
          questionCount <= 0
            ? 'Masukkan soal terlebih dahulu sebelum meluncurkan soal ujian (Anda tetap bisa membuka Pendaftaran Publik lebih dulu).'
            : `Masih ada ${pendingCount} soal di Tryout ini yang belum lolos QC (belum berstatus Siap / Ready). Selesaikan QC semua soal di tabel bawah terlebih dahulu.`,
        );
        return;
      }
      const quotaWarning =
        questionCount < totalTargetQuestions
          ? `\n\nCatatan: Saat ini terpasang ${questionCount} soal dari target standar ${totalTargetQuestions} soal.`
          : '';
      const ok = window.confirm(
        `Tahap 2 — Luncurkan Soal Ujian untuk "${tryout.title}"?${quotaWarning}\n\n` +
          `• Seluruh ${questionCount} soal yang sudah lolos QC akan dibuka untuk peserta terdaftar.\n` +
          `• Riwayat percobaan akun Sandbox (QA) pada tryout ini akan dibersihkan otomatis agar leaderboard siswa bersih.`,
      );
      if (!ok) return;
    }

    if (action === 'UNRELEASE_QUESTIONS') {
      const ok = window.confirm(
        `Kunci kembali soal ujian "${tryout.title}"?\n\nPendaftaran di katalog publik tetap buka, namun tombol "Mulai Kerjakan" di sisi siswa akan dikunci sementara hingga soal diluncurkan ulang.`,
      );
      if (!ok) return;
    }

    if (action === 'UNPUBLISH') {
      const ok = window.confirm(
        `Tarik Paket Tryout "${tryout.title}" kembali ke Draf?\n\nTryout akan disembunyikan dari katalog publik siswa dan akses soal dikunci.`,
      );
      if (!ok) return;
    }

    setBusyAction(action);
    onError('');
    try {
      await api.post(`/team/control-center/tryouts/${encodeURIComponent(tryout.id)}/workflow`, {
        action,
      });
      const notices: Record<typeof action, string> = {
        PUBLISH_CATALOG:
          'Tahap 1 aktif: Pendaftaran Tryout dibuka ke publik (Release Date otomatis tercatat, soal masih terkunci).',
        RELEASE_QUESTIONS:
          'Tahap 2 aktif: Soal ujian berhasil diluncurkan! Siswa terdaftar kini dapat mengerjakan sesuai jadwal.',
        UNRELEASE_QUESTIONS:
          'Soal ujian dikunci kembali (pendaftaran di katalog publik tetap terbuka).',
        UNPUBLISH: 'Paket Tryout ditarik kembali ke Draf.',
      };
      onNotice(notices[action]);
      await onUpdated();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleOpenSandbox() {
    if (!tryout) return;
    setBusyAction('SANDBOX');
    onError('');
    try {
      const res = await api.post<{ token: string }>('/team/control-center/sandbox-preview', {
        tryoutId: tryout.id,
      });
      const url = new URL(`/tryout/${encodeURIComponent(tryout.id)}`, jituMainUrl);
      url.searchParams.set('token', res.token);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      onNotice('Pratinjau paket Tryout di Sandbox dibuka di tab baru (berlaku 4 jam, leaderboard siswa tetap aman).');
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setBusyAction(null);
    }
  }

  const currentStage: 'DRAFT' | 'REGISTRATION_OPEN' | 'LIVE_EXAM' = !isPublished
    ? 'DRAFT'
    : questionsReleased && allReady
      ? 'LIVE_EXAM'
      : 'REGISTRATION_OPEN';

  const steps = [
    {
      id: 'DRAFT' as const,
      num: 1,
      title: 'Tahap 1: Draf Internal',
      desc: 'Hanya terlihat oleh tim internal & Sandbox QA',
      active: currentStage === 'DRAFT',
      done: currentStage !== 'DRAFT',
    },
    {
      id: 'REGISTRATION_OPEN' as const,
      num: 2,
      title: 'Tahap 2: Buka Pendaftaran',
      desc: 'Tampil di katalog siswa (bisa daftar, soal masih dikunci)',
      active: currentStage === 'REGISTRATION_OPEN',
      done: currentStage === 'LIVE_EXAM',
    },
    {
      id: 'LIVE_EXAM' as const,
      num: 3,
      title: 'Tahap 3: Soal Dibuka (Live)',
      desc: 'Siswa terdaftar bisa klik Mulai Kerjakan',
      active: currentStage === 'LIVE_EXAM',
      done: false,
    },
  ];

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* VISUAL 3-STEP WORKFLOW STEPPER */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        {steps.map((step) => {
          const borderColor = step.active
            ? step.id === 'LIVE_EXAM'
              ? 'rgba(16, 185, 129, 0.55)'
              : step.id === 'REGISTRATION_OPEN'
                ? 'rgba(56, 189, 248, 0.55)'
                : 'rgba(245, 158, 11, 0.55)'
            : step.done
              ? 'rgba(16, 185, 129, 0.3)'
              : 'var(--border)';
          const bgColor = step.active
            ? step.id === 'LIVE_EXAM'
              ? 'rgba(16, 185, 129, 0.1)'
              : step.id === 'REGISTRATION_OPEN'
                ? 'rgba(56, 189, 248, 0.1)'
                : 'rgba(245, 158, 11, 0.08)'
            : step.done
              ? 'rgba(16, 185, 129, 0.04)'
              : 'rgba(255,255,255,0.015)';
          return (
            <div
              key={step.id}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                background: bgColor,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  flexShrink: 0,
                  background: step.done
                    ? '#10b981'
                    : step.active
                      ? step.id === 'LIVE_EXAM'
                        ? '#10b981'
                        : step.id === 'REGISTRATION_OPEN'
                          ? '#38bdf8'
                          : '#f59e0b'
                      : 'rgba(255,255,255,0.08)',
                  color: step.done || step.active ? '#000' : 'var(--muted-fg)',
                }}
              >
                {step.done ? '✓' : step.num}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {step.title}
                  </span>
                  {step.active && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.12)',
                        color: '#fff',
                      }}
                    >
                      Posisi Saat Ini
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-fg)', marginTop: '2px' }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* METRICS + CONTEXTUAL ACTION BUTTONS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            className="pill"
            style={{
              background: allReady ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
              color: allReady ? '#10b981' : '#f59e0b',
              border: `1px solid ${allReady ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              fontWeight: 600,
            }}
          >
            Soal Terisi: {questionCount}/{totalTargetQuestions} · Lolos QC: {readyQuestionCount}/{questionCount}
          </span>

          <span style={{ fontSize: '12px', color: 'var(--muted-fg)' }}>
            Total Durasi: <strong style={{ color: 'var(--foreground)' }}>{totalDurationMinutes} menit</strong>
            {' · '}Jeda Antar Subtes:{' '}
            <strong style={{ color: 'var(--foreground)' }}>{breakSeconds} detik</strong>
            {tryout.releaseDate && (
              <>
                {' · '}Tanggal Publish:{' '}
                <strong style={{ color: 'var(--foreground)' }}>
                  {new Date(tryout.releaseDate).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenAutoBalance && (
            <button
              type="button"
              className="button button-secondary"
              onClick={onOpenAutoBalance}
              style={{
                height: '34px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sliders style={{ width: 13, height: 13 }} />
              <span>Auto-Balance</span>
            </button>
          )}

          <button
            type="button"
            className="button button-secondary"
            disabled={busyAction !== null || questionCount <= 0}
            title={questionCount <= 0 ? 'Masukkan minimal 1 soal dulu' : 'Uji simulasi 1 paket Tryout penuh di Sandbox'}
            onClick={() => void handleOpenSandbox()}
            style={{
              height: '34px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink style={{ width: 13, height: 13 }} />
            {busyAction === 'SANDBOX' ? 'Membuka Sandbox…' : 'Uji di Sandbox'}
          </button>

          {/* Contextual Next-Step Buttons based on currentStage */}
          {currentStage === 'DRAFT' && (
            <button
              type="button"
              className="button button-primary"
              disabled={busyAction !== null}
              title="Buka pendaftaran Tryout di web siswa sekarang (soal tetap terkunci sampai Anda luncurkan)"
              onClick={() => void runWorkflow('PUBLISH_CATALOG')}
              style={{
                height: '34px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Globe style={{ width: 13, height: 13 }} />
              {busyAction === 'PUBLISH_CATALOG'
                ? 'Membuka Pendaftaran…'
                : 'Lanjut ke Tahap 2: Publish Pendaftaran'}
            </button>
          )}

          {currentStage === 'REGISTRATION_OPEN' && (
            <>
              <button
                type="button"
                className="button button-secondary"
                disabled={busyAction !== null}
                onClick={() => void runWorkflow('UNPUBLISH')}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.35)',
                }}
                title="Kembalikan ke Tahap 1 (sembunyikan dari web siswa)"
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
                {busyAction === 'UNPUBLISH' ? 'Menarik…' : 'Tarik ke Draf'}
              </button>

              <button
                type="button"
                className="button button-primary"
                disabled={busyAction !== null || !allReady}
                title={
                  questionCount <= 0
                    ? 'Masukkan minimal 1 soal terlebih dahulu untuk meluncurkan soal ujian'
                    : !allReady
                      ? `Masih ada ${pendingCount} soal belum Siap (Ready). Selesaikan QC semua soal di bawah untuk membuka tombol ini.`
                      : 'Buka kunci soal ujian agar siswa terdaftar bisa mulai mengerjakan'
                }
                onClick={() => void runWorkflow('RELEASE_QUESTIONS')}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: allReady ? '#059669' : undefined,
                  borderColor: allReady ? '#10b981' : undefined,
                }}
              >
                <Rocket style={{ width: 13, height: 13 }} />
                {busyAction === 'RELEASE_QUESTIONS'
                  ? 'Meluncurkan Soal…'
                  : allReady
                    ? 'Lanjut ke Tahap 3: Luncurkan Soal Ujian'
                    : `Luncurkan Soal (Selesaikan QC ${readyQuestionCount}/${questionCount})`}
              </button>
            </>
          )}

          {currentStage === 'LIVE_EXAM' && (
            <>
              <button
                type="button"
                className="button button-secondary"
                disabled={busyAction !== null}
                onClick={() => void runWorkflow('UNRELEASE_QUESTIONS')}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                }}
                title="Kembali ke Tahap 2: Kunci soal ujian, tapi pendaftaran tetap buka"
              >
                <Lock style={{ width: 13, height: 13 }} />
                {busyAction === 'UNRELEASE_QUESTIONS' ? 'Mengunci…' : 'Kunci Kembali Soal (Ke Tahap 2)'}
              </button>

              <button
                type="button"
                className="button button-secondary"
                disabled={busyAction !== null}
                onClick={() => void runWorkflow('UNPUBLISH')}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Kembali ke Tahap 1: Sembunyikan sepenuhnya dari web siswa"
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
                {busyAction === 'UNPUBLISH' ? 'Menarik…' : 'Tarik ke Draf'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function TryoutSubtestTimerPanel({
  tryoutId,
  subtests,
  breakSeconds = 60,
  onSaved,
  onError,
  onNotice,
}: {
  tryoutId: string;
  subtests: SubtestRow[];
  breakSeconds?: number;
  onSaved: () => Promise<void> | void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draftDurations, setDraftDurations] = React.useState<Record<string, number>>({});
  const [draftTargets, setDraftTargets] = React.useState<Record<string, number>>({});
  const [draftBreakSeconds, setDraftBreakSeconds] = React.useState<number>(60);

  React.useEffect(() => {
    const initialDurations: Record<string, number> = {};
    const initialTargets: Record<string, number> = {};
    for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
      const found = subtests.find((s) => s.name === spec.code);
      initialDurations[spec.code] = found
        ? Number(found.durationMinutes) || spec.defaultDuration
        : spec.defaultDuration;
      initialTargets[spec.code] = found
        ? Number(found.targetQuestionCount) || spec.fullQuestionTarget
        : spec.fullQuestionTarget;
    }
    setDraftDurations(initialDurations);
    setDraftTargets(initialTargets);
    setDraftBreakSeconds(Math.max(0, Math.min(1800, Number(breakSeconds ?? 60))));
  }, [subtests, breakSeconds]);

  const totalDraftMinutes = OFFICIAL_SNBT_SUBTEST_SPEC.reduce(
    (sum, spec) => sum + (Number(draftDurations[spec.code]) || spec.defaultDuration),
    0,
  );
  const totalDraftQuestions = OFFICIAL_SNBT_SUBTEST_SPEC.reduce(
    (sum, spec) => sum + (Number(draftTargets[spec.code]) || spec.fullQuestionTarget),
    0,
  );
  const activeSubtestCount = subtests.filter((s) => Number(s.questionCount) > 0).length;
  const breakCount = Math.max(0, (activeSubtestCount > 0 ? activeSubtestCount : 7) - 1);

  function applyPreset(mode: 'FULL_SNBT' | 'HALF_SNBT' | 'DIAGNOSTIC') {
    const nextDurations: Record<string, number> = {};
    const nextTargets: Record<string, number> = {};
    for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
      if (mode === 'FULL_SNBT') {
        nextDurations[spec.code] = spec.defaultDuration;
        nextTargets[spec.code] = spec.fullQuestionTarget;
      } else if (mode === 'HALF_SNBT') {
        nextDurations[spec.code] = Math.max(8, Math.round(spec.defaultDuration * 0.5));
        nextTargets[spec.code] = spec.miniQuestionTarget;
      } else {
        nextDurations[spec.code] = Math.max(5, Math.round(spec.defaultDuration * 0.25));
        nextTargets[spec.code] = spec.microQuestionTarget;
      }
    }
    setDraftDurations(nextDurations);
    setDraftTargets(nextTargets);
    if (mode === 'FULL_SNBT') setDraftBreakSeconds(60);
  }

  async function handleSave() {
    setSaving(true);
    onError('');
    try {
      const payload = OFFICIAL_SNBT_SUBTEST_SPEC.map((spec) => {
        const found = subtests.find((s) => s.name === spec.code);
        return {
          id: found?.id,
          code: spec.code,
          durationMinutes: Math.max(
            1,
            Math.min(180, Math.round(Number(draftDurations[spec.code]) || spec.defaultDuration)),
          ),
          targetQuestionCount: Math.max(
            1,
            Math.min(200, Math.round(Number(draftTargets[spec.code]) || spec.fullQuestionTarget)),
          ),
        };
      });
      const cleanBreak = Math.max(0, Math.min(1800, Math.round(Number(draftBreakSeconds) || 0)));
      const res = await api.patch<{
        totalDurationMinutes?: number;
        totalTargetQuestions?: number;
        breakSeconds?: number;
      }>(`/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/subtests`, {
        subtests: payload,
        breakSeconds: cleanBreak,
      });
      setEditing(false);
      onNotice(
        `Parameter subtes diperbarui: Target ${res.totalTargetQuestions ?? totalDraftQuestions} soal, total durasi ${res.totalDurationMinutes ?? totalDraftMinutes} menit, jeda antar subtes ${res.breakSeconds ?? cleanBreak} detik.`,
      );
      await onSaved();
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px 14px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Clock style={{ width: 15, height: 15, color: 'var(--muted-fg)' }} />
          <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>
            Standar Subtes: Target {totalDraftQuestions} Soal · {totalDraftMinutes} Menit Pengerjaan · Jeda Antar Subtes {draftBreakSeconds} Detik ({breakCount}× Transisi)
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            (Atur kuota soal per subtes, durasi menit, dan waktu jeda transisi subtes)
          </span>
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => setEditing((prev) => !prev)}
          style={{
            height: '32px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Wrench style={{ width: 12, height: 12 }} />
          {editing ? 'Tutup Konfigurasi Subtes' : 'Atur Kuota Soal, Durasi & Jeda Subtes'}
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          {/* Quick Presets + Break Duration */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-fg)', marginRight: '4px' }}>
                Preset Standar Subtes:
              </span>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => applyPreset('FULL_SNBT')}
                style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
              >
                Standar SNBT 2027 (160 Soal · 195m)
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => applyPreset('HALF_SNBT')}
                style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
              >
                Mini Tryout 50% (80 Soal · 98m)
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => applyPreset('DIAGNOSTIC')}
                style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
              >
                Diagnostik Kilat (35 Soal · 50m)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)' }}>
                Jeda Antar Subtes:
              </span>
              {[
                { label: 'Tanpa Jeda (0s)', value: 0 },
                { label: '30 Detik', value: 30 },
                { label: '1 Menit (60s)', value: 60 },
                { label: '2 Menit (120s)', value: 120 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="button button-secondary"
                  onClick={() => setDraftBreakSeconds(opt.value)}
                  style={{
                    height: '28px',
                    fontSize: '11px',
                    padding: '0 8px',
                    borderColor:
                      draftBreakSeconds === opt.value ? '#3b82f6' : undefined,
                    background:
                      draftBreakSeconds === opt.value ? 'rgba(59, 130, 246, 0.16)' : undefined,
                    color: draftBreakSeconds === opt.value ? '#93c5fd' : undefined,
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min={0}
                  max={1800}
                  className="field-input"
                  value={draftBreakSeconds}
                  onChange={(e) =>
                    setDraftBreakSeconds(
                      Math.max(0, Math.min(1800, Math.round(Number(e.target.value) || 0))),
                    )
                  }
                  style={{ width: '68px', height: '28px', fontSize: '12px', padding: '0 6px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>detik</span>
              </div>
            </div>
          </div>

          {/* Per-Subtest Target Question Count & Duration Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            {OFFICIAL_SNBT_SUBTEST_SPEC.map((spec) => {
              const found = subtests.find((s) => s.name === spec.code);
              const assignedCount = found?.questionCount ?? 0;
              const targetCount = draftTargets[spec.code] ?? spec.fullQuestionTarget;
              return (
                <div
                  key={spec.code}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '12px' }}>
                      {spec.code} — {spec.label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background:
                          assignedCount >= targetCount
                            ? 'rgba(16, 185, 129, 0.14)'
                            : 'rgba(245, 158, 11, 0.14)',
                        color: assignedCount >= targetCount ? '#34d399' : '#fbbf24',
                      }}
                    >
                      Terisi {assignedCount}/{targetCount} soal
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ color: 'var(--muted-fg)' }}>
                        Standar Soal (std {spec.fullQuestionTarget})
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          className="field-input"
                          value={draftTargets[spec.code] ?? spec.fullQuestionTarget}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              Math.min(200, Number(e.target.value) || spec.fullQuestionTarget),
                            );
                            setDraftTargets((prev) => ({ ...prev, [spec.code]: val }));
                          }}
                          style={{ width: '64px', height: '28px', fontSize: '12px', padding: '0 6px' }}
                        />
                        <span style={{ color: 'var(--muted-fg)' }}>soal</span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ color: 'var(--muted-fg)' }}>
                        Durasi (std {spec.defaultDuration}m)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={1}
                          max={180}
                          className="field-input"
                          value={draftDurations[spec.code] ?? spec.defaultDuration}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              Math.min(180, Number(e.target.value) || spec.defaultDuration),
                            );
                            setDraftDurations((prev) => ({ ...prev, [spec.code]: val }));
                          }}
                          style={{ width: '64px', height: '28px', fontSize: '12px', padding: '0 6px' }}
                        />
                        <span style={{ color: 'var(--muted-fg)' }}>mnt</span>
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
              Total Standar Paket: <strong style={{ color: 'var(--foreground)' }}>{totalDraftQuestions} Soal</strong> ·{' '}
              <strong style={{ color: 'var(--foreground)' }}>{totalDraftMinutes} Menit</strong> · Jeda Transisi:{' '}
              <strong style={{ color: 'var(--foreground)' }}>{draftBreakSeconds} Detik</strong>
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditing(false)}
                style={{ height: '32px', fontSize: '12px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="button button-primary"
                disabled={saving}
                onClick={() => void handleSave()}
                style={{
                  height: '32px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Save style={{ width: 12, height: 12 }} />
                {saving
                  ? 'Menyimpan…'
                  : `Simpan Parameter (${totalDraftQuestions} Soal · ${totalDraftMinutes}m · Jeda ${draftBreakSeconds}s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
