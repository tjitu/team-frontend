'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const shouldUseDarkMode = window.localStorage.getItem('jitu-team-theme') === 'dark';
    document.documentElement.classList.toggle('dark', shouldUseDarkMode);
    setDarkMode(shouldUseDarkMode);
  }, []);

  function toggleTheme() {
    const nextDarkMode = !darkMode;
    document.documentElement.classList.toggle('dark', nextDarkMode);
    window.localStorage.setItem('jitu-team-theme', nextDarkMode ? 'dark' : 'light');
    setDarkMode(nextDarkMode);
  }

  return (
    <button
      className={`theme-toggle ${className}`}
      type="button"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={darkMode}
      onClick={toggleTheme}
    >
      {darkMode ? (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2.5v2m0 11v2m7.5-7.5h-2m-11 0h-2m12.8-5.3-1.4 1.4m-7.8 7.8-1.4 1.4m10.6 0-1.4-1.4m-7.8-7.8L5.7 5.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16.2 12.2A7 7 0 0 1 7.8 3.8a7 7 0 1 0 8.4 8.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      )}
      <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
