'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import type { PracticeAssignedQuestion } from './practice-section';

export interface PracticeTableActionsProps {
  question: PracticeAssignedQuestion;
  isBusy: boolean;
  removingId: string | null;
  onWorkflow: (id: string, action: string) => void | Promise<void>;
  onOpenSandbox: (id: string) => void | Promise<void>;
  onUnassign: (id: string) => void | Promise<void>;
  onPreview: (q: PracticeAssignedQuestion) => void;
  onEditQuestion?: (q: PracticeAssignedQuestion) => void;
  onOpenRevisionModal: (q: PracticeAssignedQuestion) => void;
}

export function PracticeTableActions({
  question: q,
  isBusy,
  removingId,
  onWorkflow,
  onOpenSandbox,
  onUnassign,
  onPreview,
  onEditQuestion,
  onOpenRevisionModal,
}: PracticeTableActionsProps) {
  const statusUpper = String(q.status || 'DRAFT').toUpperCase();

  const compactBtnStyle: React.CSSProperties = {
    height: '25px',
    padding: '0 7px',
    fontSize: '11px',
    gap: '4px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', flexWrap: 'nowrap' }}>
        {statusUpper === 'DRAFT' && (
          <button
            type="button"
            className="table-action-btn"
            style={{ ...compactBtnStyle, color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)' }}
            disabled={isBusy}
            onClick={() => void onWorkflow(q.id, 'SUBMIT_QC')}
            title="Ajukan soal ini ke Antrean QC Sandbox"
          >
            <Send className="action-icon" /> {isBusy ? '…' : 'Ajukan QC'}
          </button>
        )}

        {statusUpper === 'QC_SANDBOX' && (
          <>
            <button
              type="button"
              className="table-action-btn"
              style={{ ...compactBtnStyle, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)' }}
              disabled={isBusy}
              onClick={() => void onWorkflow(q.id, 'APPROVE')}
              title="ACC soal dan tayangkan langsung ke siswa di /latihan"
            >
              <CheckCircle2 className="action-icon" /> ACC
            </button>
            <button
              type="button"
              className="table-action-btn"
              style={{ ...compactBtnStyle, color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.35)' }}
              disabled={isBusy}
              onClick={() => onOpenRevisionModal(q)}
              title="Kirim ke kotak revisi dengan catatan"
            >
              <AlertTriangle className="action-icon" /> Revisi
            </button>
            <button
              type="button"
              className="table-action-btn"
              style={{ ...compactBtnStyle, color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}
              disabled={isBusy}
              onClick={() => void onOpenSandbox(q.id)}
              title="Uji coba interaktif di Sandbox"
            >
              <ExternalLink className="action-icon" /> Sandbox
            </button>
          </>
        )}

        {statusUpper === 'NEEDS_REVISION' && (
          <button
            type="button"
            className="table-action-btn"
            style={{ ...compactBtnStyle, color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)' }}
            disabled={isBusy}
            onClick={() => void onWorkflow(q.id, 'RESUBMIT_QC')}
            title="Ajukan ulang hasil revisi ke Antrean QC"
          >
            <Send className="action-icon" /> {isBusy ? '…' : 'Ajukan Ulang'}
          </button>
        )}

        {statusUpper === 'READY' && (
          <button
            type="button"
            className="table-action-btn"
            style={{ ...compactBtnStyle, color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)' }}
            disabled={isBusy}
            onClick={() => void onWorkflow(q.id, 'PULL_TO_DRAFT')}
            title="Tarik dari /latihan kembali ke Draf"
          >
            <RotateCcw className="action-icon" /> Tarik Draf
          </button>
        )}

        {statusUpper === 'RETIRED' && (
          <button
            type="button"
            className="table-action-btn"
            style={{ ...compactBtnStyle, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)' }}
            disabled={isBusy}
            onClick={() => void onWorkflow(q.id, 'RESTORE')}
            title="Pulihkan ke Siap (Ready)"
          >
            <RotateCcw className="action-icon" /> Pulihkan
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', flexWrap: 'nowrap' }}>
        <button
          type="button"
          className="table-action-btn"
          style={compactBtnStyle}
          onClick={() => onPreview(q)}
          title="Pratinjau Soal &amp; Pembahasan"
        >
          <Eye className="action-icon" /> Detail
        </button>

        {onEditQuestion && (
          <button
            type="button"
            className="table-action-btn"
            style={compactBtnStyle}
            onClick={() => onEditQuestion(q)}
            title="Edit soal / pembahasan"
          >
            <Pencil className="action-icon" /> Edit
          </button>
        )}

        <button
          type="button"
          className="table-action-btn table-action-btn-danger"
          style={compactBtnStyle}
          disabled={removingId === q.id}
          onClick={() => void onUnassign(q.id)}
          title="Keluarkan dari Latihan ke Eksperimen (Bank Soal)"
        >
          <Trash2 className="action-icon" /> {removingId === q.id ? '…' : 'Keluarkan'}
        </button>
      </div>
    </div>
  );
}
