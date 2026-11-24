import type { PromptPlan } from './question-prompt-chunks';

interface Props {
  plan: PromptPlan | null;
  count: number;
  selected: number;
  busy: boolean;
  onCount: (value: number) => void;
  onSelect: (index: number) => void;
  onStart: () => void;
  onClose: () => void;
}
export function QuestionChunkControls(p: Props) {
  if (!p.plan) return (
    <div className="flex flex-wrap items-center gap-2">
      <label>Jumlah chunk <input className="field-input w-20" type="number" min={1} max={160}
        value={p.count} onChange={e => p.onCount(Math.max(1, Math.min(160, Number.parseInt(e.target.value) || 1)))} /></label>
      {p.count === 1 ? <small>1 = prompt reguler</small> :
        <button type="button" className="button button-secondary" onClick={p.onStart}>Buat rencana chunk</button>}
    </div>
  );
  const chunks = p.plan.chunks;
  const done = chunks.filter(c => c.saved === c.keys.length).length;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {p.plan.version !== 2 && <p className="w-full text-sm">Rencana ini dibuat sebelum perbaikan distribusi. Akhiri rencana lalu buat rencana baru untuk memakai pembagian terbaru; soal yang sudah tersimpan tetap ada.</p>}
      <label>{done}/{chunks.length} chunk selesai
        <select className="field-input" value={p.selected} onChange={e => p.onSelect(Number(e.target.value))}>
          {chunks.map((c,i) => <option key={c.id} value={i}>Chunk {i+1} · {c.saved}/{c.keys.length} soal · {c.saved === c.keys.length ? 'Selesai' : 'Belum selesai'}</option>)}
        </select>
      </label>
      <button type="button" disabled={p.busy} className="button button-secondary" onClick={p.onClose}>
        {done === chunks.length ? 'Mulai rencana baru' : 'Akhiri rencana'}
      </button>
    </div>
  );
}
