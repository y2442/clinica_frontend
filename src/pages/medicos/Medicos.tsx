import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Medico } from '../../types';
import { useAuth } from '../../context/AuthContext';

const Medicos = () => {
  const navigate = useNavigate();

  // ── Control de roles ──────────────────────────────────────────
  const { usuario } = useAuth();
  const esAdmin = usuario?.nombre_rol === 'Administrador';
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

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Encabezado Unificado sin icono lateral */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Médicos
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Gestión y administración del personal médico de la clínica
          </p>
        </div>

        {/* Botón nuevo médico — solo admin */}
        {puedeGestionar && (
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
            <span>Nuevo médico</span>
          </button>
        )}
      </div>

      {/* Tarjetas de resumen KPI Unificadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total médicos',
            valor: medicos.length,
            color: '#0f172a',
            iconBg: '#e2e8f0',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                <path d="M18 9v6M15 12h6"/>
              </svg>
            ),
          },
          {
            label: 'Médicos activos',
            valor: activos,
            color: '#047857',
            iconBg: '#dcfce7',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 5-5"/>
              </svg>
            ),
          },
          {
            label: 'Médicos inactivos',
            valor: inactivos,
            color: '#b91c1c',
            iconBg: '#fee2e2',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
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
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.valor}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {error && (
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Contenedor principal de la tabla */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Barra de herramientas */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          backgroundColor: '#fafbfc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Directorio de Médicos</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {medicos.length} registros
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Estado:</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                style={{
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todos los estados</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
            </div>

            <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Buscar médico por nombre o DPI..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: 240,
                    paddingLeft: 36,
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
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
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
                  padding: '8px 16px',
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
        </div>

        {/* Tabla de médicos */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Médico', 'Teléfono', 'Especialidades', 'Usuario Acceso', 'Estado', 'Acciones'].map((h, index) => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: index === 6 ? 'right' : 'left',
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
                  <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#0ea5e9',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Cargando directorio médico...</span>
                    </div>
                  </td>
                </tr>
              ) : medicos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>No se encontraron médicos</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Intenta ajustar tus filtros o términos de búsqueda</div>
                  </td>
                </tr>
              ) : medicos.map(m => {
                const inicial = m.nombre ? m.nombre.charAt(0).toUpperCase() : 'M';
                return (
                  <tr
                    key={m.id_medico}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 500 }}>#{m.id_medico}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #047857 0%, #0f6e56 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                        }}>
                          {inicial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>Dr. {m.nombre} {m.apellido}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.correo || 'Sin correo registrado'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 500 }}>{m.telefono}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {m.especialidades.length === 0
                          ? <span style={{ color: '#94a3b8', fontSize: 12 }}>Sin asignar</span>
                          : m.especialidades.map(e => (
                            <span key={e.id_especialidad} style={{
                              background: '#f3e8ff',
                              color: '#7e22ce',
                              border: '1px solid #e9d5ff',
                              fontSize: 11.5,
                              padding: '3px 9px',
                              borderRadius: 8,
                              fontWeight: 600
                            }}>
                              {e.nombre}
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        {m.usuario?.nombre_usuario || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: m.usuario?.estado === 1 ? '#ecfdf5' : '#fef2f2',
                        color: m.usuario?.estado === 1 ? '#047857' : '#b91c1c',
                        border: `1px solid ${m.usuario?.estado === 1 ? '#a7f3d0' : '#fecaca'}`,
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.usuario?.estado === 1 ? '#10b981' : '#ef4444' }} />
                        {m.usuario?.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Ver detalle — admin y recepcionista */}
                        <button
                          onClick={() => navigate(`/medicos/${m.id_medico}`)}
                          style={{
                            color: '#0f766e',
                            backgroundColor: '#ccfbf1',
                            border: '1px solid #99f6e4',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0d9488'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ccfbf1'; e.currentTarget.style.color = '#0f766e'; }}
                        >
                          Ver Exp.
                        </button>

                        {/* Editar — solo admin */}
                        {puedeGestionar && (
                          <button
                            onClick={() => abrirModal(m)}
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
                        )}

                        {/* Activar/Desactivar — solo admin */}
                        {puedeGestionar && (
                          <button
                            onClick={() => cambiarEstado(m.id_medico)}
                            style={{
                              color: m.usuario?.estado === 1 ? '#be123c' : '#15803d',
                              backgroundColor: m.usuario?.estado === 1 ? '#ffe4e6' : '#dcfce7',
                              border: `1px solid ${m.usuario?.estado === 1 ? '#fecdd3' : '#bbf7d0'}`,
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                              if (m.usuario?.estado === 1) {
                                e.currentTarget.style.backgroundColor = '#e11d48'; e.currentTarget.style.color = '#ffffff';
                              } else {
                                e.currentTarget.style.backgroundColor = '#16a34a'; e.currentTarget.style.color = '#ffffff';
                              }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = m.usuario?.estado === 1 ? '#ffe4e6' : '#dcfce7';
                              e.currentTarget.style.color = m.usuario?.estado === 1 ? '#be123c' : '#15803d';
                            }}
                          >
                            {m.usuario?.estado === 1 ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar — solo visible para admin */}
      {modalAbierto && puedeGestionar && (
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
            maxWidth: 540,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {medicoEditando ? 'Editar Médico' : 'Nuevo Registro de Médico'}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                  {medicoEditando ? 'Actualiza los datos del profesional médico' : 'Ingresa los datos para registrar un médico y sus accesos'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>DPI / Identificación *</label>
                  <input
                    value={form.dpi}
                    onChange={e => setForm({ ...form, dpi: e.target.value })}
                    style={{
                      ...inputStyle,
                      background: medicoEditando ? '#f8fafc' : '#ffffff',
                      color: medicoEditando ? '#94a3b8' : '#0f172a',
                      cursor: medicoEditando ? 'not-allowed' : 'text'
                    }}
                    disabled={!!medicoEditando}
                    required={!medicoEditando}
                    placeholder="Ej. 1234567890101"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Fecha de nacimiento *</label>
                  <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} style={inputStyle} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} placeholder="Ej. Carlos" required />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Apellido *</label>
                  <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} style={inputStyle} placeholder="Ej. Gómez" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Teléfono *</label>
                  <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={inputStyle} placeholder="Ej. 55551234" required />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Correo electrónico</label>
                  <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} style={inputStyle} placeholder="doctor@dentacare.com" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Dirección domiciliar</label>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} style={inputStyle} placeholder="Ej. Zona 14, Guatemala" />
              </div>

              {/* Credenciales — solo al crear un nuevo médico */}
              {!medicoEditando && (
                <div style={{ borderTop: '1px solid #f1f5f9', margin: '18px 0', paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Credenciales de acceso al sistema</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Usuario *</label>
                      <input value={form.nombre_usuario} onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} style={inputStyle} required placeholder="dr.carlos" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Contraseña *</label>
                      <input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} style={inputStyle} required placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              )}

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

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
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
                    background: guardando ? '#93c5fd' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
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
                  {guardando ? 'Guardando...' : medicoEditando ? 'Guardar cambios' : 'Registrar médico'}
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

export default Medicos;