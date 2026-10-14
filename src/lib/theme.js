import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'cecytem_theme';

export const THEMES = [
  { value: 'light', label: 'Claro', icon: '☀️' },
  { value: 'dark', label: 'Oscuro', icon: '🌙' },
  { value: 'auto', label: 'Automático', icon: '⚙️' },
];

export function getThemePref() {
  try { return localStorage.getItem(STORAGE_KEY) || 'auto'; } catch { return 'auto'; }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function applyTheme(pref) {
  const dark = pref === 'dark' || (pref === 'auto' && systemPrefersDark());
  const root = document.documentElement;
  if (dark) root.classList.add('dark');
  else root.classList.remove('dark');
}

export function setThemePref(pref) {
  try { localStorage.setItem(STORAGE_KEY, pref); } catch {}
  applyTheme(pref);
}

// Apply the stored preference on load and keep tracking the system setting
// while in "auto" mode.
export function initTheme() {
  applyTheme(getThemePref());
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => { if (getThemePref() === 'auto') applyTheme('auto'); };
  try { mq.addEventListener('change', handler); }
  catch { try { mq.addListener(handler); } catch {} }
}

export function useTheme() {
  const [pref, setPref] = useState(getThemePref());
  useEffect(() => { applyTheme(pref); }, [pref]);
  const change = useCallback((p) => { setThemePref(p); setPref(p); }, []);
  return { theme: pref, setTheme: change };
}