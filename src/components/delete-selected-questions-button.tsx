import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  tryoutId?: string;
  questionIds: string[];
  visibleIds: string[];
  busy: string | null;
  setBusy: (value: string | null) => void;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
  onDeleted: (ids: Set<string>) => Promise<void>;
}

export function DeleteSelectedQuestionsButton({
  tryoutId, questionIds, visibleIds, busy, setBusy, onError, onNotice, onDeleted,
}: Props) {
  async function removeSelected() {
    if (busy || !questionIds.length) return;
    const visible = new Set(visibleIds);
    const hidden = questionIds.filter(id => !visible.has(id)).length;
    const filterNote = hidden ? ` Ada ${hidden} soal terpilih di luar filter saat ini.` : '';
    const sandboxNote = tryoutId ? ' Jawaban QC sandbox untuk soal terpilih di tryout ini juga akan dihapus.' : '';
    if (!window.confirm(
      `Hapus permanen ${questionIds.length} soal terpilih dari Bank Soal beserta opsi dan pembahasannya?${filterNote}${sandboxNote} Tindakan ini tidak bisa dibatalkan.`,
    )) return;

    setBusy('DELETE');
    onError('');
    onNotice('');
    try {
      const { deletedCount } = await api.post<{ deletedCount: number }>(
        '/team/control-center/questions/bulk-delete', { questionIds, tryoutId },
      );
      onNotice(`${deletedCount} soal dihapus permanen.`);
      await onDeleted(new Set(questionIds));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Gagal menghapus soal terpilih.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <button type="button" className="table-action-btn table-action-btn-danger"
      disabled={busy !== null || !questionIds.length} onClick={() => void removeSelected()}>
      <Trash2 className="action-icon" />
      {busy === 'DELETE' ? 'Menghapus...' : 'Hapus permanen'}
    </button>
  );
}
