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
    background: '#ffffff',
    color: '#0f172a',
    transition: 'all 0.2s ease',
  };

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350, fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
        </svg>
        <span>Cargando lista de usuarios...</span>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif", minHeight: '100%', padding: '4px 0 24px 0' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Usuarios
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Administración de accesos, credenciales y roles del sistema DentaCare
          </p>
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
            display: 'inline-flex',
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
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Tarjetas resumen KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Usuarios', valor: usuarios.length, color: '#0284c7', bg: '#f0f9ff', iconBg: '#e0f2fe',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
          },
          {
            label: 'Usuarios Activos', valor: activos, color: '#047857', bg: '#f0fdf4', iconBg: '#dcfce7',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
          },
          {
            label: 'Usuarios Inactivos', valor: inactivos, color: '#b91c1c', bg: '#fff1f2', iconBg: '#fee2e2',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff', borderRadius: 16, padding: '18px 20px',
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
              <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{stat.valor}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
        background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Barra de herramientas */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, backgroundColor: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Lista de Usuarios</span>
            <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: 20 }}>
              {usuariosFiltrados.length} usuarios
            </span>
          </div>
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
                e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Usuario', 'Rol de acceso', 'Estado', 'Acciones'].map((h, index) => (
                  <th key={h} style={{
                    padding: '14px 20px',
                    textAlign: index === 4 ? 'right' : 'left',
                    fontSize: 12,
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
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
                    <td style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>#{u.id_usuario}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 12,
                          background: 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, flexShrink: 0,
                          boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)',
                        }}>
                          {u.nombre_usuario.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{u.nombre_usuario}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        background: rolColor.bg, color: rolColor.color, border: `1px solid ${rolColor.border}`,
                        fontSize: 12, padding: '4px 10px', borderRadius: 8, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                        {u.rol?.nombre_rol}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        backgroundColor: u.estado === 1 ? '#f0fdf4' : '#fff1f2',
                        color: u.estado === 1 ? '#166534' : '#991b1b',
                        border: `1px solid ${u.estado === 1 ? '#bbf7d0' : '#fecaca'}`,
                        fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: u.estado === 1 ? '#22c55e' : '#f43f5e' }} />
                        {u.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => abrirModal(u)}
                          style={{
                            color: '#0369a1', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd',
                            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0284c7'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.color = '#0369a1'; }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => cambiarEstado(u.id_usuario)}
                          style={{
                            color: u.estado === 1 ? '#be123c' : '#15803d',
                            backgroundColor: u.estado === 1 ? '#ffe4e6' : '#dcfce7',
                            border: `1px solid ${u.estado === 1 ? '#fecdd3' : '#bbf7d0'}`,
                            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (u.estado === 1) {
                              e.currentTarget.style.backgroundColor = '#e11d48'; e.currentTarget.style.color = '#ffffff';
                            } else {
                              e.currentTarget.style.backgroundColor = '#16a34a'; e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = u.estado === 1 ? '#ffe4e6' : '#dcfce7';
                            e.currentTarget.style.color = u.estado === 1 ? '#be123c' : '#15803d';
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
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: 28,
            width: '100%', maxWidth: 460, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #f1f5f9', animation: 'modalSlide 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                  {usuarioEditando ? 'Actualiza los datos del usuario seleccionado' : 'Asigna nombre de usuario, clave y rol de acceso'}
                </p>
              </div>
              <button
                onClick={cerrarModal}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', color: '#64748b',
                  fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            <form onSubmit={guardar}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  value={form.nombre_usuario}
                  onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej. juan.perez"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Rol de acceso *
                </label>
                <select
                  value={form.id_rol}
                  onChange={e => setForm({ ...form, id_rol: e.target.value })}
                  style={inputStyle}
                  required
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
                    color: '#334155', borderRadius: 12, padding: '12px',
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
                    color: 'white', border: 'none', borderRadius: 12, padding: '12px',
                    fontSize: 14, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer',
                    boxShadow: guardando ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {guardando ? 'Guardando...' : usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}
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