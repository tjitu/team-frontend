'use client';

import * as React from 'react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Send,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  api,
  BroadcastStatus,
  MarketingPartnership,
  MarketingPartnershipsResponse,
  MarketingPartnershipSummary,
  ProjectRole,
  signInUrl,
  Task,
  TaskPriority,
  TeamMember,
} from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BROADCAST_STATUS_MAP,
  BROADCAST_STATUS_OPTIONS,
  buildPartnershipsCsv,
  CATEGORY_PRESETS,
  getFollowUpUrgency,
  localDateKey,
  ParsedImportRow,
  parsePartnershipImportText,
  PLATFORM_PRESETS,
  tokenizeNoteLinks,
} from '@/components/partnership-sheet-utils';

type EditableCellField = 'name' | 'totalMembers' | 'picName' | 'picContact' | 'notes';

type EditingCell = {
  id: string;
  field: EditableCellField;
  value: string;
};

type QuickDraft = {
  name: string;
  category: string;
  platform: string;
  totalMembers: string;
  picName: string;
  picContact: string;
  broadcastStatus: BroadcastStatus;
  followUpDate: string;
  notes: string;
};

export interface PartnershipSheetProps {
  projectId?: string;
  canWrite: boolean;
  projectMembers?: Array<{ id: string; role: ProjectRole; teamMember: TeamMember }>;
  onOpenTask?: (taskId: string) => void;
  onTaskCreated?: () => void;
}

const EMPTY_DRAFT: QuickDraft = {
  name: '',
  category: 'Creator',
  platform: 'X',
  totalMembers: '',
  picName: '',
  picContact: '',
  broadcastStatus: 'NOT_STARTED',
  followUpDate: '',
  notes: '',
};

const IN_PROGRESS_STATUSES = new Set<BroadcastStatus>([
  'CONTACTED',
  'NEGOTIATING',
  'AWAITING_RESPONSE',
]);

const TASK_STATUS_LABEL: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const numberFormatter = new Intl.NumberFormat('en-US');

function computeSummaryFromRows(rows: MarketingPartnership[]): MarketingPartnershipSummary {
  const totalTarget = rows.length;
  let totalReach = 0;
  let broadcastPublished = 0;
  let inProgress = 0;

  for (const row of rows) {
    totalReach += row.totalMembers;
    if (row.broadcastStatus === 'PUBLISHED') broadcastPublished += 1;
    else if (IN_PROGRESS_STATUSES.has(row.broadcastStatus)) inProgress += 1;
  }

  return {
    totalTarget,
    totalReach,
    broadcastPublished,
    inProgress,
    successRate: totalTarget > 0 ? Math.round((broadcastPublished / totalTarget) * 1000) / 10 : 0,
  };
}

function mergeOptions(base: string[], extra: string[]): string[] {
  const seen = new Map<string, string>();
  for (const item of [...base, ...extra]) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return Array.from(seen.values());
}

/**
 * Interactive Community & Partnership spreadsheet view with inline cell editing,
 * Google Sheets CSV/TSV import/export, and follow-up TeamTask creation per partner row.
 */
export function PartnershipSheet({
  projectId,
  canWrite,
  projectMembers = [],
  onOpenTask,
  onTaskCreated,
}: PartnershipSheetProps) {
  const endpoint = projectId
    ? `/team/marketing/partnerships?projectId=${encodeURIComponent(projectId)}`
    : '/team/marketing/partnerships';

  const [allRows, setAllRows] = useState<MarketingPartnership[]>(
    () => api.getCached<MarketingPartnershipsResponse>(endpoint)?.items ?? [],
  );
  const [facets, setFacets] = useState<{ categories: string[]; platforms: string[] }>(() => {
    const cached = api.getCached<MarketingPartnershipsResponse>(endpoint);
    return cached?.facets ?? { categories: CATEGORY_PRESETS, platforms: PLATFORM_PRESETS };
  });
  const [loading, setLoading] = useState(() => !api.getCached<MarketingPartnershipsResponse>(endpoint));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'scheduled'>('all');

  // Inline editing & quick-add row
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const skipBlurCommitRef = useRef(false);
  const [quickDraft, setQuickDraft] = useState<QuickDraft>(EMPTY_DRAFT);
  const [creatingQuick, setCreatingQuick] = useState(false);

  // Detail & Import modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<MarketingPartnership | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Follow-up Task modal
  const [taskModalRow, setTaskModalRow] = useState<MarketingPartnership | null>(null);
  const [taskAssigneeIds, setTaskAssigneeIds] = useState<string[]>([]);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState('');

  const load = useCallback(
    async (force = false) => {
      if (!api.getCached<MarketingPartnershipsResponse>(endpoint)) {
        setLoading(true);
      }
      try {
        const data = await api.get<MarketingPartnershipsResponse>(endpoint, { force });
        setAllRows(data.items);
        setFacets(data.facets);
        setError('');
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Could not load partnership sheet.';
        if (message === 'SESSION_EXPIRED') {
          window.location.assign(signInUrl());
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => computeSummaryFromRows(allRows), [allRows]);

  const categoryOptions = useMemo(
    () => mergeOptions(CATEGORY_PRESETS, [...facets.categories, ...allRows.map((row) => row.category)]),
    [facets.categories, allRows],
  );

  const platformOptions = useMemo(
    () => mergeOptions(PLATFORM_PRESETS, [...facets.platforms, ...allRows.map((row) => row.platform)]),
    [facets.platforms, allRows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const todayKey = localDateKey();

    return allRows.filter((row) => {
      if (categoryFilter && row.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (platformFilter && row.platform.toLowerCase() !== platformFilter.toLowerCase()) return false;
      if (statusFilter && row.broadcastStatus !== statusFilter) return false;
      if (followUpFilter !== 'all') {
        const key = row.followUpDate ? row.followUpDate.slice(0, 10) : null;
        if (followUpFilter === 'scheduled' && !key) return false;
        if (followUpFilter === 'overdue' && (!key || key >= todayKey)) return false;
        if (followUpFilter === 'today' && key !== todayKey) return false;
        if (followUpFilter === 'upcoming' && (!key || key < todayKey)) return false;
      }
      if (query) {
        const haystack = [
          row.name,
          row.category,
          row.platform,
          row.picName ?? '',
          row.picContact ?? '',
          row.notes ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allRows, search, categoryFilter, platformFilter, statusFilter, followUpFilter]);

  const parsedImportPreview: ParsedImportRow[] = useMemo(
    () => parsePartnershipImportText(importRawText),
    [importRawText],
  );

  async function patchRow(
    row: MarketingPartnership,
    patch: Record<string, unknown>,
  ): Promise<MarketingPartnership | null> {
    if (!canWrite) return null;
    setSavingRowId(row.id);
    setError('');
    try {
      const updated = await api.patch<MarketingPartnership>(
        `/team/marketing/partnerships/${encodeURIComponent(row.id)}`,
        { version: row.version, ...patch },
      );
      setAllRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      return updated;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not update row.';
      if (message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return null;
      }
      setError(message);
      await load(true);
      return null;
    } finally {
      setSavingRowId(null);
    }
  }

  function startCellEdit(row: MarketingPartnership, field: EditableCellField) {
    if (!canWrite) return;
    skipBlurCommitRef.current = false;
    let initialValue = '';
    if (field === 'name') initialValue = row.name;
    else if (field === 'totalMembers') initialValue = String(row.totalMembers);
    else if (field === 'picName') initialValue = row.picName ?? '';
    else if (field === 'picContact') initialValue = row.picContact ?? '';
    else if (field === 'notes') initialValue = row.notes ?? '';
    setEditingCell({ id: row.id, field, value: initialValue });
  }

  async function commitCellEdit() {
    if (!editingCell) return;
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }

    const active = editingCell;
    setEditingCell(null);

    const row = allRows.find((item) => item.id === active.id);
    if (!row) return;

    const trimmed = active.value.trim();

    if (active.field === 'name') {
      if (!trimmed || trimmed === row.name) return;
      await patchRow(row, { name: trimmed });
      return;
    }

    if (active.field === 'totalMembers') {
      const parsed = Number.parseInt(trimmed.replace(/[^\d]/g, '') || '0', 10);
      const nextValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      if (nextValue === row.totalMembers) return;
      await patchRow(row, { totalMembers: nextValue });
      return;
    }

    if (active.field === 'picName') {
      const next = trimmed || null;
      if (next === (row.picName ?? null)) return;
      await patchRow(row, { picName: next });
      return;
    }

    if (active.field === 'picContact') {
      const next = trimmed || null;
      if (next === (row.picContact ?? null)) return;
      await patchRow(row, { picContact: next });
      return;
    }

    if (active.field === 'notes') {
      const next = trimmed || null;
      if (next === (row.notes ?? null)) return;
      await patchRow(row, { notes: next });
    }
  }

  async function handleQuickAdd() {
    if (!canWrite) return;
    const name = quickDraft.name.trim();
    if (!name || creatingQuick) return;

    setCreatingQuick(true);
    setError('');
    try {
      const members = Number.parseInt(quickDraft.totalMembers.replace(/[^\d]/g, '') || '0', 10);
      const created = await api.post<MarketingPartnership>('/team/marketing/partnerships', {
        ...(projectId ? { projectId } : {}),
        name,
        category: quickDraft.category || 'Creator',
        platform: quickDraft.platform || 'X',
        totalMembers: Number.isFinite(members) && members >= 0 ? members : 0,
        picName: quickDraft.picName.trim() || null,
        picContact: quickDraft.picContact.trim() || null,
        broadcastStatus: quickDraft.broadcastStatus,
        followUpDate: quickDraft.followUpDate || null,
        notes: quickDraft.notes.trim() || null,
      });
      setAllRows((prev) => [...prev, created]);
      setQuickDraft((prev) => ({
        ...EMPTY_DRAFT,
        category: prev.category,
        platform: prev.platform,
      }));
      setNotice(`Added "${created.name}" to the partnership sheet.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not create target.';
      if (message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      setError(message);
    } finally {
      setCreatingQuick(false);
    }
  }

  async function handleArchiveRow(row: MarketingPartnership) {
    if (!canWrite) return;
    if (!window.confirm(`Remove "${row.name}" from the active partnership sheet?`)) return;
    setSavingRowId(row.id);
    setError('');
    try {
      await api.delete(`/team/marketing/partnerships/${encodeURIComponent(row.id)}`);
      setAllRows((prev) => prev.filter((item) => item.id !== row.id));
      setNotice(`Removed "${row.name}".`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not remove target.';
      if (message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      setError(message);
    } finally {
      setSavingRowId(null);
    }
  }

  function openAddModal() {
    setDetailTarget(null);
    setDetailError('');
    setDetailModalOpen(true);
  }

  function openEditModal(row: MarketingPartnership) {
    setDetailTarget(row);
    setDetailError('');
    setDetailModalOpen(true);
  }

  function openTaskModal(row: MarketingPartnership) {
    setTaskModalRow(row);
    setTaskAssigneeIds([]);
    setTaskError('');
  }

  async function handleSaveDetailModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    setDetailSaving(true);
    setDetailError('');

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const category = String(formData.get('category') ?? '').trim() || 'Creator';
    const platform = String(formData.get('platform') ?? '').trim() || 'X';
    const totalMembersRaw = String(formData.get('totalMembers') ?? '0').trim();
    const totalMembers = Math.max(0, Number.parseInt(totalMembersRaw || '0', 10) || 0);
    const picName = String(formData.get('picName') ?? '').trim() || null;
    const picContact = String(formData.get('picContact') ?? '').trim() || null;
    const broadcastStatus = String(formData.get('broadcastStatus') ?? 'NOT_STARTED') as BroadcastStatus;
    const followUpDate = String(formData.get('followUpDate') ?? '').trim() || null;
    const notes = String(formData.get('notes') ?? '').trim() || null;

    if (!name) {
      setDetailError('Community / Account Creator name is required.');
      setDetailSaving(false);
      return;
    }

    try {
      if (detailTarget) {
        const updated = await api.patch<MarketingPartnership>(
          `/team/marketing/partnerships/${encodeURIComponent(detailTarget.id)}`,
          {
            version: detailTarget.version,
            name,
            category,
            platform,
            totalMembers,
            picName,
            picContact,
            broadcastStatus,
            followUpDate,
            notes,
          },
        );
        setAllRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setNotice(`Updated "${updated.name}".`);
      } else {
        const created = await api.post<MarketingPartnership>('/team/marketing/partnerships', {
          ...(projectId ? { projectId } : {}),
          name,
          category,
          platform,
          totalMembers,
          picName,
          picContact,
          broadcastStatus,
          followUpDate,
          notes,
        });
        setAllRows((prev) => [...prev, created]);
        setNotice(`Added "${created.name}".`);
      }
      setDetailModalOpen(false);
      setDetailTarget(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save target.';
      if (message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      setDetailError(message);
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleImportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    if (parsedImportPreview.length === 0) {
      setImportError('Paste CSV/TSV rows or upload a CSV file with at least one valid target row.');
      return;
    }

    setImporting(true);
    setImportError('');
    try {
      const result = await api.post<{
        createdCount: number;
        skippedCount: number;
        items: MarketingPartnership[];
      }>('/team/marketing/partnerships/import', {
        ...(projectId ? { projectId } : {}),
        rows: parsedImportPreview,
      });

      if (result.items.length > 0) {
        setAllRows((prev) => [...prev, ...result.items]);
      }
      setNotice(
        `Imported ${result.createdCount} row(s)${result.skippedCount > 0 ? `, skipped ${result.skippedCount} duplicate/empty row(s)` : ''}.`,
      );
      setImportOpen(false);
      setImportRawText('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Import failed.';
      if (message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      setImportError(message);
    } finally {
      setImporting(false);
    }
  }

  async function handleCreateFollowUpTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || !taskModalRow) return;

    setTaskSaving(true);
    setTaskError('');
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const priority = String(formData.get('priority') ?? 'NORMAL') as TaskPriority;
    const dueAtRaw = String(formData.get('dueAt') ?? '').trim();

    if (title.length < 2) {
      setTaskError('Task title must be at least 2 characters.');
      setTaskSaving(false);
      return;
    }

    try {
      const result = await api.post<{ task: Task; partnership: MarketingPartnership }>(
        `/team/marketing/partnerships/${encodeURIComponent(taskModalRow.id)}/task`,
        {
          title,
          description: description || undefined,
          priority,
          dueAt: dueAtRaw ? dueAtRaw : null,
          assignedMemberIds: taskAssigneeIds,
        },
      );
      setAllRows((prev) => prev.map((item) => (item.id === result.partnership.id ? result.partnership : item)));
      setTaskModalRow(null);
      setTaskAssigneeIds([]);
      setNotice(`Created follow-up task "${result.task.title}".`);
      onTaskCreated?.();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not create follow-up task.';
      if (message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      setTaskError(message);
    } finally {
      setTaskSaving(false);
    }
  }

  function handleCsvFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportRawText(typeof reader.result === 'string' ? reader.result : '');
      setImportError('');
    };
    reader.readAsText(file);
  }

  function handleExportCsv() {
    const csv = buildPartnershipsCsv(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `jitu-partnerships-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const colCount = canWrite ? 12 : 11;

  return (
    <div className="marketing-sheet-wrapper">
      <div className="section-heading section-spacer task-section-heading">
        <div>
          <h2>Partnerships tracker</h2>
          <p>
            {canWrite
              ? 'Click any cell to edit inline, import/export CSV, or spawn a follow-up project task from any row.'
              : 'Read-only outreach tracker for this project.'}
          </p>
        </div>
        <div className="page-heading-actions">
          {canWrite && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setImportError('');
                setImportOpen(true);
              }}
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              Import CSV
            </button>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={handleExportCsv}
            disabled={filteredRows.length === 0}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </button>
          {canWrite && (
            <button type="button" className="button button-primary" onClick={openAddModal}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Target
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="inline-message error" role="alert">
          {error}
          <button type="button" className="button button-quiet" onClick={() => void load(true)}>
            Reload
          </button>
        </div>
      )}

      {notice && (
        <div className="inline-message success" role="status">
          {notice}
          <button
            type="button"
            className="icon-button"
            aria-label="Close notice"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI SUMMARY CARDS */}
      <section className="marketing-kpi-grid" aria-label="Partnership outreach metrics">
        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>TOTAL TARGET</span>
            <Target className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : numberFormatter.format(summary.totalTarget)}</strong>
          <small>Community &amp; School Groups</small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>TOTAL REACH</span>
            <Users className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : numberFormatter.format(summary.totalReach)}</strong>
          <small>Estimated Total Members</small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>BROADCAST PUBLISHED</span>
            <Send className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : numberFormatter.format(summary.broadcastPublished)}</strong>
          <small>Published Partnerships / Deals</small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>IN PROGRESS</span>
            <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : numberFormatter.format(summary.inProgress)}</strong>
          <small>Negotiating &amp; Awaiting Response</small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>SUCCESS RATE</span>
            <TrendingUp className="w-4 h-4 text-blue-500" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : `${summary.successRate}%`}</strong>
          <small>Deal to Target Ratio</small>
        </article>
      </section>

      {/* FILTER TOOLBAR */}
      <section className="marketing-toolbar" aria-label="Filter partnership targets">
        <div className="marketing-search-box">
          <Search className="marketing-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="field-input marketing-search-input"
            placeholder="Search creator, PIC, contact, or notes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search partnerships"
          />
        </div>

        <div className="marketing-filter-controls">
          <select
            className="filter-select"
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            aria-label="Filter by platform"
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value)}
          >
            <option value="">All Platforms</option>
            {platformOptions.map((plat) => (
              <option key={plat} value={plat}>
                {plat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            aria-label="Filter by broadcast status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>
            {BROADCAST_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            aria-label="Filter by follow-up schedule"
            value={followUpFilter}
            onChange={(event) =>
              setFollowUpFilter(
                event.target.value as 'all' | 'overdue' | 'today' | 'upcoming' | 'scheduled',
              )
            }
          >
            <option value="all">All Follow-ups</option>
            <option value="overdue">Overdue Follow-up</option>
            <option value="today">Due Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="scheduled">Has Follow-up Date</option>
          </select>

          {(search || categoryFilter || platformFilter || statusFilter || followUpFilter !== 'all') && (
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setPlatformFilter('');
                setStatusFilter('');
                setFollowUpFilter('all');
              }}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>

        <span className="section-count">
          {filteredRows.length} / {allRows.length} rows
          {savingRowId ? ' · Saving…' : ''}
        </span>
      </section>

      {/* SPREADSHEET-LIKE PARTNERSHIP TABLE */}
      <section className="marketing-sheet-card" aria-label="Community and Partnership Sheet">
        {loading ? (
          <div className="marketing-loading">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="loading-skeleton marketing-skeleton-row" />
            ))}
          </div>
        ) : (
          <Table className="marketing-table">
            <TableHeader>
              <TableRow>
                <TableHead className="marketing-col-no">No</TableHead>
                <TableHead className="marketing-col-name">Community / Account Creator</TableHead>
                <TableHead className="marketing-col-cat">Category</TableHead>
                <TableHead className="marketing-col-plat">Platform</TableHead>
                <TableHead className="marketing-col-members">Total Members</TableHead>
                <TableHead className="marketing-col-pic">PIC</TableHead>
                <TableHead className="marketing-col-contact">PIC Contact</TableHead>
                <TableHead className="marketing-col-status">Broadcast Status</TableHead>
                <TableHead className="marketing-col-date">Follow-up Date</TableHead>
                <TableHead className="marketing-col-notes">Notes &amp; Partnership Links</TableHead>
                <TableHead className="marketing-col-tasks">Linked Tasks</TableHead>
                {canWrite && <TableHead className="marketing-col-actions">Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRows.map((row, index) => {
                const statusMeta = BROADCAST_STATUS_MAP[row.broadcastStatus];
                const urgency = getFollowUpUrgency(row.followUpDate);
                const dateValue = row.followUpDate ? row.followUpDate.slice(0, 10) : '';
                const isEditingName = editingCell?.id === row.id && editingCell.field === 'name';
                const isEditingMembers =
                  editingCell?.id === row.id && editingCell.field === 'totalMembers';
                const isEditingPic = editingCell?.id === row.id && editingCell.field === 'picName';
                const isEditingContact =
                  editingCell?.id === row.id && editingCell.field === 'picContact';
                const isEditingNotes = editingCell?.id === row.id && editingCell.field === 'notes';
                const noteTokens = tokenizeNoteLinks(row.notes);
                const rowCategoryChoices = mergeOptions(categoryOptions, [row.category]);
                const rowPlatformChoices = mergeOptions(platformOptions, [row.platform]);
                const linkedTasks = row.tasks ?? [];

                return (
                  <TableRow
                    key={row.id}
                    className={savingRowId === row.id ? 'is-saving' : undefined}
                  >
                    <TableCell className="marketing-col-no marketing-cell-num">
                      {index + 1}
                    </TableCell>

                    <TableCell
                      className={`${canWrite ? 'marketing-editable-cell' : ''} marketing-col-name`}
                      onClick={() => {
                        if (canWrite && !isEditingName) startCellEdit(row, 'name');
                      }}
                    >
                      {isEditingName ? (
                        <input
                          type="text"
                          className="marketing-cell-input"
                          value={editingCell.value}
                          autoFocus
                          onChange={(e) =>
                            setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                          }
                          onBlur={() => void commitCellEdit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void commitCellEdit();
                            } else if (e.key === 'Escape') {
                              skipBlurCommitRef.current = true;
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="marketing-name-text" title={canWrite ? 'Click to edit' : undefined}>
                          {row.name}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="marketing-col-cat">
                      <select
                        className="marketing-inline-select"
                        aria-label={`Category for ${row.name}`}
                        value={row.category}
                        disabled={!canWrite}
                        onChange={(e) => {
                          if (e.target.value !== row.category) {
                            void patchRow(row, { category: e.target.value });
                          }
                        }}
                      >
                        {rowCategoryChoices.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell className="marketing-col-plat">
                      <select
                        className="marketing-inline-select is-platform"
                        aria-label={`Platform for ${row.name}`}
                        value={row.platform}
                        disabled={!canWrite}
                        onChange={(e) => {
                          if (e.target.value !== row.platform) {
                            void patchRow(row, { platform: e.target.value });
                          }
                        }}
                      >
                        {rowPlatformChoices.map((plat) => (
                          <option key={plat} value={plat}>
                            {plat}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell
                      className={`${canWrite ? 'marketing-editable-cell' : ''} marketing-col-members`}
                      onClick={() => {
                        if (canWrite && !isEditingMembers) startCellEdit(row, 'totalMembers');
                      }}
                    >
                      {isEditingMembers ? (
                        <input
                          type="number"
                          min={0}
                          className="marketing-cell-input is-number"
                          value={editingCell.value}
                          autoFocus
                          onChange={(e) =>
                            setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                          }
                          onBlur={() => void commitCellEdit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void commitCellEdit();
                            } else if (e.key === 'Escape') {
                              skipBlurCommitRef.current = true;
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="marketing-cell-number" title={canWrite ? 'Click to edit' : undefined}>
                          {numberFormatter.format(row.totalMembers)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell
                      className={`${canWrite ? 'marketing-editable-cell' : ''} marketing-col-pic`}
                      onClick={() => {
                        if (canWrite && !isEditingPic) startCellEdit(row, 'picName');
                      }}
                    >
                      {isEditingPic ? (
                        <input
                          type="text"
                          className="marketing-cell-input"
                          placeholder="External PIC"
                          value={editingCell.value}
                          autoFocus
                          onChange={(e) =>
                            setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                          }
                          onBlur={() => void commitCellEdit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void commitCellEdit();
                            } else if (e.key === 'Escape') {
                              skipBlurCommitRef.current = true;
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span className={row.picName ? 'marketing-cell-text' : 'marketing-cell-placeholder'}>
                          {row.picName || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell
                      className={`${canWrite ? 'marketing-editable-cell' : ''} marketing-col-contact`}
                      onClick={() => {
                        if (canWrite && !isEditingContact) startCellEdit(row, 'picContact');
                      }}
                    >
                      {isEditingContact ? (
                        <input
                          type="text"
                          className="marketing-cell-input"
                          placeholder="WA / Email / DM"
                          value={editingCell.value}
                          autoFocus
                          onChange={(e) =>
                            setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                          }
                          onBlur={() => void commitCellEdit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void commitCellEdit();
                            } else if (e.key === 'Escape') {
                              skipBlurCommitRef.current = true;
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span className={row.picContact ? 'marketing-cell-text' : 'marketing-cell-placeholder'}>
                          {row.picContact || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="marketing-col-status">
                      <select
                        className={`marketing-status-select ${statusMeta.toneClass}`}
                        aria-label={`Broadcast status for ${row.name}`}
                        value={row.broadcastStatus}
                        disabled={!canWrite}
                        onChange={(e) => {
                          const nextStatus = e.target.value as BroadcastStatus;
                          if (nextStatus !== row.broadcastStatus) {
                            void patchRow(row, { broadcastStatus: nextStatus });
                          }
                        }}
                      >
                        {BROADCAST_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell className="marketing-col-date">
                      <input
                        type="date"
                        className={`marketing-date-input ${
                          urgency === 'overdue' && row.broadcastStatus !== 'PUBLISHED' && row.broadcastStatus !== 'DECLINED'
                            ? 'is-overdue'
                            : urgency === 'today'
                              ? 'is-today'
                              : ''
                        }`}
                        aria-label={`Follow-up date for ${row.name}`}
                        value={dateValue}
                        disabled={!canWrite}
                        onChange={(e) => {
                          const nextDate = e.target.value ? e.target.value : null;
                          if ((nextDate ?? '') !== dateValue) {
                            void patchRow(row, { followUpDate: nextDate });
                          }
                        }}
                      />
                    </TableCell>

                    <TableCell
                      className={`${canWrite ? 'marketing-editable-cell' : ''} marketing-col-notes`}
                      onClick={() => {
                        if (canWrite && !isEditingNotes) startCellEdit(row, 'notes');
                      }}
                    >
                      {isEditingNotes ? (
                        <input
                          type="text"
                          className="marketing-cell-input"
                          placeholder="Add notes or partnership URL..."
                          value={editingCell.value}
                          autoFocus
                          onChange={(e) =>
                            setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                          }
                          onBlur={() => void commitCellEdit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void commitCellEdit();
                            } else if (e.key === 'Escape') {
                              skipBlurCommitRef.current = true;
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : noteTokens.length > 0 ? (
                        <div className="marketing-notes-preview">
                          {noteTokens.map((token, idx) =>
                            token.type === 'url' ? (
                              <a
                                key={`${token.value}-${idx}`}
                                href={token.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="marketing-note-link"
                                onClick={(e) => e.stopPropagation()}
                                title={token.value}
                              >
                                <span>{token.value}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                              </a>
                            ) : (
                              <span key={`txt-${idx}`} className="marketing-note-text">
                                {token.value}
                              </span>
                            ),
                          )}
                        </div>
                      ) : (
                        <span className="marketing-cell-placeholder">{canWrite ? 'Add notes or link…' : '—'}</span>
                      )}
                    </TableCell>

                    {/* Linked Project / Follow-up Tasks */}
                    <TableCell className="marketing-col-tasks">
                      <div className="marketing-tasks-cell">
                        {linkedTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            className={`marketing-task-chip status-${task.status}`}
                            title={`${task.title} (${TASK_STATUS_LABEL[task.status] ?? task.status})`}
                            onClick={() => onOpenTask?.(task.id)}
                          >
                            <CheckSquare className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{TASK_STATUS_LABEL[task.status] ?? task.status}</span>
                          </button>
                        ))}
                        {canWrite && (
                          <button
                            type="button"
                            className="marketing-task-add-btn"
                            title={`Create follow-up task for ${row.name}`}
                            onClick={() => openTaskModal(row)}
                          >
                            + Task
                          </button>
                        )}
                        {!canWrite && linkedTasks.length === 0 && (
                          <span className="marketing-cell-placeholder">—</span>
                        )}
                      </div>
                    </TableCell>

                    {canWrite && (
                      <TableCell className="marketing-col-actions">
                        <div className="marketing-row-actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit details"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => openEditModal(row)}
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-button danger-action"
                            title="Remove row"
                            aria-label={`Remove ${row.name}`}
                            onClick={() => void handleArchiveRow(row)}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}

              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colCount} className="marketing-empty-row">
                    No partnership targets match the current filters.
                  </TableCell>
                </TableRow>
              )}

              {/* QUICK-ADD SPREADSHEET ROW */}
              {canWrite && (
                <TableRow className="marketing-quick-add-row">
                  <TableCell className="marketing-col-no marketing-cell-num">
                    <Plus className="w-3.5 h-3.5 inline-block" aria-hidden="true" />
                  </TableCell>
                  <TableCell className="marketing-col-name">
                    <input
                      type="text"
                      className="marketing-cell-input"
                      placeholder="Add community / creator & press Enter…"
                      aria-label="New community or account creator"
                      value={quickDraft.name}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleQuickAdd();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="marketing-col-cat">
                    <select
                      className="marketing-inline-select"
                      aria-label="New row category"
                      value={quickDraft.category}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="marketing-col-plat">
                    <select
                      className="marketing-inline-select is-platform"
                      aria-label="New row platform"
                      value={quickDraft.platform}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, platform: e.target.value }))}
                    >
                      {platformOptions.map((plat) => (
                        <option key={plat} value={plat}>
                          {plat}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="marketing-col-members">
                    <input
                      type="number"
                      min={0}
                      className="marketing-cell-input is-number"
                      placeholder="0"
                      aria-label="New row total members"
                      value={quickDraft.totalMembers}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, totalMembers: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleQuickAdd();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="marketing-col-pic">
                    <input
                      type="text"
                      className="marketing-cell-input"
                      placeholder="External PIC"
                      aria-label="New row PIC"
                      value={quickDraft.picName}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, picName: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleQuickAdd();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="marketing-col-contact">
                    <input
                      type="text"
                      className="marketing-cell-input"
                      placeholder="PIC Contact"
                      aria-label="New row PIC Contact"
                      value={quickDraft.picContact}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, picContact: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleQuickAdd();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="marketing-col-status">
                    <select
                      className={`marketing-status-select ${BROADCAST_STATUS_MAP[quickDraft.broadcastStatus].toneClass}`}
                      aria-label="New row broadcast status"
                      value={quickDraft.broadcastStatus}
                      disabled={creatingQuick}
                      onChange={(e) =>
                        setQuickDraft((prev) => ({
                          ...prev,
                          broadcastStatus: e.target.value as BroadcastStatus,
                        }))
                      }
                    >
                      {BROADCAST_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="marketing-col-date">
                    <input
                      type="date"
                      className="marketing-date-input"
                      aria-label="New row follow-up date"
                      value={quickDraft.followUpDate}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell className="marketing-col-notes">
                    <input
                      type="text"
                      className="marketing-cell-input"
                      placeholder="Notes or https://..."
                      aria-label="New row notes or partnership links"
                      value={quickDraft.notes}
                      disabled={creatingQuick}
                      onChange={(e) => setQuickDraft((prev) => ({ ...prev, notes: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleQuickAdd();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="marketing-col-tasks">
                    <span className="marketing-cell-placeholder">—</span>
                  </TableCell>
                  <TableCell className="marketing-col-actions">
                    <button
                      type="button"
                      className="button button-primary marketing-quick-add-btn"
                      disabled={!quickDraft.name.trim() || creatingQuick}
                      onClick={() => void handleQuickAdd()}
                    >
                      {creatingQuick ? 'Adding…' : 'Add'}
                    </button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </section>

      {/* ADD / EDIT DETAIL MODAL */}
      {detailModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailModalOpen(false);
              setDetailTarget(null);
            }
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="partnership-modal-title">
            <div className="modal-header">
              <div>
                <h2 id="partnership-modal-title">
                  {detailTarget ? `Edit ${detailTarget.name}` : 'Add Partnership Target'}
                </h2>
                <p>
                  {detailTarget
                    ? 'Update partner details, external PIC info, status, or multi-line notes.'
                    : 'Add a new creator, community, or school group to track.'}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailTarget(null);
                }}
              >
                ×
              </button>
            </div>

            <form className="form-stack" onSubmit={handleSaveDetailModal}>
              {detailError && (
                <p className="form-error" role="alert">
                  {detailError}
                </p>
              )}

              <label className="field-label">
                Community / Account Creator
                <input
                  className="field-input"
                  name="name"
                  key={`name-${detailTarget?.id ?? 'new'}`}
                  defaultValue={detailTarget?.name ?? ''}
                  placeholder="e.g. studyarchive27 or Info UTBK Group"
                  required
                  autoFocus
                />
              </label>

              <div className="marketing-modal-grid">
                <label className="field-label">
                  Category
                  <input
                    className="field-input"
                    name="category"
                    list="marketing-category-suggestions"
                    key={`cat-${detailTarget?.id ?? 'new'}`}
                    defaultValue={detailTarget?.category ?? 'Creator'}
                    placeholder="Creator / Community / School Group"
                  />
                  <datalist id="marketing-category-suggestions">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </label>

                <label className="field-label">
                  Platform
                  <input
                    className="field-input"
                    name="platform"
                    list="marketing-platform-suggestions"
                    key={`plat-${detailTarget?.id ?? 'new'}`}
                    defaultValue={detailTarget?.platform ?? 'X'}
                    placeholder="X / Instagram / TikTok / WhatsApp"
                  />
                  <datalist id="marketing-platform-suggestions">
                    {platformOptions.map((plat) => (
                      <option key={plat} value={plat} />
                    ))}
                  </datalist>
                </label>

                <label className="field-label">
                  Total Members
                  <input
                    type="number"
                    min={0}
                    className="field-input"
                    name="totalMembers"
                    key={`members-${detailTarget?.id ?? 'new'}`}
                    defaultValue={detailTarget?.totalMembers ?? 0}
                  />
                </label>

                <label className="field-label">
                  Broadcast Status
                  <select
                    className="field-input"
                    name="broadcastStatus"
                    key={`status-${detailTarget?.id ?? 'new'}`}
                    defaultValue={detailTarget?.broadcastStatus ?? 'NOT_STARTED'}
                  >
                    {BROADCAST_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  PIC <span className="subtle-link">External</span>
                  <input
                    className="field-input"
                    name="picName"
                    key={`pic-${detailTarget?.id ?? 'new'}`}
                    defaultValue={detailTarget?.picName ?? ''}
                    placeholder="Partner contact person name"
                  />
                </label>

                <label className="field-label">
                  PIC Contact
                  <input
                    className="field-input"
                    name="picContact"
                    key={`contact-${detailTarget?.id ?? 'new'}`}
                    defaultValue={detailTarget?.picContact ?? ''}
                    placeholder="WA number, @handle, or email"
                  />
                </label>
              </div>

              <label className="field-label">
                Follow-up Date <span className="subtle-link">Optional</span>
                <input
                  type="date"
                  className="field-input"
                  name="followUpDate"
                  key={`date-${detailTarget?.id ?? 'new'}`}
                  defaultValue={detailTarget?.followUpDate ? detailTarget.followUpDate.slice(0, 10) : ''}
                />
              </label>

              <label className="field-label">
                Notes &amp; Partnership Links <span className="subtle-link">Optional</span>
                <textarea
                  className="field-textarea"
                  name="notes"
                  key={`notes-${detailTarget?.id ?? 'new'}`}
                  defaultValue={detailTarget?.notes ?? ''}
                  placeholder="Profile links, broadcast URLs, rate card, or negotiation notes..."
                />
              </label>

              <div className="form-footer form-footer-between">
                {detailTarget ? (
                  <span className="subtle-link">
                    Updated{' '}
                    {new Date(detailTarget.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {detailTarget.updatedBy ? ` by ${detailTarget.updatedBy.name}` : ''}
                  </span>
                ) : (
                  <span />
                )}
                <div className="form-footer">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setDetailModalOpen(false);
                      setDetailTarget(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button button-primary" disabled={detailSaving}>
                    {detailSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* CREATE FOLLOW-UP TASK MODAL */}
      {taskModalRow && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTaskModalRow(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="partnership-task-modal-title">
            <div className="modal-header">
              <div>
                <h2 id="partnership-task-modal-title">Create follow-up task</h2>
                <p>
                  Create a linked task in this project&apos;s Board/List for{' '}
                  <strong>{taskModalRow.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setTaskModalRow(null)}
              >
                ×
              </button>
            </div>

            <form className="form-stack" onSubmit={handleCreateFollowUpTask}>
              {taskError && (
                <p className="form-error" role="alert">
                  {taskError}
                </p>
              )}

              <label className="field-label">
                Task title
                <input
                  className="field-input"
                  name="title"
                  key={`ptask-title-${taskModalRow.id}`}
                  defaultValue={`Follow up: ${taskModalRow.name}`}
                  minLength={2}
                  maxLength={180}
                  required
                  autoFocus
                />
              </label>

              <label className="field-label">
                Description <span className="subtle-link">Optional</span>
                <textarea
                  className="field-textarea"
                  name="description"
                  key={`ptask-desc-${taskModalRow.id}`}
                  defaultValue={[
                    `Target: ${taskModalRow.name} (${taskModalRow.category} · ${taskModalRow.platform})`,
                    taskModalRow.picName || taskModalRow.picContact
                      ? `PIC: ${taskModalRow.picName || '-'}${taskModalRow.picContact ? ` (${taskModalRow.picContact})` : ''}`
                      : null,
                    taskModalRow.notes ? `Notes: ${taskModalRow.notes}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                  maxLength={10000}
                />
              </label>

              <div className="detail-meta">
                <label className="field-label">
                  Priority
                  <select className="filter-select" name="priority" defaultValue="NORMAL">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>
                <label className="field-label">
                  Due date
                  <input
                    className="field-input"
                    name="dueAt"
                    type="date"
                    key={`ptask-due-${taskModalRow.id}`}
                    defaultValue={taskModalRow.followUpDate ? taskModalRow.followUpDate.slice(0, 10) : ''}
                  />
                </label>
              </div>

              {projectMembers.length > 0 && (
                <div className="field-label">
                  <span>Assignees</span>
                  <div className="assignee-picker">
                    {projectMembers.map(({ teamMember }) => {
                      const checked = taskAssigneeIds.includes(teamMember.id);
                      return (
                        <label
                          key={teamMember.id}
                          className={`assignee-option ${checked ? 'is-selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setTaskAssigneeIds((prev) =>
                                e.target.checked
                                  ? [...prev, teamMember.id]
                                  : prev.filter((id) => id !== teamMember.id),
                              );
                            }}
                          />
                          <span>{teamMember.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setTaskModalRow(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={taskSaving}>
                  {taskSaving ? 'Creating…' : 'Create follow-up task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* IMPORT CSV / PASTE SHEET MODAL */}
      {importOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setImportOpen(false);
          }}
        >
          <section className="modal marketing-import-modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
            <div className="modal-header">
              <div>
                <h2 id="import-modal-title">Import from Google Sheets / CSV</h2>
                <p>
                  Paste rows directly from Google Sheets (CSV or tab-separated) or upload a `.csv` file. KPI summary rows and duplicates are skipped automatically.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setImportOpen(false)}
              >
                ×
              </button>
            </div>

            <form className="form-stack" onSubmit={handleImportSubmit}>
              {importError && (
                <p className="form-error" role="alert">
                  {importError}
                </p>
              )}

              <label className="field-label">
                Upload CSV File <span className="subtle-link">Optional</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="field-input"
                  onChange={handleCsvFileUpload}
                />
              </label>

              <label className="field-label">
                Paste Sheet Data
                <textarea
                  className="field-textarea marketing-import-textarea"
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`No,Community / Account Creator,Category,Platform,Total Members,PIC,PIC Contact,Broadcast Status,Follow-up Date,Notes & Partnership Links\n1,studyarchive27,Creator,X,12000,Rina,@rina,Contacted,2026-11-15,https://x.com/studyarchive27`}
                  rows={7}
                />
              </label>

              {parsedImportPreview.length > 0 && (
                <div className="marketing-import-preview">
                  <div className="marketing-import-preview-head">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    <span>{parsedImportPreview.length} target row(s) detected</span>
                  </div>
                  <ul>
                    {parsedImportPreview.slice(0, 5).map((item, idx) => (
                      <li key={`${item.name}-${idx}`}>
                        <strong>{item.name}</strong> · {item.category} · {item.platform} ·{' '}
                        {numberFormatter.format(item.totalMembers)} members
                      </li>
                    ))}
                    {parsedImportPreview.length > 5 && (
                      <li className="subtle-link">
                        +{parsedImportPreview.length - 5} more row(s)…
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="form-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setImportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={importing || parsedImportPreview.length === 0}
                >
                  {importing ? 'Importing…' : `Import ${parsedImportPreview.length || ''} Row(s)`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
