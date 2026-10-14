// Centraliza el rol elegido en la pantalla inicial (estudiante / profesor).
// Se guarda en sessionStorage: se recuerda durante la sesión y se reinicia al
// cerrar la pestaña, de modo que la pregunta vuelva a aparecer al abrir la app.
const KEY = 'role_chosen';

export const ROLE_STUDENT = 'student';
export const ROLE_TEACHER = 'teacher';

export function getRole() {
  try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
}

export function setRole(role) {
  try { sessionStorage.setItem(KEY, role); } catch { /* noop */ }
}

export function isTeacherRole() {
  return getRole() === ROLE_TEACHER;
}