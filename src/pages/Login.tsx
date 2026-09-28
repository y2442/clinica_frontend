import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { LoginResponse } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ nombre_usuario: '', contrasena: '' });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [recordarUsuario, setRecordarUsuario] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('denta_remembered_user');
    if (usuarioGuardado) {
      setForm(prev => ({ ...prev, nombre_usuario: usuarioGuardado }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_usuario || !form.contrasena) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', form);

      if (recordarUsuario) {
        localStorage.setItem('denta_remembered_user', form.nombre_usuario);
      } else {
        localStorage.removeItem('denta_remembered_user');
      }

      login(data);
      navigate('/inicio');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const rellenarCredenciales = (user: string, pass: string) => {
    setForm({ nombre_usuario: user, contrasena: pass });
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(circle at 50% 10%, #0d2847 0%, #051322 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: 20,
      boxSizing: 'border-box',
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Luces y círculos decorativos de fondo */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(55,138,221,0.12)', border: '1px solid rgba(55,138,221,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '8%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(55,138,221,0.15)', border: '1px solid rgba(55,138,221,0.2)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '12%', right: '12%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(55,138,221,0.12)', border: '1px solid rgba(55,138,221,0.18)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '22%', left: '18%', width: 130, height: 130, borderRadius: '50%', background: 'rgba(55,138,221,0.12)', border: '1px solid rgba(55,138,221,0.15)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: '-10%', left: '20%', width: 450, height: 450,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(55,138,221,0.2) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '15%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* Tarjeta Glassmorphic */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        padding: '2.5rem 2.25rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 10,
        transition: 'transform 0.3s ease',
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 32,
            boxShadow: '0 10px 25px rgba(24, 95, 165, 0.35)',
            color: 'white',
          }}>
            🦷
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            DentaCare
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Sistema de Gestión de Citas
          </p>
          <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg, #185fa5, #0284c7)', borderRadius: 2, margin: '12px auto 0' }} />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
            fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Campo Usuario */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className="ti ti-user" style={{ fontSize: 14, color: '#185fa5' }} aria-hidden="true" /> Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={form.nombre_usuario}
                onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                placeholder="Ingresa tu nombre de usuario"
                required
                style={{
                  width: '100%',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '10px 14px 10px 38px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  transition: 'all 0.2s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#0284c7';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <i className="ti ti-lock" style={{ fontSize: 14, color: '#185fa5' }} aria-hidden="true" /> Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarContrasena ? 'text' : 'password'}
                value={form.contrasena}
                onChange={e => setForm({ ...form, contrasena: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '10px 40px 10px 38px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  transition: 'all 0.2s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#0284c7';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6,
                }}
                title={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarContrasena ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: '#475569', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={recordarUsuario}
                onChange={e => setRecordarUsuario(e.target.checked)}
                style={{ accentColor: '#0284c7', width: 15, height: 15, borderRadius: 4, cursor: 'pointer' }}
              />
              Recordar usuario
            </label>
          </div>

          {/* Botón de ingreso */}
          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              background: cargando ? '#93c5fd' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 600,
              cursor: cargando ? 'not-allowed' : 'pointer',
              boxShadow: cargando ? 'none' : '0 10px 20px -5px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => {
              if (!cargando) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 24px -5px rgba(2, 132, 199, 0.5)';
              }
            }}
            onMouseLeave={e => {
              if (!cargando) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 20px -5px rgba(2, 132, 199, 0.4)';
              }
            }}
          >
            {cargando ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
                </svg>
                <span>Accediendo...</span>
              </>
            ) : (
              <>
                <span>Iniciar sesión</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Credenciales rápidas de acceso */}
        <div style={{
          marginTop: 24,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 12,
        }}>
          <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Acceso rápido de prueba</span>
            <span style={{ fontSize: 10, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Click para llenar</span>
          </div>
          <button
            type="button"
            onClick={() => rellenarCredenciales('admin', 'admin1')}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#0284c7';
              (e.currentTarget as HTMLButtonElement).style.background = '#f0f9ff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1';
              (e.currentTarget as HTMLButtonElement).style.background = 'white';
            }}
          >
            <span>⚡ Administrador</span>
            <span style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>admin / admin1</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;