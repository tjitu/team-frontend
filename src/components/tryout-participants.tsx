'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { Tryout } from './tryout-table-types';
import styles from './tryout-participants.module.css';
import { GrowthVerificationQueue } from './registration-growth/growth-verification-queue';
import growthStyles from './registration-growth/growth.module.css';

type Participant = {
  id: string; userId: string; name: string; email: string; status: string;
  rank: number | null; score: number | null; correctCount: number | null; wrongCount: number | null;
  emptyCount: number | null;
};
const labels: Record<string, string> = { NOT_STARTED: 'Belum mengerjakan', IN_PROGRESS: 'Sedang mengerjakan', FINISHED: 'Selesai' };

export function TryoutParticipants({ tryout, disabled, onChanged }: { tryout: Tryout; disabled: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'results' | 'verification'>('results');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const path = `/team/control-center/tryouts/${encodeURIComponent(tryout.id)}/participants`;

  async function load() {
    setLoading(true); setError('');
    try { setParticipants(await api.get<Participant[]>(path, { force: true })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Peserta gagal dimuat.'); }
    finally { setLoading(false); }
  }
  async function reset(participant: Participant) {
    if (!window.confirm(`Reset pengerjaan ${participant.name}? Semua jawaban dan hasil tryout ini akan dihapus. Peserta tetap terdaftar dan bisa mengerjakan ulang. Hak pembahasan yang sudah dibeli tetap tersimpan.`)) return;
    setBusy(participant.id); setError('');
    try {
      await api.post(`${path}/${encodeURIComponent(participant.id)}/reset`);
      await load(); onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Reset gagal.'); }
    finally { setBusy(''); }
  }
  return <>
    <button type="button" className="table-action-btn" disabled={disabled} onClick={() => { setOpen(true); void load(); }}>
      <Users className="action-icon" /> Peserta
    </button>
    {open && <div className="modal-overlay" role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Peserta ${tryout.title}`}>
        <div className={styles.header}>
          <div><h2>Peserta: {tryout.title}</h2><p>Peringkat sementara berdasarkan skor IRT peserta yang sudah selesai, termasuk yang selesai setelah periode berakhir. Muat ulang untuk memperbarui.</p></div>
          {tab === 'results' && <button type="button" className="table-action-btn" disabled={loading} onClick={() => void load()}>Muat ulang</button>}
          <button type="button" className="table-action-btn" onClick={() => setOpen(false)}>Tutup</button>
        </div>
        <nav className={growthStyles.tabs} aria-label="Manajemen peserta">
          <button type="button" className={`button ${tab === 'results' ? 'button-primary' : 'button-secondary'}`} onClick={() => setTab('results')}>Hasil peserta</button>
          <button type="button" className={`button ${tab === 'verification' ? 'button-primary' : 'button-secondary'}`} onClick={() => setTab('verification')}>Verifikasi pendaftaran</button>
        </nav>
        {tab === 'verification' ? <GrowthVerificationQueue tryoutId={tryout.id} onChanged={onChanged} /> : <>
        {tryout.scheduledEnd && new Date(tryout.scheduledEnd).getTime() < Date.now() && <p>Periode tryout telah berakhir. Sesuaikan jadwal jika peserta perlu mengerjakan ulang.</p>}
        {error && <p role="alert">{error}</p>}
        {loading ? <p>Memuat peserta...</p> : participants.length === 0 ? <p>Belum ada peserta.</p> :
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Peringkat</th><th>Nama</th><th>Email</th><th>Status</th><th>Benar</th><th>Salah</th><th>Kosong</th><th>Skor IRT</th><th>Aksi</th></tr></thead><tbody>
            {participants.map((participant) => <tr key={participant.id}>
              <td>{participant.rank != null ? `#${participant.rank}` : '—'}</td>
              <td>{participant.name}</td><td>{participant.email}</td><td>{labels[participant.status] || participant.status}</td>
              <td>{participant.correctCount ?? '—'}</td><td>{participant.wrongCount ?? '—'}</td>
              <td>{participant.emptyCount ?? '—'}</td>
              <td>{participant.score != null ? Math.round(participant.score) : '—'}</td>
              <td>{['FINISHED', 'IN_PROGRESS'].includes(participant.status) && <button type="button" className="table-action-btn" disabled={Boolean(busy)} onClick={() => void reset(participant)}>{busy === participant.id ? 'Mereset...' : 'Reset pengerjaan'}</button>}</td>
            </tr>)}
          </tbody></table></div>}
        </>}
      </section>
    </div>}
  </>;
}
