import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Usuario, Rol } from '../../types';

const coloresRol: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' }, // Admin / Púrpura
  2: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }, // Médico / Esmeralda
  3: { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' }, // Recepcionista / Naranja
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre_usuario: '', contrasena: '', id_rol: '' });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    try {
      const [resUsuarios, resRoles] = await Promise.all([
        api.get<Usuario[]>('/usuarios'),
        api.get<Rol[]>('/usuarios/roles'),
      ]);
      setUsuarios(resUsuarios.data);
      setRoles(resRoles.data);
    } catch {
      setError('Error al cargar datos del servidor');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre_usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.rol?.nombre_rol || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const activos = usuarios.filter(u => u.estado === 1).length;
  const inactivos = usuarios.filter(u => u.estado === 0).length;

  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      setForm({ nombre_usuario: usuario.nombre_usuario, contrasena: '', id_rol: String(usuario.id_rol) });
    } else {
      setUsuarioEditando(null);
      setForm({ nombre_usuario: '', contrasena: '', id_rol: '' });
    }
    setMostrarContrasena(false);
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setUsuarioEditando(null); setError(''); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (usuarioEditando) {
        await api.put(`/usuarios/${usuarioEditando.id_usuario}`, {
          nombre_usuario: form.nombre_usuario,
          id_rol: Number(form.id_rol),
          ...(form.contrasena && { contrasena: form.contrasena }),
        });
      } else {
        await api.post('/usuarios', {
          nombre_usuario: form.nombre_usuario,
          contrasena: form.contrasena,
          id_rol: Number(form.id_rol),
        });
      }
      cerrarModal();
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: number) => {
    try {
      await api.patch(`/usuarios/${id}/estado`);
      cargarDatos();
    } catch {
      setError('Error al cambiar el estado del usuario');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #cbd5e1',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    background: '#f8fafc',
    color: '#0f172a',
    transition: 'all 0.2s ease',
  };

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
      <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
        </svg>
        <span>Cargando lista de usuarios...</span>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#e0f2fe', color: '#0284c7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              👤
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestión de Usuarios</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 46px' }}>Administra los accesos y roles del sistema DentaCare</p>
        </div>
        <button
          onClick={() => abrirModal()}
          style={{
            background: 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.35)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo usuario</span>
        </button>
      </div>

      {/* Tarjetas resumen KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total usuarios', valor: usuarios.length, color: '#0f172a', bg: '#f8fafc', iconBg: '#e2e8f0',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
          },
          {
            label: 'Usuarios activos', valor: activos, color: '#047857', bg: '#f0fdf4', iconBg: '#dcfce7',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
          },
          {
            label: 'Usuarios inactivos', valor: inactivos, color: '#b91c1c', bg: '#fef2f2', iconBg: '#fee2e2',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'white', borderRadius: 16, padding: '16px 20px',
              border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s ease', cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)';
            }}
          >
            <div>
              <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.valor}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
          fontSize: 13, padding: '12px 16px', borderRadius: 12, marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Contenedor principal de la tabla */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Barra de herramientas */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Lista de Usuarios</div>
          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="text"
              placeholder="Buscar por usuario o rol..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: 36,
                paddingRight: busqueda ? 30 : 14,
                fontSize: 13,
                borderRadius: 10,
              }}
              onFocus={e => {
                e.target.style.borderColor = '#0284c7';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.background = '#f8fafc';
                e.target.style.boxShadow = 'none';
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: 2,
                }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Usuario', 'Rol de acceso', 'Estado', 'Acciones'].map((h, index) => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: index === 4 ? 'right' : 'left',
                    fontSize: 12,
                    color: '#64748b',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(u => {
                const rolColor = coloresRol[u.id_rol] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
                return (
                  <tr
                    key={u.id_usuario}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 500 }}>#{u.id_usuario}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0284c7 0%, #185fa5 100%)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                        }}>
                          {u.nombre_usuario.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.nombre_usuario}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: rolColor.bg, color: rolColor.color, border: `1px solid ${rolColor.border}`,
                        fontSize: 12, padding: '4px 10px', borderRadius: 8, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                        {u.rol?.nombre_rol}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: u.estado === 1 ? '#ecfdf5' : '#fef2f2',
                        color: u.estado === 1 ? '#047857' : '#b91c1c',
                        border: `1px solid ${u.estado === 1 ? '#a7f3d0' : '#fecaca'}`,
                        fontSize: 12, padding: '4px 10px', borderRadius: 8, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.estado === 1 ? '#10b981' : '#ef4444' }} />
                        {u.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => abrirModal(u)}
                          style={{
                            background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd',
                            borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.color = '#0284c7'; }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => cambiarEstado(u.id_usuario)}
                          style={{
                            background: u.estado === 1 ? '#fef2f2' : '#f0fdf4',
                            color: u.estado === 1 ? '#b91c1c' : '#047857',
                            border: `1px solid ${u.estado === 1 ? '#fecaca' : '#a7f3d0'}`,
                            borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (u.estado === 1) {
                              e.currentTarget.style.background = '#b91c1c'; e.currentTarget.style.color = 'white';
                            } else {
                              e.currentTarget.style.background = '#047857'; e.currentTarget.style.color = 'white';
                            }
                          }}
                          onMouseLeave={e => {
                            if (u.estado === 1) {
                              e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c';
                            } else {
                              e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#047857';
                            }
                          }}
                        >
                          {u.estado === 1 ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {usuariosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 10, color: '#cbd5e1' }}><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No se encontraron usuarios</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Prueba con otro término de búsqueda</div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '2rem',
            width: '100%', maxWidth: 440, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0', animation: 'modalSlide 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, background: '#e0f2fe', color: '#0284c7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {usuarioEditando ? '✏️' : '👤'}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
                </h3>
              </div>
              <button
                onClick={cerrarModal}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  width: 30, height: 30, cursor: 'pointer', color: '#64748b',
                  fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            <form onSubmit={guardar}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={form.nombre_usuario}
                  onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej. juan.perez"
                  required
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
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Contraseña {usuarioEditando && <span style={{ fontWeight: 400, color: '#94a3b8' }}>(dejar en blanco para conservar)</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarContrasena ? 'text' : 'password'}
                    value={form.contrasena}
                    onChange={e => setForm({ ...form, contrasena: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    placeholder={usuarioEditando ? '••••••••' : 'Ingresa la contraseña'}
                    required={!usuarioEditando}
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
                  <button
                    type="button"
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4,
                    }}
                  >
                    {mostrarContrasena ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Rol de acceso
                </label>
                <select
                  value={form.id_rol}
                  onChange={e => setForm({ ...form, id_rol: e.target.value })}
                  style={inputStyle}
                  required
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
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map(r => (
                    <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
                  fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 18,
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    flex: 1, border: '1.5px solid #cbd5e1', background: 'white',
                    color: '#334155', borderRadius: 12, padding: '11px',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    flex: 1,
                    background: guardando ? '#93c5fd' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white', border: 'none', borderRadius: 12, padding: '11px',
                    fontSize: 14, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer',
                    boxShadow: guardando ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {guardando ? 'Guardando...' : usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Usuarios;