import { useMemo, useSyncExternalStore } from 'react';
import type { PromptPlan } from './question-prompt-chunks';

function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener('question-plan-change', notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('question-plan-change', notify);
  };
}

export function useQuestionPlan(scope: string): PromptPlan | null {
  const raw = useSyncExternalStore(subscribe,
    () => localStorage.getItem('team-question-chunks:' + scope), () => null);
  return useMemo(() => raw ? JSON.parse(raw) : null, [raw]);
}
