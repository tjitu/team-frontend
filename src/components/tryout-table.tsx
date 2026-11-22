'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from './ui/data-table';
import type { DataTableFeatures } from './ui/data-table-features';
import { TryoutTableActions } from './tryout-table-actions';
import type { Tryout, TryoutActions, TryoutLifecycle } from './tryout-table-types';
import styles from './tryout-table.module.css';

const column = createColumnHelper<DataTableFeatures, Tryout>();
const lifecycleLabels = { DRAFT: 'Draft', PUBLIC: 'Public', LIVE: 'Live' };
const lifecycleStyles = { DRAFT: styles.draft, PUBLIC: styles.public, LIVE: styles.live };

interface Props extends TryoutActions {
  tryouts: Tryout[];
  deletingId: string | null;
  busyId: string | null;
  getLifecycle: (tryout: Tryout) => TryoutLifecycle;
  formatDate: (value?: string | null) => string;
}

export function TryoutTable({ tryouts, deletingId, busyId, getLifecycle, formatDate, ...actions }: Props) {
  const columns = [
    column.accessor('title', {
      header: 'Tryout',
      cell: ({ row: { original: tryout } }) => {
        const questionCount = Number(tryout.questionCount ?? 0);
        const readyCount = Number(tryout.readyQuestionCount ?? 0);
        const lifecycle = getLifecycle(tryout);
        const allReady = questionCount > 0 && readyCount >= questionCount;
        return (
          <div className={styles.title}>
            <strong>{tryout.title}</strong>
            <div className={styles.metadata}>
              <span className={`${styles.badge} ${lifecycleStyles[lifecycle]}`}>{lifecycleLabels[lifecycle]}</span>
              <span className={`${styles.badge} ${allReady ? styles.live : styles.draft}`}>
                {readyCount}/{questionCount} Siap · {Number(tryout.totalDurationMinutes ?? 195)}m
              </span>
              <span>#{tryout.code}</span>
            </div>
          </div>
        );
      },
    }),
    column.accessor('batch', { header: 'Batch' }),
    column.accessor('scheduledStart', {
      header: 'Schedule',
      cell: ({ row: { original: tryout } }) => (
        <div className={styles.schedule}>
          <span>{formatDate(tryout.scheduledStart)}</span>
          <small>Ends {formatDate(tryout.scheduledEnd)}</small>
        </div>
      ),
    }),
    column.accessor('solutionPrice', {
      header: 'Solution Price',
      cell: ({ getValue }) => <span>{getValue()} coins</span>,
    }),
    column.display({
      id: 'participants',
      header: 'Peserta',
      cell: ({ row: { original: tryout } }) => (
        <dl className={styles.participants}>
          <div><dt>Registrants</dt><dd>{Number(tryout.registrantCount ?? 0)}</dd></div>
          <div><dt>Belum</dt><dd>{Number(tryout.notStartedCount ?? 0)}</dd></div>
          <div><dt>Sedang</dt><dd>{Number(tryout.inProgressCount ?? 0)}</dd></div>
          <div><dt>Selesai</dt><dd>{Number(tryout.finishedCount ?? 0)}</dd></div>
        </dl>
      ),
    }),
    column.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row: { original: tryout } }) => (
        <TryoutTableActions {...actions} tryout={tryout} lifecycle={getLifecycle(tryout)}
          isBusy={busyId === tryout.id} isDeleting={deletingId === tryout.id} />
      ),
    }),
  ];

  return <DataTable columns={columns} data={tryouts} emptyMessage="Tidak ada tryout pada filter status ini." />;
}
