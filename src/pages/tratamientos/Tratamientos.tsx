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
  const costoMaximo = Math.max(...tratamientos.map(t => Number(t.costo)), 0);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #cbd5e1',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Encabezado Unificado sin icono lateral */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Tratamientos
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Catálogo y tarifas de procedimientos odontológicos de la clínica
          </p>
        </div>
        {puedeAdministrar && (
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
            <span>Nuevo tratamiento</span>
          </button>
        )}
      </div>

      {/* Tarjetas resumen KPI Unificadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total tratamientos',
            valor: tratamientos.length,
            color: '#0f172a',
            formato: 'numero',
            iconBg: '#e2e8f0',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            ),
          },
          {
            label: 'Costo promedio',
            valor: costoPromedio,
            color: '#0369a1',
            formato: 'quetzal',
            iconBg: '#e0f2fe',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            ),
          },
          {
            label: 'Costo más alto',
            valor: costoMaximo,
            color: '#047857',
            formato: 'quetzal',
            iconBg: '#dcfce7',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              cursor: 'default',
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
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>
                {cargando ? '...' : stat.formato === 'quetzal' ? `Q${stat.valor.toFixed(2)}` : stat.valor}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {error && !modalAbierto && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: 13,
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Tabla y toolbar */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          backgroundColor: '#fafbfc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Directorio de Tratamientos</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {tratamientos.length} registrados
            </span>
          </div>

          <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Buscar tratamiento..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ ...inputStyle, width: 220, paddingLeft: 34, padding: '8px 12px 8px 34px' }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <button
              type="submit"
              style={{
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0369a1')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0284c7')}
            >
              Buscar
            </button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Procedimiento / Tratamiento', 'Descripción', 'Costo Unitario', 'Acciones'].map((h, index) => (
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
              {cargando ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#0ea5e9',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Cargando catálogo...</span>
                    </div>
                  </td>
                </tr>
              ) : tratamientos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>No se encontraron tratamientos</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Intenta ajustar tu término de búsqueda</div>
                  </td>
                </tr>
              ) : tratamientos.map(t => (
                <tr
                  key={t.id_tratamiento}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 500 }}>#{t.id_tratamiento}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#f3e8ff',
                        color: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b', maxWidth: 320 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.descripcion || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Sin descripción disponible</span>}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      fontSize: 12.5,
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontWeight: 700
                    }}>
                      Q{Number(t.costo).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {puedeAdministrar ? (
                        <>
                          <button
                            onClick={() => abrirModal(t)}
                            style={{
                              color: '#0369a1',
                              backgroundColor: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0284c7'; e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.color = '#0369a1'; }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => confirmarEliminar(t)}
                            style={{
                              color: '#b91c1c',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; }}
                          >
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && puedeAdministrar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '2rem',
            width: '100%',
            maxWidth: 460,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {tratamientoEditando ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0 0' }}>
                  {tratamientoEditando ? 'Actualiza la información y costo del procedimiento' : 'Ingresa los datos para registrar un procedimiento odontológico'}
                </p>
              </div>
              <button
                onClick={cerrarModal}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardar}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nombre del tratamiento *
                </label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  style={inputStyle}
                  required
                  placeholder="Ej: Limpieza dental, Calza resina, Endodoncia..."
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Descripción <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span>
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  placeholder="Detalles técnicos o alcance del procedimiento..."
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Costo Unitario (Q) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costo}
                  onChange={e => setForm({ ...form, costo: e.target.value })}
                  style={inputStyle}
                  required
                  placeholder="0.00"
                />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 13,
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 18
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    flex: 1,
                    border: '1.5px solid #cbd5e1',
                    background: 'white',
                    color: '#334155',
                    borderRadius: 12,
                    padding: 11,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
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
                    background: guardando ? '#cbd5e1' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: 11,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    boxShadow: guardando ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {guardando ? 'Guardando...' : tratamientoEditando ? 'Guardar cambios' : 'Crear tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {modalEliminar && tratamientoEliminar && puedeAdministrar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '2rem',
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              ¿Eliminar tratamiento?
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Estás a punto de eliminar <strong style={{ color: '#0f172a' }}>{tratamientoEliminar.nombre}</strong>. Esta acción eliminará el procedimiento del catálogo.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setModalEliminar(false); setTratamientoEliminar(null); }}
                style={{
                  flex: 1,
                  border: '1.5px solid #cbd5e1',
                  background: 'white',
                  color: '#334155',
                  borderRadius: 12,
                  padding: 11,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                Cancelar
              </button>
              <button
                onClick={eliminar}
                disabled={guardando}
                style={{
                  flex: 1,
                  background: guardando ? '#fca5a5' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: 11,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  boxShadow: guardando ? 'none' : '0 4px 14px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
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

export default Tratamientos;