'use client';

import React, { useState } from 'react';
import {
  Eye,
  Pencil,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { MathText } from './math-text';
import {
  getDifficultyMeta,
  getQuestionStatusBadge,
  getSubtestDisplay,
} from './question-lifecycle-types';
import type { PracticeAssignedQuestion } from './practice-section';

function stripMarkdownPreview(raw: string): string {
  return (raw || '').replace(/\s+/g, ' ').trim();
}

export interface PracticeTableProps {
  loading: boolean;
  filteredAssigned: PracticeAssignedQuestion[];
  selectedTableIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allFilteredSelected: boolean;
  busyQuestionId: string | null;
  removingId: string | null;
  onWorkflow: (id: string, action: string) => void | Promise<void>;
  onOpenSandbox: (id: string) => void | Promise<void>;
  onUnassign: (id: string) => void | Promise<void>;
  onPreview: (q: PracticeAssignedQuestion) => void;
  onEditQuestion?: (q: PracticeAssignedQuestion) => void;
  onOpenRevisionModal: (q: PracticeAssignedQuestion) => void;
}

export function PracticeTable({
  loading,
  filteredAssigned,
  selectedTableIds,
  onToggleSelect,
  onToggleSelectAll,
  allFilteredSelected,
  busyQuestionId,
  removingId,
  onWorkflow,
  onOpenSandbox,
  onUnassign,
  onPreview,
  onEditQuestion,
  onOpenRevisionModal,
}: PracticeTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-3 text-center">
              <input
                type="checkbox"
                aria-label="Pilih semua soal di halaman ini"
                checked={allFilteredSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 cursor-pointer accent-sky-500 rounded"
              />
            </TableHead>
            <TableHead className="w-[140px] min-w-[130px]">ID &amp; Batch</TableHead>
            <TableHead className="w-[130px] min-w-[125px]">Status QC &amp; Tayang</TableHead>
            <TableHead className="w-[190px] min-w-[170px]">Subtes &amp; Topik</TableHead>
            <TableHead className="w-[95px] min-w-[90px]">Kesulitan</TableHead>
            <TableHead className="min-w-[240px]">Cuplikan Soal &amp; Catatan QC</TableHead>
            <TableHead className="w-[110px] min-w-[100px] text-left">Statistik Siswa</TableHead>
            <TableHead className="w-[280px] min-w-[260px] text-right pr-4">Aksi QC &amp; Latihan</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-28 text-center text-[var(--muted-fg)] font-medium">
                Memuat daftar soal latihan…
              </TableCell>
            </TableRow>
          ) : filteredAssigned.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-28 text-center text-[var(--muted-fg)] font-medium">
                Belum ada soal latihan pada filter ini. Klik <strong>Buat Soal Latihan Baru</strong> atau ambil dari Bank Soal.
              </TableCell>
            </TableRow>
          ) : (
            filteredAssigned.map((q) => {
              const subDisplay = getSubtestDisplay(q.subtest);
              const diffMeta = getDifficultyMeta(q.difficulty);
              const statusBadge = getQuestionStatusBadge(q.status);
              const statusUpper = String(q.status || 'DRAFT').toUpperCase();
              const isBusy = busyQuestionId === q.id;
              const isChecked = selectedTableIds.includes(q.id);
              const isCopied = copiedId === q.id;

              return (
                <TableRow key={q.id} data-state={isChecked ? 'selected' : undefined}>
                  <TableCell className="w-10 px-3 text-center align-top py-3">
                    <input
                      type="checkbox"
                      aria-label={`Pilih soal ${q.id}`}
                      checked={isChecked}
                      onChange={() => onToggleSelect(q.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-sky-500 rounded"
                    />
                  </TableCell>

                  <TableCell className="w-[140px] min-w-[130px] align-top py-3">
                    <div className="flex flex-col items-start gap-1">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-200">
                        <span title={`ID Lengkap: ${q.id}`} className="font-semibold select-all">
                          {q.id.length > 12 ? `${q.id.slice(0, 8)}…` : q.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(q.id, e)}
                          className="p-1 rounded hover:bg-white/10 text-muted-fg hover:text-white transition-colors"
                          title={isCopied ? 'ID Tersalin!' : 'Salin ID Soal'}
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                        </button>
                      </div>
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
                  </TableCell>

                  <TableCell className="w-[130px] min-w-[125px] align-top py-3">
                    <div className="flex flex-col items-start gap-1">
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
                  </TableCell>

                  <TableCell className="w-[190px] min-w-[170px] align-top py-3">
                    <div className="flex flex-col items-start gap-1">
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
                      <span className="text-[11px] text-[var(--muted-fg)] line-clamp-2">
                        {q.topicTitle || 'Tanpa Topik'} {q.subtopicTitle ? `› ${q.subtopicTitle}` : ''}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="w-[95px] min-w-[90px] align-top py-3">
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
                  </TableCell>

                  <TableCell className="min-w-[240px] max-w-[340px] align-top py-3">
                    <div className="text-xs text-[var(--foreground)] line-clamp-2 overflow-hidden">
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
                  </TableCell>

                  <TableCell className="w-[110px] min-w-[100px] align-top py-3">
                    <div className="text-[11px] text-[var(--muted-fg)] leading-snug whitespace-nowrap">
                      <div>
                        Dijawab: <strong style={{ color: '#34d399' }}>{q.answeredCount}</strong>
                      </div>
                      <div>
                        Dilewati: <strong style={{ color: '#fbbf24' }}>{q.skippedCount}</strong>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="w-[280px] min-w-[260px] align-top py-3 text-right pr-4">
                    <div className="flex flex-col items-end gap-1.5">
                      {/* Tier 1: Lifecycle / QC Action */}
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {statusUpper === 'DRAFT' && (
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={isBusy}
                            onClick={() => void onWorkflow(q.id, 'SUBMIT_QC')}
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
                              onClick={() => void onOpenSandbox(q.id)}
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
                              title="Uji coba interaktif di Sandbox"
                            >
                              <ExternalLink style={{ width: 11, height: 11 }} />
                              <span>Sandbox</span>
                            </button>
                            <button
                              type="button"
                              className="button button-primary"
                              disabled={isBusy}
                              onClick={() => void onWorkflow(q.id, 'APPROVE')}
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
                              title="ACC soal dan tayangkan langsung ke siswa"
                            >
                              <CheckCircle2 style={{ width: 11, height: 11 }} />
                              <span>ACC &amp; Tayangkan</span>
                            </button>
                            <button
                              type="button"
                              className="button button-secondary"
                              disabled={isBusy}
                              onClick={() => onOpenRevisionModal(q)}
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
                              title="Kirim ke kotak revisi dengan catatan"
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
                            onClick={() => void onWorkflow(q.id, 'RESUBMIT_QC')}
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
                            onClick={() => void onWorkflow(q.id, 'PULL_TO_DRAFT')}
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
                      </div>

                      {/* Tier 2: Management Tools */}
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ height: '26px', padding: '0 7px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onPreview(q)}
                          title="Pratinjau Soal"
                        >
                          <Eye style={{ width: 11, height: 11 }} />
                          <span>Preview</span>
                        </button>

                        {onEditQuestion && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ height: '26px', padding: '0 7px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => onEditQuestion(q)}
                            title="Edit soal / pembahasan"
                          >
                            <Pencil style={{ width: 11, height: 11 }} />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={removingId === q.id}
                          style={{
                            height: '26px',
                            padding: '0 7px',
                            fontSize: '11px',
                            color: '#f87171',
                            borderColor: 'rgba(248, 113, 113, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => void onUnassign(q.id)}
                          title="Keluarkan dari Latihan ke Eksperimen (Bank Soal)"
                        >
                          <Trash2 style={{ width: 11, height: 11 }} />
                          <span>{removingId === q.id ? '…' : 'Keluarkan'}</span>
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
