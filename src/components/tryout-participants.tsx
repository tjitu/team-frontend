'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { Tryout } from './tryout-table-types';
import styles from './tryout-participants.module.css';

type Participant = { id: string; userId: string; name: string; email: string; status: string };
const labels: Record<string, string> = { NOT_STARTED: 'Belum mengerjakan', IN_PROGRESS: 'Sedang mengerjakan', FINISHED: 'Selesai' };

export function TryoutParticipants({ tryout, disabled, onChanged }: { tryout: Tryout; disabled: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
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
    if (!window.confirm(`Reset pengerjaan ${participant.name}? Jawaban dan nilai akan dihapus. Pendaftaran dan akses pembahasan tetap ada.`)) return;
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
          <div><h2>Peserta: {tryout.title}</h2><p>Reset menghapus jawaban dan nilai, tetapi pendaftaran tetap aktif.</p></div>
          <button type="button" className="table-action-btn" onClick={() => setOpen(false)}>Tutup</button>
        </div>
        {tryout.scheduledEnd && new Date(tryout.scheduledEnd).getTime() < Date.now() && <p>Periode tryout telah berakhir. Sesuaikan jadwal jika peserta perlu mengerjakan ulang.</p>}
        {error && <p role="alert">{error}</p>}
        {loading ? <p>Memuat peserta...</p> : participants.length === 0 ? <p>Belum ada peserta.</p> :
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Nama</th><th>Email</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
            {participants.map((participant) => <tr key={participant.id}>
              <td>{participant.name}</td><td>{participant.email}</td><td>{labels[participant.status] || participant.status}</td>
              <td>{['FINISHED', 'IN_PROGRESS'].includes(participant.status) && <button type="button" className="table-action-btn" disabled={Boolean(busy)} onClick={() => void reset(participant)}>{busy === participant.id ? 'Mereset...' : 'Reset pengerjaan'}</button>}</td>
            </tr>)}
          </tbody></table></div>}
      </section>
    </div>}
  </>;
}
