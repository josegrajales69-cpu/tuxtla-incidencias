import {PasswordChange} from './PasswordChange';
import { useDialog } from '../utils/useDialog';
import React, { useState, useEffect } from 'react';
import {
  X, ChevronRight,
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
  initialTab?:'login'|'register';
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
  currentUser: UserSession | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,initialTab='login',
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const dialogRef = useDialog(isOpen,onClose);
  const [changingPassword,setChangingPassword]=useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('login');
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegPhone('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setError(null);
    setSuccessMsg(null);
  }, [currentUser?.id]);

  useEffect(()=>{if(isOpen){setActiveTab(initialTab);setError(null);}},[isOpen,initialTab]);
  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Escribe tu usuario o correo y tu contraseña.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Usuario o contraseña incorrectos');

      const sessionUser: UserSession = {
        ...data.user,
        token: data.token,
      };

      if (rememberMe) {
        localStorage.setItem('tuxtla_user', JSON.stringify(sessionUser));
      }else localStorage.removeItem('tuxtla_user');
      onLoginSuccess(sessionUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al autenticar en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(regEmail.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!regPassword) {
      setError('Escribe una contraseña.');
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

  const handleLogout = () => {
    const guest: UserSession = { id:'', name:'Invitado', email:'', role:'CIUDADANO' };
    localStorage.setItem('tuxtla_user', JSON.stringify(guest));
    onLoginSuccess(guest);
    onClose();
  };

  if(!isGuest&&changingPassword)return <PasswordChange user={currentUser} onSuccess={user=>{onLoginSuccess(user);setChangingPassword(false);}} onLogout={handleLogout} onClose={()=>setChangingPassword(false)}/>;
  if (!isGuest) {
    const role = {CIUDADANO:'Ciudadanía',BRIGADISTA:'Brigada',ADMIN:'Administración'}[currentUser.role];
    return <div className="simple-overlay" onClick={onClose}>
      <section ref={dialogRef} className="simple-sheet account-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={e=>e.stopPropagation()}>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar mi cuenta"><X size={18}/></button>
        <div className="account-heading">
          <span className="account-symbol"><User size={26} strokeWidth={1.5}/></span>
          <p className="eyebrow">Tuxtla Reportes</p>
          <h2 id="profile-title">Mi cuenta</h2>
          <p>Tu sesión está activa.</p>
        </div>
        <div className="sheet-scroll profile-content">
          <dl className="profile-details">
            <div><dt>Nombre</dt><dd>{currentUser.name}</dd></div>
            <div><dt>Usuario</dt><dd>{currentUser.username||currentUser.email}</dd></div>
            <div><dt>Perfil</dt><dd>{role}</dd></div>
            {currentUser.phone && <div><dt>Teléfono</dt><dd>{currentUser.phone}</dd></div>}
          </dl>
          <button type="button" className="system-primary" onClick={onClose}>Listo<CheckCircle2 size={16}/></button>
          <button type="button" className="account-secondary" onClick={()=>setChangingPassword(true)}>Cambiar contraseña</button>
          <button type="button" className="profile-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </section>
    </div>;
  }

  return (
    <div className="simple-overlay" onClick={onClose}>
      <section ref={dialogRef} className="simple-sheet account-sheet" role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={e => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Cerrar acceso"><X size={18}/></button>
        <div className="account-heading">
          <span className="account-symbol"><User size={26} strokeWidth={1.5}/></span>
          <p className="eyebrow">Tuxtla Reportes</p>
          <h2 id="account-title">{activeTab === 'login' ? 'Qué bueno verte.' : 'Tu ciudad empieza contigo.'}</h2>
          <p>{activeTab === 'login' ? 'Entra para reportar y seguir tus solicitudes.' : 'Registro ciudadano para reportar y seguir incidencias.'}</p>
        </div>
        <div className="sheet-scroll">
          <div className="segmented-control" aria-label="Acceso a tu cuenta">
            <button type="button" aria-pressed={activeTab === 'login'} onClick={() => {setActiveTab('login');setError(null);}}>Iniciar sesión</button>
            <button type="button" aria-pressed={activeTab === 'register'} onClick={() => {setActiveTab('register');setError(null);}}>Crear cuenta</button>
          </div>
          {error && <p className="form-notice error" role="alert">{error}</p>}
          {successMsg && <p className="form-notice" role="status">{successMsg}</p>}
          {activeTab === 'login' ? (
            <form noValidate onSubmit={handleLoginSubmit} className="simple-form">
              <label htmlFor="login-email">Usuario o correo electrónico</label>
              <input id="login-email" type="text" autoComplete="username" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="Tu usuario o correo"/>
              <label htmlFor="login-password">Contraseña</label>
              <div className="password-field">
                <input id="login-password" type={showLoginPassword?'text':'password'} autoComplete="current-password" required value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Tu contraseña"/>
                <button type="button" aria-label={showLoginPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowLoginPassword(!showLoginPassword)}>{showLoginPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
              </div>
              <label className="remember-choice"><input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)}/> Mantener mi sesión iniciada</label>
              <button className="system-primary" disabled={loading} type="submit">{loading?'Entrando…':'Continuar'}<ArrowRight size={16}/></button>
            </form>
          ) : (
            <form noValidate onSubmit={handleRegisterSubmit} className="simple-form">
              <label htmlFor="signup-name">Nombre completo</label>
              <input id="signup-name" autoComplete="name" required value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Tu nombre"/>
              <label htmlFor="signup-email">Correo electrónico</label>
              <input id="signup-email" type="email" autoComplete="email" required value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="nombre@ejemplo.com"/>
              <label htmlFor="signup-password">Contraseña</label>
              <div className="password-field">
                <input id="signup-password" type={showRegPassword?'text':'password'} autoComplete="new-password" minLength={6} required value={regPassword} onChange={e=>setRegPassword(e.target.value)} placeholder="Al menos 6 caracteres"/>
                <button type="button" aria-label={showRegPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowRegPassword(!showRegPassword)}>{showRegPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
              </div>
              <label htmlFor="signup-confirm">Confirma tu contraseña</label>
              <input id="signup-confirm" type={showRegPassword?'text':'password'} autoComplete="new-password" required value={regConfirmPassword} onChange={e=>setRegConfirmPassword(e.target.value)} placeholder="Vuelve a escribirla"/>
              <details className="optional-details"><summary>Añadir teléfono · Opcional</summary><label htmlFor="signup-phone" className="sr-only">Teléfono</label><input id="signup-phone" type="tel" autoComplete="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value)} placeholder="961 123 4567"/></details>
              <button className="system-primary" disabled={loading} type="submit">{loading?'Creando cuenta…':'Crear mi cuenta'}<ArrowRight size={16}/></button>
            </form>
          )}

        </div>

      </section>
    </div>
  );
};
