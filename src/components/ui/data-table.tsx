'use client';

import * as React from 'react';
import {
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { features, type DataTableFeatures } from './data-table-features';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData, any>[];
  data: TData[];
  searchKey?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
  isRowSelected?: (row: TData) => boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchKey,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Filter records...',
  emptyMessage = 'No records found.',
  pageSize = 10,
  className,
  isRowSelected,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  React.useEffect(() => {
    if (searchKey && searchValue !== undefined) {
      table.getColumn(searchKey)?.setFilterValue(searchValue);
    }
  }, [searchKey, searchValue, table]);

  return (
    <div className={cn('data-table-wrapper space-y-3', className)}>
      {searchKey && onSearchChange && (
        <div className="flex items-center">
          <input
            className="field-input max-w-sm"
            placeholder={searchPlaceholder}
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={(isRowSelected ? isRowSelected(row.original) : row.getIsSelected()) ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-[var(--muted-fg)] font-medium"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-1 py-1 text-xs text-[var(--muted-fg)]">
          <div>
            Showing{' '}
            <strong className="text-[var(--foreground)]">
              {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length}
            </strong>{' '}
            items (Page {table.state.pagination.pageIndex + 1} of{' '}
            {table.getPageCount()})
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              className="button button-secondary"
              style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="button button-secondary"
              style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </button>
            <button
              type="button"
              className="button button-secondary"
              style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </button>
            <button
              type="button"
              className="button button-secondary"
              style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
