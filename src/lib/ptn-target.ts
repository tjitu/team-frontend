export interface PtnTargetChoice {
  choice: number;
  university: string;
  acronym?: string;
  program?: string;
}

export interface PtnTargetSummary {
  choices: PtnTargetChoice[];
  unreadable: boolean;
}

type TargetRecord = Record<string, unknown>;

function getText(record: TargetRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function toChoice(value: unknown, choice: number): PtnTargetChoice | null {
  if (typeof value === 'string' && value.trim()) {
    return { choice, university: value.trim() };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as TargetRecord;
  const university = getText(record, 'university', 'name', 'univ', 'campus');
  const acronym = getText(record, 'acronym', 'abbreviation');
  const program = getText(
    record,
    'jurusan',
    'programStudy',
    'program_study',
    'prodi',
    'major',
  );

  if (!university && !program) return null;
  return {
    choice,
    university: university || acronym || 'Universitas tidak tercatat',
    acronym: acronym && acronym.toLocaleLowerCase('id-ID') !== university?.toLocaleLowerCase('id-ID')
      ? acronym
      : undefined,
    program,
  };
}

export function summarizePtnTarget(raw?: string | null): PtnTargetSummary {
  const value = raw?.trim();
  if (!value) return { choices: [], unreadable: false };

  let parsed: unknown = value;
  if (value.startsWith('{') || value.startsWith('[') || value.startsWith('"')) {
    try {
      parsed = JSON.parse(value);
      if (typeof parsed === 'string') {
        const nested = parsed.trim();
        if (nested.startsWith('{') || nested.startsWith('[')) parsed = JSON.parse(nested);
        else return { choices: [{ choice: 1, university: nested }], unreadable: false };
      }
    } catch {
      return { choices: [], unreadable: true };
    }
  } else {
    return { choices: [{ choice: 1, university: value }], unreadable: false };
  }

  if (Array.isArray(parsed)) {
    return {
      choices: parsed
        .map((entry, index) => toChoice(entry, index + 1))
        .filter((entry): entry is PtnTargetChoice => entry !== null),
      unreadable: false,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { choices: [], unreadable: false };
  }

  const record = parsed as TargetRecord;
  const slots = ['p1', 'p2', 'p3'];
  const hasSlots = slots.some((slot) => slot in record);
  const values = hasSlots ? slots.map((slot) => record[slot]) : [record];
  const choices = values
    .map((entry, index) => toChoice(entry, hasSlots ? index + 1 : 1))
    .filter((entry): entry is PtnTargetChoice => entry !== null);

  return { choices, unreadable: false };
}
