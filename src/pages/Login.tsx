import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { LoginResponse } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ nombre_usuario: '', contrasena: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', form);
      login(data);
      navigate('/inicio');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a2540',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Patrones decorativos */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(55,138,221,0.1)' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(55,138,221,0.07)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '10%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(55,138,221,0.1)' }} />
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(55,138,221,0.1)' }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '20%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(55,138,221,0.1)' }} />

      <div style={{
        background: 'white',
        borderRadius: 14,
        padding: '2.7rem', //espaciado aumentado
        width: '100%',
        maxWidth: 370, //ancho máximo para pantallas grandes
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 58, height: 58, background: '#e6f1fb', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 30,
          }}>🦷</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Clínica Dental</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Sistema de Gestión de Citas</div>
          <div style={{ width: 32, height: 2, background: '#185fa5', borderRadius: 2, margin: '10px auto 0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <i className="ti ti-user" style={{ fontSize: 13, color: '#185fa5' }} aria-hidden="true" /> Usuario
            </label>
            <input
              type="text"
              value={form.nombre_usuario}
              onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
              placeholder="Ingresa tu usuario"
              required
              style={{
                width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
                padding: '9px 12px', fontSize: 14, boxSizing: 'border-box',
                outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
              }}
              onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <i className="ti ti-lock" style={{ fontSize: 13, color: '#185fa5' }} aria-hidden="true" /> Contraseña
            </label>
            <input
              type="password"
              value={form.contrasena}
              onChange={e => setForm({ ...form, contrasena: e.target.value })}
              placeholder="••••••••"
              required
              style={{
                width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
                padding: '9px 12px', fontSize: 14, boxSizing: 'border-box',
                outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
              }}
              onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {error && (
            <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%', background: cargando ? '#93c5fd' : '#185fa5',
              color: 'white', border: 'none', borderRadius: 8,
              padding: 11, fontSize: 14, fontWeight: 500,
              cursor: cargando ? 'not-allowed' : 'pointer',
              transition: 'background 0.18s, transform 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!cargando) (e.target as HTMLButtonElement).style.background = '#0c447c'; }}
            onMouseLeave={e => { if (!cargando) (e.target as HTMLButtonElement).style.background = '#185fa5'; }}
          >
            {cargando ? 'Iniciando sesión...' : <><i className="ti ti-login" style={{ fontSize: 15 }} aria-hidden="true" /> Iniciar sesión</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;