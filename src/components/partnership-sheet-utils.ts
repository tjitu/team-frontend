import type { BroadcastStatus, MarketingPartnership } from '@/lib/api';

export const CATEGORY_PRESETS = ['Creator', 'Community', 'School Group', 'Media', 'Other'];
export const PLATFORM_PRESETS = ['X', 'Instagram', 'TikTok', 'WhatsApp', 'Telegram', 'Discord', 'LINE', 'YouTube', 'Other'];

export const BROADCAST_STATUS_OPTIONS: Array<{
  value: BroadcastStatus;
  label: string;
  toneClass: string;
}> = [
  { value: 'NOT_STARTED', label: 'Not Started', toneClass: 'is-neutral' },
  { value: 'CONTACTED', label: 'Contacted', toneClass: 'is-sky' },
  { value: 'NEGOTIATING', label: 'Negotiating', toneClass: 'is-amber' },
  { value: 'AWAITING_RESPONSE', label: 'Awaiting Response', toneClass: 'is-purple' },
  { value: 'PUBLISHED', label: 'Published', toneClass: 'is-emerald' },
  { value: 'DECLINED', label: 'Declined', toneClass: 'is-rose' },
];

export const BROADCAST_STATUS_MAP: Record<BroadcastStatus, { label: string; toneClass: string }> =
  Object.fromEntries(
    BROADCAST_STATUS_OPTIONS.map((item) => [item.value, { label: item.label, toneClass: item.toneClass }]),
  ) as Record<BroadcastStatus, { label: string; toneClass: string }>;

export type ParsedImportRow = {
  name: string;
  category: string;
  platform: string;
  totalMembers: number;
  picName: string | null;
  picContact: string | null;
  broadcastStatus: BroadcastStatus;
  followUpDate: string | null;
  notes: string | null;
};

/** Split a delimited line (CSV or TSV) respecting double-quoted cells. */
function splitDelimitedLine(line: string, delimiter: ',' | '\t'): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((cell) => cell.trim());
  }
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeStatusInput(raw: string): BroadcastStatus {
  const value = raw.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (!value) return 'NOT_STARTED';
  if (value.includes('publish') || value === 'done' || value === 'deal' || value === 'live') return 'PUBLISHED';
  if (value.includes('negoti')) return 'NEGOTIATING';
  if (value.includes('await') || value.includes('wait') || value.includes('pending')) return 'AWAITING_RESPONSE';
  if (value.includes('contact') || value.includes('dm') || value.includes('sent') || value.includes('reach')) return 'CONTACTED';
  if (value.includes('declin') || value.includes('reject') || value.includes('cancel') || value.includes('batal')) return 'DECLINED';
  return 'NOT_STARTED';
}

function parseTotalMembers(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parseDateInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function scoreHeaderRow(row: string[]): number {
  const cells = row.map((cell) => cell.trim().toLowerCase());
  let score = 0;
  if (cells.some((c) => c === 'no' || c === '#')) score += 1;
  if (cells.some((c) => c.includes('account creator') || c === 'community / account creator' || c === 'partner' || c === 'name')) score += 2;
  if (cells.some((c) => c === 'category' || c === 'kategori')) score += 2;
  if (cells.some((c) => c === 'platform')) score += 2;
  if (cells.some((c) => c === 'total members' || c === 'members' || c === 'followers')) score += 2;
  if (cells.some((c) => c === 'pic' || c === 'pic name')) score += 1;
  if (cells.some((c) => c === 'pic contact' || c === 'contact')) score += 1;
  if (cells.some((c) => c === 'broadcast status' || c === 'status')) score += 2;
  if (cells.some((c) => c.includes('follow-up') || c.includes('follow up'))) score += 1;
  if (cells.some((c) => c.includes('notes') || c.includes('partnership links'))) score += 1;
  return score;
}

/**
 * Parse raw CSV or TSV text pasted from Google Sheets.
 * Automatically skips leading KPI rows before the main table header and blank numbered rows.
 */
export function parsePartnershipImportText(rawText: string): ParsedImportRow[] {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const delimiter: ',' | '\t' = lines.some((line) => line.includes('\t')) ? '\t' : ',';
  const grid = lines.map((line) => splitDelimitedLine(line, delimiter));

  let headerIndex = -1;
  let bestHeaderScore = 0;
  for (let i = 0; i < Math.min(grid.length, 25); i += 1) {
    const score = scoreHeaderRow(grid[i]);
    if (score >= 4 && score > bestHeaderScore) {
      bestHeaderScore = score;
      headerIndex = i;
    }
  }

  let cols = {
    name: 1,
    category: 2,
    platform: 3,
    totalMembers: 4,
    picName: 5,
    picContact: 6,
    broadcastStatus: 7,
    followUpDate: 8,
    notes: 9,
  };

  let startRow = 0;
  if (headerIndex >= 0) {
    const header = grid[headerIndex].map((cell) => cell.toLowerCase());
    const findCol = (matchers: string[], fallback: number) => {
      const idx = header.findIndex((cell) => matchers.some((m) => cell.includes(m)));
      return idx >= 0 ? idx : fallback;
    };
    cols = {
      name: findCol(['community', 'account creator', 'creator', 'partner', 'name'], 1),
      category: findCol(['category', 'kategori'], 2),
      platform: findCol(['platform'], 3),
      totalMembers: findCol(['total members', 'members', 'reach', 'followers'], 4),
      picName: header.findIndex((cell) => cell === 'pic' || cell === 'pic name'),
      picContact: findCol(['pic contact', 'contact', 'kontak'], 6),
      broadcastStatus: findCol(['broadcast status', 'status'], 7),
      followUpDate: findCol(['follow-up', 'follow up', 'followup', 'date'], 8),
      notes: findCol(['notes', 'link'], 9),
    };
    if (cols.picName < 0) cols.picName = 5;
    startRow = headerIndex + 1;
  } else {
    const firstIsNumber = /^\d+$/.test(grid[0]?.[0] ?? '');
    if (!firstIsNumber) {
      cols = {
        name: 0,
        category: 1,
        platform: 2,
        totalMembers: 3,
        picName: 4,
        picContact: 5,
        broadcastStatus: 6,
        followUpDate: 7,
        notes: 8,
      };
    }
  }

  const rows: ParsedImportRow[] = [];
  for (let i = startRow; i < grid.length; i += 1) {
    const row = grid[i];
    const name = (row[cols.name] ?? '').trim();
    if (!name) continue;

    rows.push({
      name,
      category: (row[cols.category] ?? '').trim() || 'Creator',
      platform: (row[cols.platform] ?? '').trim() || 'X',
      totalMembers: parseTotalMembers(row[cols.totalMembers] ?? ''),
      picName: (row[cols.picName] ?? '').trim() || null,
      picContact: (row[cols.picContact] ?? '').trim() || null,
      broadcastStatus: normalizeStatusInput(row[cols.broadcastStatus] ?? ''),
      followUpDate: parseDateInput(row[cols.followUpDate] ?? ''),
      notes: (row[cols.notes] ?? '').trim() || null,
    });
  }

  return rows;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildPartnershipsCsv(items: MarketingPartnership[]): string {
  const header = [
    'No',
    'Community / Account Creator',
    'Category',
    'Platform',
    'Total Members',
    'PIC',
    'PIC Contact',
    'Broadcast Status',
    'Follow-up Date',
    'Notes & Partnership Links',
  ];

  const lines = [header.map(escapeCsvCell).join(',')];
  items.forEach((item, index) => {
    lines.push(
      [
        index + 1,
        item.name,
        item.category,
        item.platform,
        item.totalMembers,
        item.picName ?? '',
        item.picContact ?? '',
        BROADCAST_STATUS_MAP[item.broadcastStatus]?.label ?? item.broadcastStatus,
        item.followUpDate ? item.followUpDate.slice(0, 10) : '',
        item.notes ?? '',
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  });

  return lines.join('\r\n');
}

export type NoteToken =
  | { type: 'text'; value: string }
  | { type: 'url'; value: string };

/** Break a notes string into text segments and safe http(s) links for rendering. */
export function tokenizeNoteLinks(notes: string | null): NoteToken[] {
  if (!notes) return [];
  const pattern = /(https?:\/\/[^\s]+)/gi;
  const tokens: NoteToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(notes)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: notes.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'url', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < notes.length) {
    tokens.push({ type: 'text', value: notes.slice(lastIndex) });
  }
  return tokens;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFollowUpUrgency(isoDate: string | null): 'overdue' | 'today' | 'upcoming' | null {
  if (!isoDate) return null;
  const dateKey = isoDate.slice(0, 10);
  const todayKey = localDateKey();
  if (dateKey < todayKey) return 'overdue';
  if (dateKey === todayKey) return 'today';
  return 'upcoming';
}
