import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

const KEY = 'teacher_session';
const TeacherAreaContext = createContext(null);

function readSession() {
  try {
    const s = sessionStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function TeacherAreaProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const login = useCallback(async (password) => {
    try {
      const res = await base44.functions.invoke('verifyTeacherPassword', { password });
      const d = res.data || {};
      if (d.ok) {
        const s = { token: d.token, version: d.version };
        sessionStorage.setItem(KEY, JSON.stringify(s));
        setSession(s);
        return { ok: true };
      }
      return { ok: false, error: d.error || 'server', retry_after: d.retry_after, attempts_left: d.attempts_left };
    } catch {
      return { ok: false, error: 'server' };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
  }, []);

  const clearIfInvalid = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isAuthed: !!session, login, logout, clearIfInvalid }),
    [session, login, logout, clearIfInvalid]
  );

  return <TeacherAreaContext.Provider value={value}>{children}</TeacherAreaContext.Provider>;
}

export function useTeacherArea() {
  const ctx = useContext(TeacherAreaContext);
  if (!ctx) throw new Error('useTeacherArea must be used within TeacherAreaProvider');
  return ctx;
}