'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
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
  order: number;
  questionCount: number;
  readyCount?: number;
};

type TryoutHeaderMeta = {
  id: string;
  code: number;
  title: string;
  curationStatus?: TryoutCurationStatus;
  revisionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  totalDurationMinutes?: number;
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
  jituMainUrl: string;
  onUpdated: () => Promise<void> | void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
  onOpenAutoBalance?: () => void;
}) {
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  if (!tryout) return null;

  const isPublished = (tryout.curationStatus || 'DRAFT') === 'PUBLISHED';
  const badge = getTryoutStatusBadge(isPublished ? 'PUBLISHED' : 'DRAFT');
  const pendingCount = Math.max(0, questionCount - readyQuestionCount);
  const allReady = questionCount > 0 && pendingCount === 0;

  async function runWorkflow(action: 'APPROVE' | 'UNPUBLISH') {
    if (!tryout) return;
    if (action === 'APPROVE') {
      if (!allReady) {
        onError(
          questionCount <= 0
            ? 'Masukkan soal terlebih dahulu sebelum mem-publish paket Tryout.'
            : `Masih ada ${pendingCount} soal di Tryout ini yang belum lolos QC (belum berstatus Siap / Ready). Selesaikan QC semua soal di tabel bawah terlebih dahulu.`,
        );
        return;
      }
      const ok = window.confirm(
        `Publish Paket Tryout "${tryout.title}" ke halaman siswa? Riwayat percobaan akun Sandbox (QA) pada tryout ini akan dibersihkan otomatis agar leaderboard siswa mulai bersih.`,
      );
      if (!ok) return;
    }
    if (action === 'UNPUBLISH') {
      const ok = window.confirm(
        `Tarik Paket Tryout "${tryout.title}" kembali ke Draf? Tryout akan disembunyikan sementara dari daftar publik siswa.`,
      );
      if (!ok) return;
    }

    setBusyAction(action);
    onError('');
    try {
      await api.post(`/team/control-center/tryouts/${encodeURIComponent(tryout.id)}/workflow`, {
        action,
      });
      onNotice(
        action === 'APPROVE'
          ? 'Paket Tryout berhasil di-publish ke halaman siswa!'
          : 'Paket Tryout ditarik kembali ke Draf.',
      );
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

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          className="pill"
          style={{
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
            fontWeight: 700,
          }}
        >
          {isPublished ? 'Published (Live)' : 'Draf Paket'}
        </span>

        <span
          className="pill"
          style={{
            background: allReady ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
            color: allReady ? '#10b981' : '#f59e0b',
            border: `1px solid ${allReady ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            fontWeight: 600,
          }}
        >
          Kesiapan QC Soal: {readyQuestionCount}/{questionCount} Siap (Ready)
        </span>

        <span style={{ fontSize: '12px', color: 'var(--muted-fg)' }}>
          Durasi Subtes: <strong style={{ color: 'var(--foreground)' }}>{totalDurationMinutes} menit</strong>
          {pendingCount > 0 && (
            <span style={{ color: 'var(--muted-fg)', marginLeft: '6px' }}>
              · {pendingCount} soal masih perlu di-QC sebelum paket di-publish
            </span>
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
            title="Atur parameter persentase tipe soal & rasio kesulitan paket ini"
          >
            <Sliders style={{ width: 13, height: 13 }} />
            <span>Atur Auto-Balance Paket</span>
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
          {busyAction === 'SANDBOX' ? 'Membuka Sandbox…' : 'Uji Paket di Sandbox'}
        </button>

        {!isPublished ? (
          <button
            type="button"
            className="button button-primary"
            disabled={busyAction !== null || !allReady}
            title={
              questionCount <= 0
                ? 'Masukkan minimal 1 soal terlebih dahulu'
                : !allReady
                  ? `Masih ada ${pendingCount} soal yang belum berstatus Siap (Ready)`
                  : 'Publish paket Tryout ke halaman siswa'
            }
            onClick={() => void runWorkflow('APPROVE')}
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
            <CheckCircle2 style={{ width: 13, height: 13 }} />
            {busyAction === 'APPROVE' ? 'Mem-publish…' : 'Publish Paket Tryout'}
          </button>
        ) : (
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
          >
            <RotateCcw style={{ width: 13, height: 13 }} />
            {busyAction === 'UNPUBLISH' ? 'Menarik…' : 'Tarik Paket ke Draf'}
          </button>
        )}
      </div>
    </div>
  );
}

export function TryoutSubtestTimerPanel({
  tryoutId,
  subtests,
  onSaved,
  onError,
  onNotice,
}: {
  tryoutId: string;
  subtests: SubtestRow[];
  onSaved: () => Promise<void> | void;
  onError: (msg: string) => void;
  onNotice: (msg: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draftDurations, setDraftDurations] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const initial: Record<string, number> = {};
    for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
      const found = subtests.find((s) => s.name === spec.code);
      initial[spec.code] = found ? Number(found.durationMinutes) || spec.defaultDuration : spec.defaultDuration;
    }
    setDraftDurations(initial);
  }, [subtests]);

  const totalDraftMinutes = OFFICIAL_SNBT_SUBTEST_SPEC.reduce(
    (sum, spec) => sum + (Number(draftDurations[spec.code]) || spec.defaultDuration),
    0,
  );
  const activeSubtestCount = subtests.filter((s) => Number(s.questionCount) > 0).length;
  const breakCount = Math.max(0, (activeSubtestCount > 0 ? activeSubtestCount : 7) - 1);

  function handleResetOfficial() {
    const reset: Record<string, number> = {};
    for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
      reset[spec.code] = spec.defaultDuration;
    }
    setDraftDurations(reset);
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
          durationMinutes: Math.max(1, Math.min(180, Math.round(Number(draftDurations[spec.code]) || spec.defaultDuration))),
        };
      });
      const res = await api.patch<{ totalDurationMinutes?: number }>(
        `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/subtests`,
        { subtests: payload },
      );
      setEditing(false);
      onNotice(`Durasi subtes diperbarui (total pengerjaan ${res.totalDurationMinutes ?? totalDraftMinutes} menit + jeda antar subtes 1 menit).`);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Clock style={{ width: 15, height: 15, color: 'var(--muted-fg)' }} />
          <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>
            Timer Subtes ({totalDraftMinutes} Menit Pengerjaan + {breakCount}×1 Menit Buffer Jeda)
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--muted-fg)' }}>
            Jeda 1 menit antar subtes memiliki countdown + tombol Skip di UI ujian siswa
          </span>
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => setEditing((prev) => !prev)}
          style={{ height: '32px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Wrench style={{ width: 12, height: 12 }} />
          {editing ? 'Tutup Editor Timer' : 'Atur Durasi Subtes'}
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            {OFFICIAL_SNBT_SUBTEST_SPEC.map((spec) => (
              <label
                key={spec.code}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '11px',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                  {spec.code} — <span style={{ color: 'var(--muted-fg)', fontWeight: 500 }}>std {spec.defaultDuration}m</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    className="field-input"
                    value={draftDurations[spec.code] ?? spec.defaultDuration}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(180, Number(e.target.value) || spec.defaultDuration));
                      setDraftDurations((prev) => ({ ...prev, [spec.code]: val }));
                    }}
                    style={{ width: '76px', height: '30px', fontSize: '12px', padding: '0 8px' }}
                  />
                  <span style={{ color: 'var(--muted-fg)' }}>menit</span>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleResetOfficial}
              style={{ height: '32px', fontSize: '12px' }}
            >
              Reset Standar SNBT (195 Menit)
            </button>
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
                style={{ height: '32px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Save style={{ width: 12, height: 12 }} />
                {saving ? 'Menyimpan…' : `Simpan (${totalDraftMinutes} Menit)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
