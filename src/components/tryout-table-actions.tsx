'use client';

import { CheckCircle2, Edit, ExternalLink, Layers, RotateCcw, Sliders, Trash2 } from 'lucide-react';
import type { Tryout, TryoutActions, TryoutLifecycle } from './tryout-table-types';
import { TryoutParticipants } from './tryout-participants';

interface Props extends TryoutActions {
  tryout: Tryout;
  lifecycle: TryoutLifecycle;
  isBusy: boolean;
  isDeleting: boolean;
}

export function TryoutTableActions({
  tryout, lifecycle, isBusy, isDeleting,
  onAutoBalance, onManageQuestions, onSandbox, onWorkflow, onEdit, onDelete, onParticipantsChanged,
}: Props) {
  const disabled = isBusy || isDeleting;
  const isPublished = lifecycle !== 'DRAFT';
  const hasQuestions = Number(tryout.questionCount ?? 0) > 0;

  return (
    <div className="table-action-stack">
      <TryoutParticipants tryout={tryout} disabled={disabled} onChanged={onParticipantsChanged} />
      <button type="button" className="table-action-btn" disabled={disabled}
        onClick={() => onAutoBalance(tryout)} title="Atur Auto-Balance komposisi tipe, level, dan materi tryout">
        <Sliders className="action-icon" /> Auto-Balance
      </button>
      <button type="button" className="table-action-btn" disabled={disabled}
        onClick={() => onManageQuestions(tryout)} title="Kelola soal, QC, timer subtes, dan publish tryout">
        <Layers className="action-icon" /> Kelola Soal
      </button>
      <button type="button" className="table-action-btn" disabled={disabled || !hasQuestions}
        onClick={() => void onSandbox(tryout)}
        title={hasQuestions ? 'Uji simulasi full paket Tryout di Sandbox' : 'Tambahkan minimal 1 soal dulu'}>
        <ExternalLink className="action-icon" /> Sandbox
      </button>
      <button type="button" className="table-action-btn" disabled={disabled}
        onClick={() => void onWorkflow(tryout, isPublished ? 'UNPUBLISH' : 'PUBLISH_CATALOG')}>
        {isPublished ? <RotateCcw className="action-icon" /> : <CheckCircle2 className="action-icon" />}
        {isPublished ? 'Tarik ke Draft' : 'Publish'}
      </button>
      <button type="button" className="table-action-btn" disabled={disabled}
        onClick={() => onEdit(tryout)} title="Edit tryout">
        <Edit className="action-icon" /> Edit
      </button>
      <button type="button" className="table-action-btn table-action-btn-danger" disabled={disabled}
        onClick={() => void onDelete(tryout)} aria-label={`Force delete tryout ${tryout.title}`}
        title="Permanently delete this tryout and its student history; keep its questions">
        <Trash2 className="action-icon" /> {isDeleting ? 'Deleting…' : 'Force delete'}
      </button>
    </div>
  );
}
