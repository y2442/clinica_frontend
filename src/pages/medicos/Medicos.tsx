import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Medico } from '../../types';
import { useAuth } from '../../context/AuthContext'; // Control de roles

const Medicos = () => {
  const navigate = useNavigate();

  // ── Control de roles ──────────────────────────────────────────
  // Se obtiene el usuario autenticado para verificar su rol
  const { usuario } = useAuth();
  const esAdmin = usuario?.nombre_rol === 'Administrador';
  // Solo el admin puede registrar, editar y activar/desactivar médicos
  // La recepcionista solo puede ver la lista y el detalle
  const puedeGestionar = esAdmin;
  // ──────────────────────────────────────────────────────────────

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [medicoEditando, setMedicoEditando] = useState<Medico | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const formInicial = {
    dpi: '', nombre: '', apellido: '', telefono: '',
    correo: '', direccion: '', fecha_nacimiento: '',
    nombre_usuario: '', contrasena: '',
  };
  const [form, setForm] = useState(formInicial);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params: any = {};
      if (filtroEstado !== '') params.estado = filtroEstado;
      if (busqueda !== '') params.busqueda = busqueda;
      const [resMedicos] = await Promise.all([
        api.get<Medico[]>('/medicos', { params }),
      ]);
      setMedicos(resMedicos.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [filtroEstado]);

  const buscar = (e: React.FormEvent) => { e.preventDefault(); cargarDatos(); };

  const abrirModal = (medico?: Medico) => {
    if (medico) {
      setMedicoEditando(medico);
      setForm({
        dpi: medico.dpi,
        nombre: medico.nombre,
        apellido: medico.apellido,
        telefono: medico.telefono,
        correo: medico.correo || '',
        direccion: medico.direccion || '',
        fecha_nacimiento: medico.fecha_nacimiento.split('T')[0],
        nombre_usuario: '',
        contrasena: '',
      });
    } else {
      setMedicoEditando(null);
      setForm(formInicial);
    }
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setMedicoEditando(null); setError(''); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (medicoEditando) {
        await api.put(`/medicos/${medicoEditando.id_medico}`, {
          nombre: form.nombre, apellido: form.apellido,
          telefono: form.telefono, correo: form.correo || null,
          direccion: form.direccion || null, fecha_nacimiento: form.fecha_nacimiento,
        });
      } else {
        await api.post('/medicos', form);
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
      await api.patch(`/medicos/${id}/estado`);
      cargarDatos();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const activos = medicos.filter(m => m.usuario?.estado === 1).length;
  const inactivos = medicos.filter(m => m.usuario?.estado === 0).length;

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#0a2540' }}>Médicos</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Gestión del personal médico</div>
        </div>

        {/* Botón nuevo médico — solo admin */}
        {puedeGestionar && (
          <button
            onClick={() => abrirModal()}
            style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 0.18s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0c447c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#185fa5'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >+ Nuevo médico</button>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total médicos', valor: medicos.length, color: '#0a2540',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M18 9v6M15 12h6"/></svg>,
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
          <div key={i}
            style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '0.5px solid #e5e7eb', transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'default' }}
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

      {error && <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 10, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540' }}>Lista de médicos</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              style={{ border: '0.5px solid #d1d5db', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Todos</option>
              <option value="1">Activos</option>
              <option value="0">Inactivos</option>
            </select>
            <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Buscar médico..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ ...inputStyle, width: 220, padding: '7px 12px', fontSize: 13 }}
              />
              <button type="submit" style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
                Buscar
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de médicos */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['#', 'Médico', 'Teléfono', 'Especialidades', 'Usuario', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 500, borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</td></tr>
            ) : medicos.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No se encontraron médicos</td></tr>
            ) : medicos.map(m => (
              <tr key={m.id_medico}
                style={{ borderBottom: '0.5px solid #e5e7eb', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '11px 16px', color: '#9ca3af' }}>{m.id_medico}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e1f5ee', color: '#0f6e56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                      {m.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#0a2540' }}>Dr. {m.nombre} {m.apellido}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.correo || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '11px 16px', color: '#6b7280' }}>{m.telefono}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {m.especialidades.length === 0
                      ? <span style={{ color: '#9ca3af', fontSize: 12 }}>Sin asignar</span>
                      : m.especialidades.map(e => (
                        <span key={e.id_especialidad} style={{ background: '#eeedfe', color: '#534ab7', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                          {e.nombre}
                        </span>
                      ))
                    }
                  </div>
                </td>
                <td style={{ padding: '11px 16px', color: '#6b7280', fontSize: 12 }}>{m.usuario?.nombre_usuario}</td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ background: m.usuario?.estado === 1 ? '#eaf3de' : '#fcebeb', color: m.usuario?.estado === 1 ? '#3b6d11' : '#a32d2d', fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 500 }}>
                    {m.usuario?.estado === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>

                    {/* Ver detalle — admin y recepcionista */}
                    <button onClick={() => navigate(`/medicos/${m.id_medico}`)}
                      style={{ color: '#0f6e56', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#eaf3de')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >Ver</button>

                    {/* Editar — solo admin */}
                    {puedeGestionar && (
                      <button onClick={() => abrirModal(m)}
                        style={{ color: '#185fa5', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#e6f1fb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >Editar</button>
                    )}

                    {/* Activar/Desactivar — solo admin */}
                    {puedeGestionar && (
                      <button onClick={() => cambiarEstado(m.id_medico)}
                        style={{ color: m.usuario?.estado === 1 ? '#a32d2d' : '#0f6e56', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = m.usuario?.estado === 1 ? '#fcebeb' : '#eaf3de')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >{m.usuario?.estado === 1 ? 'Desactivar' : 'Activar'}</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar — solo visible para admin */}
      {modalAbierto && puedeGestionar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>
                {medicoEditando ? 'Editar médico' : 'Nuevo médico'}
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <form onSubmit={guardar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>DPI</label>
                  <input value={form.dpi} onChange={e => setForm({ ...form, dpi: e.target.value })}
                    style={{ ...inputStyle, background: medicoEditando ? '#f9fafb' : 'white', color: medicoEditando ? '#9ca3af' : 'inherit' }}
                    disabled={!!medicoEditando} required={!medicoEditando} placeholder="1234567890101"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Fecha de nacimiento</label>
                  <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} style={inputStyle} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Nombre</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Apellido</label>
                  <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} style={inputStyle} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Correo <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                  <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Dirección <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} style={inputStyle} />
              </div>

              {/* Credenciales — solo al crear un nuevo médico */}
              {!medicoEditando && (
                <>
                  <div style={{ borderTop: '0.5px solid #e5e7eb', margin: '16px 0', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#0a2540', marginBottom: 12 }}>Credenciales de acceso</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Usuario</label>
                        <input value={form.nombre_usuario} onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} style={inputStyle} required placeholder="dr.nombre" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Contraseña</label>
                        <input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} style={inputStyle} required />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {error && <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={cerrarModal}
                  style={{ flex: 1, border: '0.5px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >Cancelar</button>
                <button type="submit" disabled={guardando}
                  style={{ flex: 1, background: guardando ? '#93c5fd' : '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: guardando ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#0c447c'; }}
                  onMouseLeave={e => { if (!guardando) e.currentTarget.style.background = '#185fa5'; }}
                >{guardando ? 'Guardando...' : medicoEditando ? 'Guardar cambios' : 'Registrar médico'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicos;