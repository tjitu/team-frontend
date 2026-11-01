'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { clearSessionCache, api } from '@/lib/api';
import { useEffect } from 'react';

/** 12 hours in milliseconds */
export const INACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000;
export const LAST_ACTIVITY_KEY = 'jitu-team-last-activity';
export const SESSION_ACTIVE_KEY = 'jitu-team-session-active';

let lastMemoryTouch = 0;
let isLoggingOut = false;

export function getLastActivityTime(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const time = Number(raw);
    return Number.isFinite(time) ? time : null;
  } catch {
    return null;
  }
}

export function isSessionExpiredDueToInactivity(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isSessionActive = window.localStorage.getItem(SESSION_ACTIVE_KEY);
    if (!isSessionActive) return false;
    const lastActivity = getLastActivityTime();
    if (!lastActivity) return false;
    return Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS;
  } catch {
    return false;
  }
}

export function recordActivity(force = false) {
  if (typeof window === 'undefined' || isLoggingOut) return;
  const now = Date.now();
  // Throttle writes to localStorage: at most once every 30 seconds unless forced
  if (!force && now - lastMemoryTouch < 30_000) {
    return;
  }
  lastMemoryTouch = now;
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    window.localStorage.setItem(SESSION_ACTIVE_KEY, 'true');
  } catch {
    // Ignore quota errors
  }
}

export function markSessionStarted() {
  if (typeof window === 'undefined') return;
  lastMemoryTouch = Date.now();
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    window.localStorage.setItem(SESSION_ACTIVE_KEY, 'true');
  } catch {
    // Ignore quota errors
  }
}

export function clearSessionTracking() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
    window.localStorage.removeItem(SESSION_ACTIVE_KEY);
  } catch {
    // Ignore
  }
}

export async function performInactivityLogout() {
  if (typeof window === 'undefined' || isLoggingOut) return;
  isLoggingOut = true;
  clearSessionTracking();
  clearSessionCache();
  api.invalidate();
  try {
    await createSupabaseBrowserClient().auth.signOut();
  } catch {
    // Sign out silently even if network is failing
  }
  window.location.replace('/login?reason=inactivity');
}

/**
 * Hook to manage automatic logout after 12 hours of inactivity in the browser.
 * Listens for user interactions across tabs and enforces the 12-hour timeout.
 */
export function useInactivityTracker(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. Initial check on mount
    if (isSessionExpiredDueToInactivity()) {
      void performInactivityLogout();
      return;
    }

    // 2. Set initial activity timestamp if not yet set
    if (!getLastActivityTime()) {
      recordActivity(true);
    } else {
      recordActivity(false);
    }

    // 3. Throttle user interactions (mouse, keyboard, scroll, touch)
    const handleUserInteraction = () => {
      recordActivity(false);
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointerdown',
    ];

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserInteraction, { passive: true });
    });

    // 4. Check on tab visibility or window focus (e.g. computer woke up from sleep)
    const checkExpiration = () => {
      if (isSessionExpiredDueToInactivity()) {
        void performInactivityLogout();
      } else {
        recordActivity(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkExpiration);

    // 5. Periodic background interval check every 30 seconds
    const intervalId = window.setInterval(() => {
      checkExpiration();
    }, 30_000);

    // 6. Cross-tab synchronization via storage event
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY || event.key === SESSION_ACTIVE_KEY) {
        if (!event.newValue && isLoggingOut) {
          window.location.replace('/login');
        } else if (isSessionExpiredDueToInactivity()) {
          void performInactivityLogout();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserInteraction);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkExpiration);
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [enabled]);
}

