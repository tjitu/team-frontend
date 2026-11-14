'use client';

import React from 'react';

export type AutoBalanceTargetConfig = {
  isianPercentage: number; // 0 - 40 (%)
  difficulty: {
    easy: number; // (%)
    medium: number; // (%)
    hard: number; // (%)
  };
  subtestScope?: string; // 'AUTO' atau key subtes spesifik
};

export const DEFAULT_AUTOBALANCE_CONFIG: AutoBalanceTargetConfig = {
  isianPercentage: 15,
  difficulty: {
    easy: 30,
    medium: 50,
    hard: 20,
  },
  subtestScope: 'AUTO',
};

export const DIFFICULTY_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  ratio: { easy: number; medium: number; hard: number };
}> = [
  {
    id: 'SNBT_STANDARD',
    label: 'Standar SNBT (30/50/20)',
    description: '30% Easy · 50% Medium · 20% Hard (Format resmi seleksi)',
    ratio: { easy: 30, medium: 50, hard: 20 },
  },
  {
    id: 'HOTS_HEAVY',
    label: 'Fokus HOTS (15/45/40)',
    description: '15% Easy · 45% Medium · 40% Hard (Latihan intensif & tryout sulit)',
    ratio: { easy: 15, medium: 45, hard: 40 },
  },
  {
    id: 'FOUNDATION',
    label: 'Foundation / Dasar (50/35/15)',
    description: '50% Easy · 35% Medium · 15% Hard (Pemanasan konsep)',
    ratio: { easy: 50, medium: 35, hard: 15 },
  },
  {
    id: 'BALANCED',
    label: 'Rata (34/33/33)',
    description: 'Proporsi seimbang di semua tingkat kesulitan',
    ratio: { easy: 34, medium: 33, hard: 33 },
  },
];

export const ISIAN_PRESETS: Array<{
  label: string;
  value: number;
  hint: string;
}> = [
  { label: '0% (Semua PG)', value: 0, hint: '100% Pilihan Ganda A-E' },
  { label: '10%', value: 10, hint: '2 butir per 20 soal' },
  { label: '15% (Rekomendasi)', value: 15, hint: 'Standar SNBT seimbang' },
  { label: '20%', value: 20, hint: '4 butir per 20 soal' },
  { label: '25%', value: 25, hint: 'Intensif Isian' },
];

const STORAGE_PREFIX = 'jitu_autobalance_cfg_';

export function normalizeScopeKey(scope: string): string {
  const cleaned = (scope || 'PRACTICE').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  return cleaned || 'PRACTICE';
}

export function getAutoBalanceConfig(scope: string): AutoBalanceTargetConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_AUTOBALANCE_CONFIG };
  }
  try {
    const key = `${STORAGE_PREFIX}${normalizeScopeKey(scope)}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_AUTOBALANCE_CONFIG };
    const parsed = JSON.parse(raw);
    const isian = typeof parsed?.isianPercentage === 'number'
      ? Math.max(0, Math.min(50, Math.round(parsed.isianPercentage)))
      : DEFAULT_AUTOBALANCE_CONFIG.isianPercentage;

    const easy = Number(parsed?.difficulty?.easy ?? DEFAULT_AUTOBALANCE_CONFIG.difficulty.easy);
    const med = Number(parsed?.difficulty?.medium ?? DEFAULT_AUTOBALANCE_CONFIG.difficulty.medium);
    const hard = Number(parsed?.difficulty?.hard ?? DEFAULT_AUTOBALANCE_CONFIG.difficulty.hard);
    const total = easy + med + hard;

    return {
      isianPercentage: isian,
      difficulty: total > 0
        ? {
            easy: Math.round((easy / total) * 100),
            medium: Math.round((med / total) * 100),
            hard: Math.max(0, 100 - Math.round((easy / total) * 100) - Math.round((med / total) * 100)),
          }
        : { ...DEFAULT_AUTOBALANCE_CONFIG.difficulty },
      subtestScope: parsed?.subtestScope || 'AUTO',
    };
  } catch {
    return { ...DEFAULT_AUTOBALANCE_CONFIG };
  }
}

export function saveAutoBalanceConfig(scope: string, config: AutoBalanceTargetConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${normalizeScopeKey(scope)}`;
    window.localStorage.setItem(key, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent('autobalance-config-changed', {
        detail: { scope: normalizeScopeKey(scope), config },
      }),
    );
  } catch {
    // ignore local storage quota / private mode errors
  }
}

export function useAutoBalanceConfig(scope: string): {
  config: AutoBalanceTargetConfig;
  setConfig: (next: AutoBalanceTargetConfig) => void;
  saveConfig: (next: AutoBalanceTargetConfig) => void;
} {
  const normScope = React.useMemo(() => normalizeScopeKey(scope), [scope]);
  const [config, setConfigState] = React.useState<AutoBalanceTargetConfig>(() => getAutoBalanceConfig(normScope));

  React.useEffect(() => {
    setConfigState(getAutoBalanceConfig(normScope));
  }, [normScope]);

  React.useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === `${STORAGE_PREFIX}${normScope}`) {
        setConfigState(getAutoBalanceConfig(normScope));
      }
    }
    function handleCustom(e: Event) {
      const custom = e as CustomEvent<{ scope: string; config: AutoBalanceTargetConfig }>;
      if (custom.detail?.scope === normScope && custom.detail?.config) {
        setConfigState(custom.detail.config);
      }
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('autobalance-config-changed', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('autobalance-config-changed', handleCustom);
    };
  }, [normScope]);

  const saveConfig = React.useCallback(
    (next: AutoBalanceTargetConfig) => {
      saveAutoBalanceConfig(normScope, next);
      setConfigState(next);
    },
    [normScope],
  );

  return {
    config,
    setConfig: setConfigState,
    saveConfig,
  };
}
