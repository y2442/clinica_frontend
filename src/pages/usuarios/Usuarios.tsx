import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Usuario, Rol } from '../../types';

const coloresAvatar: Record<number, { bg: string; color: string }> = {
  1: { bg: '#eeedfe', color: '#534ab7' },
  2: { bg: '#e1f5ee', color: '#0f6e56' },
  3: { bg: '#faece7', color: '#993c1d' },
};

const coloresRol: Record<number, { bg: string; color: string }> = {
  1: { bg: '#eeedfe', color: '#534ab7' },
  2: { bg: '#e1f5ee', color: '#0f6e56' },
  3: { bg: '#faece7', color: '#993c1d' },
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre_usuario: '', contrasena: '', id_rol: '' });
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
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre_usuario.toLowerCase().includes(busqueda.toLowerCase())
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
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: number) => {
    try {
      await api.patch(`/usuarios/${id}/estado`);
      cargarDatos();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, boxSizing: 'border-box',
    outline: 'none', background: 'white',
  };

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>Cargando usuarios...</div>
    </div>
  );

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#0a2540' }}>Usuarios</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Gestión de usuarios del sistema</div>
        </div>
        <button
          onClick={() => abrirModal()}
          style={{
            background: '#185fa5', color: 'white', border: 'none', borderRadius: 8,
            padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'background 0.18s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0c447c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#185fa5'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total usuarios', valor: usuarios.length, color: '#0a2540',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3"/><path d="M17.5 21c0-2.485-2.462-4.5-5.5-4.5s-5.5 2.015-5.5 4.5"/><circle cx="9" cy="7" r="4"/></svg>,
          },
          {
            label: 'Activos', valor: activos, color: '#0f6e56',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>,
          },
          {
            label: 'Inactivos', valor: inactivos, color: '#a32d2d',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'white', borderRadius: 10, padding: '14px 16px',
              border: '0.5px solid #e5e7eb', transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: stat.color, display: 'flex' }}>{stat.icon}</span> {stat.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, color: stat.color }}>{stat.valor}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 10, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540' }}>Lista de usuarios</div>
          <input
            placeholder="🔍  Buscar usuario..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ ...inputStyle, width: 200, padding: '7px 12px', fontSize: 13 }}
          />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['#', 'Usuario', 'Rol', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 500, borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(u => {
              const avatarColor = coloresAvatar[u.id_rol] || { bg: '#f3f4f6', color: '#374151' };
              const rolColor = coloresRol[u.id_rol] || { bg: '#f3f4f6', color: '#374151' };
              return (
                <tr
                  key={u.id_usuario}
                  style={{ borderBottom: '0.5px solid #e5e7eb', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '11px 16px', color: '#9ca3af' }}>{u.id_usuario}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarColor.bg, color: avatarColor.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                        {u.nombre_usuario.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: '#0a2540' }}>{u.nombre_usuario}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ background: rolColor.bg, color: rolColor.color, fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 500 }}>
                      {u.rol?.nombre_rol}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{
                      background: u.estado === 1 ? '#eaf3de' : '#fcebeb',
                      color: u.estado === 1 ? '#48910d' : '#a32d2d',
                      fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 500,
                    }}>
                      {u.estado === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[
                        { label: 'Editar', color: '#185fa5', hoverBg: '#e6f1fb', action: () => abrirModal(u) },
                        {
                          label: u.estado === 1 ? 'Desactivar' : 'Activar',
                          color: u.estado === 1 ? '#a32d2d' : '#0f6e1f',
                          hoverBg: u.estado === 1 ? '#fcebeb' : '#eaf3de',
                          action: () => cambiarEstado(u.id_usuario),
                        },
                      ].map(btn => (
                        <button
                          key={btn.label}
                          onClick={btn.action}
                          style={{ color: btn.color, fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = btn.hoverBg)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {usuariosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: 14 }}>
            No se encontraron usuarios
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>
                {usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <form onSubmit={guardar}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Nombre de usuario</label>
                <input
                  type="text"
                  value={form.nombre_usuario}
                  onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                  style={inputStyle}
                  required
                  onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                  Contraseña {usuarioEditando && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  value={form.contrasena}
                  onChange={e => setForm({ ...form, contrasena: e.target.value })}
                  style={inputStyle}
                  required={!usuarioEditando}
                  onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Rol</label>
                <select
                  value={form.id_rol}
                  onChange={e => setForm({ ...form, id_rol: e.target.value })}
                  style={{ ...inputStyle }}
                  required
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map(r => (
                    <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{ flex: 1, border: '0.5px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 8, padding: '10px', fontSize: 14, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ flex: 1, background: guardando ? '#93c5fd' : '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 500, cursor: guardando ? 'not-allowed' : 'pointer', transition: 'background 0.18s' }}
                  onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#0c447c'; }}
                  onMouseLeave={e => { if (!guardando) e.currentTarget.style.background = '#185fa5'; }}
                >
                  {guardando ? 'Guardando...' : usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;