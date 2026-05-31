import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Tratamiento } from '../../types';
import { useAuth } from '../../context/AuthContext';

const Tratamientos = () => {
  // ── Control de roles ──────────────────────────────────────────
  const { usuario } = useAuth();
  const esAdmin = usuario?.nombre_rol === 'Administrador';
  const puedeAdministrar = esAdmin;
  // ──────────────────────────────────────────────────────────────

  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [tratamientoEditando, setTratamientoEditando] = useState<Tratamiento | null>(null);
  const [tratamientoEliminar, setTratamientoEliminar] = useState<Tratamiento | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const formInicial = { nombre: '', descripcion: '', costo: '' };
  const [form, setForm] = useState(formInicial);

  const cargarTratamientos = async (busq = '') => {
    setCargando(true);
    try {
      const params: any = {};
      if (busq) params.busqueda = busq;
      const { data } = await api.get<Tratamiento[]>('/tratamientos', { params });
      setTratamientos(data);
    } catch {
      setError('Error al cargar tratamientos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTratamientos(); }, []);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarTratamientos(busqueda);
  };

  const abrirModal = (tratamiento?: Tratamiento) => {
    if (tratamiento) {
      setTratamientoEditando(tratamiento);
      setForm({
        nombre: tratamiento.nombre,
        descripcion: tratamiento.descripcion || '',
        costo: String(tratamiento.costo),
      });
    } else {
      setTratamientoEditando(null);
      setForm(formInicial);
    }
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTratamientoEditando(null);
    setError('');
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (tratamientoEditando) {
        await api.put(`/tratamientos/${tratamientoEditando.id_tratamiento}`, {
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          costo: Number(form.costo),
        });
      } else {
        await api.post('/tratamientos', {
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          costo: Number(form.costo),
        });
      }
      cerrarModal();
      cargarTratamientos(busqueda);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (tratamiento: Tratamiento) => {
    setTratamientoEliminar(tratamiento);
    setModalEliminar(true);
  };

  const eliminar = async () => {
    if (!tratamientoEliminar) return;
    setGuardando(true);
    try {
      await api.delete(`/tratamientos/${tratamientoEliminar.id_tratamiento}`);
      setModalEliminar(false);
      setTratamientoEliminar(null);
      cargarTratamientos(busqueda);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setGuardando(false);
    }
  };

  const costoTotal = tratamientos.reduce((acc, t) => acc + Number(t.costo), 0);
  const costoPromedio = tratamientos.length > 0 ? costoTotal / tratamientos.length : 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#0a2540' }}>Tratamientos</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Catálogo de tratamientos dentales</div>
        </div>
        {puedeAdministrar && (
          <button
            onClick={() => abrirModal()}
            style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 0.18s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0c447c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#185fa5'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >+ Nuevo tratamiento</button>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total tratamientos', valor: tratamientos.length, color: '#0a2540', formato: 'numero',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" /></svg>,
          },
          {
            label: 'Costo promedio', valor: costoPromedio, color: '#185fa5', formato: 'quetzal',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-4" /></svg>,
          },
          {
            label: 'Costo más alto', valor: Math.max(...tratamientos.map(t => Number(t.costo)), 0), color: '#0f6e56', formato: 'quetzal',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /><path d="M9 10h6M9 14h3" /></svg>,
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
            <div style={{ fontSize: 24, fontWeight: 500, color: stat.color }}>
              {cargando ? '...' : stat.formato === 'quetzal' ? `Q${stat.valor.toFixed(2)}` : stat.valor}
            </div>
          </div>
        ))}
      </div>

      {error && !modalAbierto && (
        <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>
      )}

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 10, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540' }}>Lista de tratamientos</div>
          <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Buscar tratamiento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ ...inputStyle, width: 240, padding: '7px 12px', fontSize: 13 }}
            />
            <button type="submit"
              style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}
            >Buscar</button>
          </form>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['#', 'Nombre', 'Descripción', 'Costo', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 500, borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</td></tr>
            ) : tratamientos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No se encontraron tratamientos</td></tr>
            ) : tratamientos.map(t => (
              <tr key={t.id_tratamiento}
                style={{ borderBottom: '0.5px solid #e5e7eb', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '11px 16px', color: '#9ca3af' }}>{t.id_tratamiento}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eeedfe', color: '#534ab7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-pill" style={{ fontSize: 14 }} aria-hidden="true" />
                    </div>
                    <span style={{ fontWeight: 500, color: '#0a2540' }}>{t.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: '11px 16px', color: '#6b7280', maxWidth: 300 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.descripcion || <span style={{ color: '#d1d5db' }}>Sin descripción</span>}
                  </div>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ background: '#eaf3de', color: '#3b6d11', fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
                    Q{Number(t.costo).toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {puedeAdministrar ? (
                      <>
                        <button onClick={() => abrirModal(t)}
                          style={{ color: '#185fa5', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#e6f1fb')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >Editar</button>
                        <button onClick={() => confirmarEliminar(t)}
                          style={{ color: '#a32d2d', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fcebeb')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >Eliminar</button>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && puedeAdministrar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>
                {tratamientoEditando ? 'Editar tratamiento' : 'Nuevo tratamiento'}
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <form onSubmit={guardar}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Nombre del tratamiento</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  style={inputStyle} required
                  placeholder="Ej: Limpieza dental, Extracción..."
                  onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                  Descripción <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  placeholder="Descripción del tratamiento..."
                  onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Costo (Q)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.costo}
                  onChange={e => setForm({ ...form, costo: e.target.value })}
                  style={inputStyle} required
                  placeholder="0.00"
                  onFocus={e => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>
              )}

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
                >{guardando ? 'Guardando...' : tratamientoEditando ? 'Guardar cambios' : 'Crear tratamiento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {modalEliminar && tratamientoEliminar && puedeAdministrar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fcebeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 26, color: '#a32d2d' }} aria-hidden="true" />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540', marginBottom: 8 }}>¿Eliminar tratamiento?</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Estás a punto de eliminar <span style={{ fontWeight: 500, color: '#0a2540' }}>{tratamientoEliminar.nombre}</span>. Esta acción no se puede deshacer.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setModalEliminar(false); setTratamientoEliminar(null); }}
                style={{ flex: 1, border: '0.5px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >Cancelar</button>
              <button onClick={eliminar} disabled={guardando}
                style={{ flex: 1, background: guardando ? '#fca5a5' : '#a32d2d', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: guardando ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#7f1d1d'; }}
                onMouseLeave={e => { if (!guardando) e.currentTarget.style.background = '#a32d2d'; }}
              >{guardando ? 'Eliminando...' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tratamientos;