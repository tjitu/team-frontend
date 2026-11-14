'use client';

import React, { useMemo } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/components/ui/data-table-features';
import type { PracticeAssignedQuestion } from './practice-section';
import {
  PracticeQuestionIdCell,
  PracticeQuestionStatusCell,
  PracticeQuestionSubtestCell,
  PracticeQuestionDifficultyCell,
  PracticeQuestionContentCell,
  PracticeQuestionStatsCell,
} from './practice-table-cells';
import { PracticeTableActions } from './practice-table-actions';

const practiceColHelper = createColumnHelper<DataTableFeatures, PracticeAssignedQuestion>();

export interface UsePracticeColumnsOptions {
  copiedId: string | null;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  selectedTableIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll?: () => void;
  onToggleSelectPage?: (pageIds: string[]) => void;
  busyQuestionId: string | null;
  removingId: string | null;
  onWorkflow: (id: string, action: string) => void | Promise<void>;
  onOpenSandbox: (id: string) => void | Promise<void>;
  onUnassign: (id: string) => void | Promise<void>;
  onPreview: (q: PracticeAssignedQuestion) => void;
  onEditQuestion?: (q: PracticeAssignedQuestion) => void;
  onOpenRevisionModal: (q: PracticeAssignedQuestion) => void;
}

export function usePracticeColumns({
  copiedId,
  onCopyId,
  selectedTableIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleSelectPage,
  busyQuestionId,
  removingId,
  onWorkflow,
  onOpenSandbox,
  onUnassign,
  onPreview,
  onEditQuestion,
  onOpenRevisionModal,
}: UsePracticeColumnsOptions): ColumnDef<DataTableFeatures, PracticeAssignedQuestion, any>[] {
  return useMemo(() => [
    practiceColHelper.display({
      id: 'select',
      header: ({ table }) => {
        const pageIds = table.getRowModel().rows.map((r) => r.original.id);
        const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedTableIds.includes(id));
        const somePageSelected = pageIds.some((id) => selectedTableIds.includes(id));
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="checkbox"
              aria-label="Pilih semua soal di halaman ini"
              checked={allPageSelected}
              ref={(el) => {
                if (el) el.indeterminate = somePageSelected && !allPageSelected;
              }}
              onChange={() => {
                if (onToggleSelectPage) {
                  onToggleSelectPage(pageIds);
                } else if (onToggleSelectAll) {
                  onToggleSelectAll();
                }
              }}
              style={{ width: '15px', height: '15px', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
          </div>
        );
      },
      cell: ({ row }) => {
        const q = row.original;
        const checked = selectedTableIds.includes(q.id);
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              aria-label={`Pilih soal ${q.id}`}
              checked={checked}
              onChange={() => onToggleSelect(q.id)}
              style={{ width: '15px', height: '15px', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
          </div>
        );
      },
    }),
    practiceColHelper.accessor('id', {
      header: 'ID Soal',
      cell: ({ row }) => (
        <PracticeQuestionIdCell
          question={row.original}
          isCopied={copiedId === row.original.id}
          onCopy={onCopyId}
        />
      ),
    }),
    practiceColHelper.accessor('status', {
      header: 'Status QC & Tayang',
      cell: ({ row }) => <PracticeQuestionStatusCell question={row.original} />,
    }),
    practiceColHelper.display({
      id: 'subtest',
      header: 'Subtes & Topik',
      cell: ({ row }) => <PracticeQuestionSubtestCell question={row.original} />,
    }),
    practiceColHelper.accessor('difficulty', {
      header: 'Kesulitan',
      cell: ({ row }) => <PracticeQuestionDifficultyCell difficulty={row.original.difficulty} />,
    }),
    practiceColHelper.accessor('content', {
      header: 'Cuplikan Soal & Catatan QC',
      cell: ({ row }) => <PracticeQuestionContentCell question={row.original} />,
    }),
    practiceColHelper.display({
      id: 'statistics',
      header: 'Statistik Siswa',
      cell: ({ row }) => <PracticeQuestionStatsCell question={row.original} />,
    }),
    practiceColHelper.display({
      id: 'actions',
      header: () => <div style={{ width: '152px', marginLeft: 'auto', textAlign: 'left' }}>Aksi &amp; Latihan</div>,
      cell: ({ row }) => (
        <PracticeTableActions
          question={row.original}
          isBusy={busyQuestionId === row.original.id}
          removingId={removingId}
          onWorkflow={onWorkflow}
          onOpenSandbox={onOpenSandbox}
          onUnassign={onUnassign}
          onPreview={onPreview}
          onEditQuestion={onEditQuestion}
          onOpenRevisionModal={onOpenRevisionModal}
        />
      ),
    }),
  ], [
    copiedId,
    onCopyId,
    selectedTableIds,
    onToggleSelect,
    onToggleSelectPage,
    onToggleSelectAll,
    busyQuestionId,
    removingId,
    onWorkflow,
    onOpenSandbox,
    onOpenRevisionModal,
    onPreview,
    onEditQuestion,
    onUnassign,
  ]);
}
