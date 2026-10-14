import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTeacherArea } from '@/lib/TeacherAreaContext';
import { getRole, setRole, ROLE_TEACHER } from '@/lib/userRole';
import { GraduationCap, User, Lock, Loader2, ArrowLeft } from 'lucide-react';

// Pantalla inicial: pregunta si quien entra es estudiante o profesor.
// - Estudiante: se cierra y queda el menú normal (se recuerda en sessionStorage).
// - Profesor: pide la contraseña configurada del Área de Maestros; al validar,
//   activa la sesión de profesor y lo lleva al Área de Maestros.
// En móvil se ajusta para que las opciones queden cómodas y al alcance del dedo.
export default function RoleOnboarding() {
  const navigate = useNavigate();
  const { login } = useTeacherArea();
  const [visible, setVisible] = useState(() => !getRole());
  const [mode, setMode] = useState(null); // null | 'teacher'
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const chooseStudent = () => {
    setRole('student');
    setVisible(false);
  };

  const chooseTeacher = () => {
    setMode('teacher');
    setError('');
    setPassword('');
  };

  const submitTeacher = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    const res = await login(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error === 'not_configured'
        ? 'El acceso de profesores aún no está configurado. Pide al administrador que habilite la contraseña.'
        : 'Contraseña no válida. Inténtalo de nuevo.');
      return;
    }
    setRole(ROLE_TEACHER);
    setVisible(false);
    navigate('/profesores');
  };

  // Portal al body: el Layout envuelve las páginas con transformaciones (animaciones
  // de ruta), lo que convierte position:fixed en relativo al ancestro transformado
  // y mandaría la pantalla de selección al fondo del documento. Saliendo al body
  // el overlay queda fijo al viewport y las opciones quedan al alcance del dedo.
  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto flex flex-col justify-center bg-background/95 backdrop-blur px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-card rounded-3xl border border-border shadow-float p-5 sm:p-7 my-auto">
        {!mode ? (
          <>
            <div className="text-center mb-5 sm:mb-6">
              <div className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-light text-brand mx-auto mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">🌮</span>
              </div>
              <h1 className="font-display font-700 text-[22px] sm:text-[24px] text-foreground">Bienvenido a la cafetería</h1>
              <p className="text-[13px] text-muted-foreground mt-1.5">¿Cómo vas a usar la app hoy?</p>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <button onClick={chooseStudent}
                className="w-full flex items-center gap-3 p-3.5 sm:p-4 min-h-[64px] rounded-2xl border border-border bg-card hover:border-brand/40 hover:bg-brand-light/40 transition-colors text-left">
                <span className="grid place-items-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-brand-light text-brand shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-700 text-[15px] sm:text-[16px] text-foreground">Soy estudiante</span>
                  <span className="block text-[12px] text-muted-foreground mt-0.5">Ver el menú y pedir mi comida</span>
                </span>
              </button>

              <button onClick={chooseTeacher}
                className="w-full flex items-center gap-3 p-3.5 sm:p-4 min-h-[64px] rounded-2xl border border-border bg-card hover:border-brand/40 hover:bg-brand-light/40 transition-colors text-left">
                <span className="grid place-items-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-700 text-[15px] sm:text-[16px] text-foreground">Soy profesor</span>
                  <span className="block text-[12px] text-muted-foreground mt-0.5">Pedir con prioridad (necesita contraseña)</span>
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4 sm:mb-5">
              <div className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 text-blue-700 mx-auto mb-3 sm:mb-4">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h1 className="font-display font-700 text-[21px] sm:text-[22px] text-foreground">Acceso de profesores</h1>
              <p className="text-[13px] text-muted-foreground mt-1.5">Introduce la contraseña compartida para continuar.</p>
            </div>

            <form onSubmit={submitTeacher} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Contraseña"
                  autoFocus
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-card text-[14px] focus:outline-none focus:border-brand"
                />
              </div>

              {error && (
                <p className="text-[12px] text-destructive bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3.5 rounded-pill bg-brand text-white font-display font-700 text-[15px] hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</> : 'Continuar como profesor'}
              </button>
            </form>

            <button onClick={() => { setMode(null); setError(''); }}
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-brand">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}