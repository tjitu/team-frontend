'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { usePracticeColumns } from './practice-table-columns';
import type { PracticeAssignedQuestion } from './practice-section';

export interface PracticeTableProps {
  loading: boolean;
  filteredAssigned: PracticeAssignedQuestion[];
  selectedTableIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll?: () => void;
  onToggleSelectPage?: (pageIds: string[]) => void;
  allFilteredSelected?: boolean;
  busyQuestionId: string | null;
  removingId: string | null;
  onWorkflow: (id: string, action: string) => void | Promise<void>;
  onOpenSandbox: (id: string) => void | Promise<void>;
  onUnassign: (id: string) => void | Promise<void>;
  onPreview: (q: PracticeAssignedQuestion) => void;
  onEditQuestion?: (q: PracticeAssignedQuestion) => void;
  onOpenRevisionModal: (q: PracticeAssignedQuestion) => void;
  pageSize?: number;
}

export function PracticeTable({
  loading,
  filteredAssigned,
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
  pageSize = 10,
}: PracticeTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const columns = usePracticeColumns({
    copiedId,
    onCopyId: handleCopy,
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
  });

  if (loading) {
    return <div className="control-empty">Memuat daftar soal latihan…</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={filteredAssigned}
      pageSize={pageSize}
      isRowSelected={(row) => selectedTableIds.includes(row.id)}
      emptyMessage="Belum ada soal latihan pada filter ini. Klik Buat Soal Latihan Baru atau ambil dari Bank Soal."
    />
  );
}
