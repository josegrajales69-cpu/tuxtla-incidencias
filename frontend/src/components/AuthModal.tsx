import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Building2,
  User,
  Wrench,
  ShieldCheck,
  UserPlus,
  LogIn,
  Phone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserSession, UserRole } from '../types/report';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
  currentUser: UserSession | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Estado para Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estado para Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Perfiles demo precargados para acceso de alta resiliencia
  const DEMO_PROFILES: Record<string, UserSession> = {
    'admin@tuxtla.gob.mx': {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Ing. Carlos Mendoza',
      email: 'admin@tuxtla.gob.mx',
      role: 'ADMIN',
      phone: '9611234567',
    },
    'brigada@tuxtla.gob.mx': {
      id: 'b2222222-2222-2222-2222-222222222222',
      name: 'Brigada Obras Públicas 04',
      email: 'brigada@tuxtla.gob.mx',
      role: 'BRIGADISTA',
      phone: '9617654321',
    },
    'ciudadana@tuxtla.gob.mx': {
      id: 'c3333333-3333-3333-3333-333333333333',
      name: 'María Elena Solís',
      email: 'ciudadana@tuxtla.gob.mx',
      role: 'CIUDADANO',
      phone: '9619876543',
    },
  };

  // Acceso Rápido en 1 Clic para perfiles demo (Completamente Instantáneo)
  const handleQuickLogin = (demoEmail: string) => {
    const profile = DEMO_PROFILES[demoEmail];
    if (!profile) return;

    // Aplicar sesión de inmediato y cerrar modal en 0ms
    localStorage.setItem('tuxtla_user', JSON.stringify(profile));
    onLoginSuccess(profile);
    onClose();

    // Sincronizar token en segundo plano de manera transparente
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, password: 'tuxtla123' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          const full = { ...profile, ...data.user, token: data.token };
          localStorage.setItem('tuxtla_user', JSON.stringify(full));
          onLoginSuccess(full);
        }
      })
      .catch(() => {});
  };

  // Submit del formulario de Login manual
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Correo o contraseña incorrectos');

      const sessionUser: UserSession = {
        ...data.user,
        token: data.token,
      };

      if (rememberMe) {
        localStorage.setItem('tuxtla_user', JSON.stringify(sessionUser));
      }
      onLoginSuccess(sessionUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al autenticar en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Submit del formulario de Creación de Cuenta (Registro)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!regEmail.trim()) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
          role: 'CIUDADANO' as UserRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');

      const sessionUser: UserSession = {
        ...data.user,
        token: data.token,
      };

      localStorage.setItem('tuxtla_user', JSON.stringify(sessionUser));
      setSuccessMsg('¡Cuenta creada con éxito! Iniciando sesión...');
      setTimeout(() => {
        onLoginSuccess(sessionUser);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const isGuest = !currentUser || !currentUser.id;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Institucional */}
        <div className="p-6 pb-4 border-b border-slate-800 bg-gradient-to-b from-slate-800/60 to-transparent flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 tracking-wider uppercase">
                <Shield className="w-3.5 h-3.5" />
                <span>Gobierno de Tuxtla Gutiérrez</span>
              </div>
              <h2 className="text-base font-bold text-white leading-tight">
                Acceso y Registro de Usuarios
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Plataforma de Reportes de Incidencias Urbanas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable del modal */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* SECCIÓN 1: ACCESO RÁPIDO EN 1 CLIC (ROLES DE EVALUACIÓN) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Acceso Rápido en 1 Clic (Roles de Prueba):
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Sin contraseña</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Botón Admin */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin@tuxtla.gob.mx')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-800/50 bg-purple-950/30 hover:bg-purple-900/50 hover:border-purple-500 text-purple-200 transition group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                </div>
                <span className="text-xs font-bold leading-tight">Admin</span>
                <span className="text-[9px] text-purple-400/80 font-mono">Ing. Carlos</span>
              </button>

              {/* Botón Brigadista */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('brigada@tuxtla.gob.mx')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/50 hover:border-amber-500 text-amber-200 transition group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                  <Wrench className="w-4 h-4 text-amber-300" />
                </div>
                <span className="text-xs font-bold leading-tight">Brigadista</span>
                <span className="text-[9px] text-amber-400/80 font-mono">Cuadrilla 04</span>
              </button>

              {/* Botón Ciudadana */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('ciudadana@tuxtla.gob.mx')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-800/50 bg-blue-950/30 hover:bg-blue-900/50 hover:border-blue-500 text-blue-200 transition group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                  <User className="w-4 h-4 text-blue-300" />
                </div>
                <span className="text-xs font-bold leading-tight">Ciudadano</span>
                <span className="text-[9px] text-blue-400/80 font-mono">María Elena</span>
              </button>
            </div>
          </div>

          {/* Mensajes de Alerta */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-700/50 rounded-2xl text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-950/60 border border-green-700/50 rounded-2xl text-green-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SELECTOR DE PESTAÑAS: INICIAR SESIÓN vs CREAR CUENTA */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* PESTAÑA A: FORMULARIO DE INICIO DE SESIÓN */}
          {/* ========================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@tuxtla.gob.mx o tu correo"
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-blue-400 font-mono">
                    Demo: tuxtla123
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-11 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Recordar mis credenciales</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA B: FORMULARIO DE CREAR CUENTA (REGISTRO) */}
          {/* ========================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Roberto Gómez Morales"
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp <span className="text-slate-500 font-normal lowercase">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ej. 961 123 4567"
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Contraseña <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mín. 6 letras"
                      className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-white p-0.5"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirmar <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repetir clave"
                      className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando tu cuenta...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear mi Cuenta de Ciudadano</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer: Estado de la sesión actual y Cerrar Sesión */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          {!isGuest ? (
            <>
              <span className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="truncate">
                  Sesión: <strong className="text-white font-medium">{currentUser.name}</strong> ({currentUser.role})
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const guestUser: UserSession = {
                    id: '',
                    name: 'Invitado',
                    email: '',
                    role: 'CIUDADANO',
                  };
                  localStorage.setItem('tuxtla_user', JSON.stringify(guestUser));
                  onLoginSuccess(guestUser);
                  onClose();
                }}
                className="text-red-400 hover:text-red-300 font-semibold shrink-0 ml-2 px-2.5 py-1 rounded-lg hover:bg-red-950/30 transition"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <span className="text-slate-400">
                Navegando en <strong className="text-slate-300">Modo Invitado</strong>
              </span>
              <span className="text-[11px] text-blue-400 font-semibold">
                Inicia sesión para reportar
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
