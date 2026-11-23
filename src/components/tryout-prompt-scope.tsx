import { OFFICIAL_SNBT_SUBTEST_SPEC } from './question-lifecycle-types';

export type TryoutPromptScope = 'CUSTOM' | 'FULL' | 'SUBTEST';

export function tryoutPromptSubtests(mode: TryoutPromptScope, selected: string) {
  if (mode === 'CUSTOM') return undefined;
  return OFFICIAL_SNBT_SUBTEST_SPEC
    .filter(spec => mode === 'FULL' || spec.value === selected)
    .flatMap(spec => Array<string>(spec.fullQuestionTarget).fill(spec.value));
}

interface Props {
  mode: TryoutPromptScope;
  selected: string;
  onChange: (mode: TryoutPromptScope, selected: string) => void;
}

export function TryoutPromptScopeField({ mode, selected, onChange }: Props) {
  const total = OFFICIAL_SNBT_SUBTEST_SPEC.reduce((sum, spec) => sum + spec.fullQuestionTarget, 0);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label>Cakupan pembuatan soal
        <select className="field-input" value={mode}
          onChange={event => onChange(event.target.value as TryoutPromptScope, selected)}>
          <option value="CUSTOM">Jumlah khusus</option>
          <option value="FULL">1 tryout lengkap · {total} soal</option>
          <option value="SUBTEST">1 subtes</option>
        </select>
      </label>
      {mode === 'SUBTEST' && <label>Subtes
        <select className="field-input" value={selected} onChange={event => onChange(mode, event.target.value)}>
          {OFFICIAL_SNBT_SUBTEST_SPEC.map(spec => <option key={spec.value} value={spec.value}>
            {spec.code} · {spec.label} · {spec.fullQuestionTarget} soal
          </option>)}
        </select>
      </label>}
    </div>
  );
}
