import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Paciente } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext';

const Pacientes = () => {
  const navigate = useNavigate();

  // ── Control de roles ──────────────────────────────────────────
  const { usuario } = useAuth();
  const esAdmin = usuario?.nombre_rol === 'Administrador';
  const esRecepcionista = usuario?.nombre_rol === 'Recepcionista';
  const puedeRegistrarEditar = esAdmin || esRecepcionista;
  const puedeActivarDesactivar = esAdmin;
  // ──────────────────────────────────────────────────────────────

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<Paciente | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const formInicial = { dpi: '', nombre: '', apellido: '', telefono: '', correo: '', direccion: '', fecha_nacimiento: '' };
  const [form, setForm] = useState(formInicial);

  const cargarPacientes = async () => {
    setCargando(true);
    try {
      const params: any = {};
      if (filtroEstado !== '') params.estado = filtroEstado;
      if (busqueda !== '') params.busqueda = busqueda;
      const { data } = await api.get<Paciente[]>('/pacientes', { params });
      setPacientes(data);
    } catch {
      setError('Error al cargar pacientes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPacientes(); }, [filtroEstado]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarPacientes();
  };

  const abrirModal = (paciente?: Paciente) => {
    if (paciente) {
      setPacienteEditando(paciente);
      setForm({
        dpi: paciente.dpi,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        telefono: paciente.telefono,
        correo: paciente.correo || '',
        direccion: paciente.direccion || '',
        fecha_nacimiento: paciente.fecha_nacimiento.split('T')[0],
      });
    } else {
      setPacienteEditando(null);
      setForm(formInicial);
    }
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setPacienteEditando(null); setError(''); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (pacienteEditando) {
        await api.put(`/pacientes/${pacienteEditando.id_paciente}`, {
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          correo: form.correo || null,
          direccion: form.direccion || null,
          fecha_nacimiento: form.fecha_nacimiento,
        });
      } else {
        await api.post('/pacientes', form);
      }
      cerrarModal();
      cargarPacientes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: number) => {
    try {
      await api.patch(`/pacientes/${id}/estado`);
      cargarPacientes();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const activos = pacientes.filter(p => p.estado === 1).length;
  const inactivos = pacientes.filter(p => p.estado === 0).length;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif", minHeight: '100%', padding: '4px 0 24px 0' }}>
      {/* Encabezado sin icono a la par del título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Pacientes
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Gestión integral de expedientes y directorio médico de la clínica
          </p>
        </div>

        {/* Botón nuevo paciente — solo admin y recepcionista */}
        {puedeRegistrarEditar && (
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
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
            <span>Nuevo Paciente</span>
          </button>
        )}
      </div>

      {/* Tarjetas de resumen estatístico */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Pacientes',
            valor: pacientes.length,
            color: '#0284c7',
            iconBg: '#e0f2fe',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            )
          },
          {
            label: 'Pacientes Activos',
            valor: activos,
            color: '#047857',
            iconBg: '#dcfce7',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )
          },
          {
            label: 'Pacientes Inactivos',
            valor: inactivos,
            color: '#b91c1c',
            iconBg: '#fee2e2',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.07)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.03)';
            }}
          >
            <div>
              <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {stat.valor}
              </div>
            </div>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: stat.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
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
          fontSize: '14px',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Contenedor Principal de Lista y Filtros */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Barra superior con Buscador y Filtro */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          backgroundColor: '#fafbfc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Directorio de Pacientes</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '3px 10px',
              borderRadius: '20px'
            }}>
              {pacientes.length} registros
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filtro por estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Estado:</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <option value="">Todos los estados</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
            </div>

            {/* Buscador */}
            <form onSubmit={buscar} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Buscar por DPI, nombre o apellido..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: '260px',
                    paddingLeft: '38px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    borderColor: '#e2e8f0'
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
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
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
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

        {/* Tabla de Pacientes */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Paciente', 'DPI / Documento', 'Teléfono', 'Fecha Nacimiento', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#0ea5e9',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>Cargando directorio de pacientes...</span>
                    </div>
                  </td>
                </tr>
              ) : pacientes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>No se encontraron pacientes</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Intenta ajustar tus filtros o términos de búsqueda</div>
                  </td>
                </tr>
              ) : pacientes.map((p) => {
                const inicial = p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P';
                return (
                  <tr
                    key={p.id_paciente}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>
                      #{p.id_paciente}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 3px 8px rgba(14, 165, 233, 0.25)'
                        }}>
                          {inicial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                            {p.nombre} {p.apellido}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {p.correo || 'Sin correo registrado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}>
                        {p.dpi}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155', fontWeight: 500 }}>
                      {p.telefono}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px' }}>
                      {formatearFecha(p.fecha_nacimiento)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: p.estado === 1 ? '#f0fdf4' : '#fff1f2',
                        color: p.estado === 1 ? '#166534' : '#991b1b',
                        border: `1px solid ${p.estado === 1 ? '#bbf7d0' : '#fecaca'}`,
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: 600
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: p.estado === 1 ? '#22c55e' : '#f43f5e'
                        }} />
                        {p.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Botón Ver detalle */}
                        <button
                          onClick={() => navigate(`/pacientes/${p.id_paciente}`)}
                          style={{
                            color: '#0f766e',
                            backgroundColor: '#ccfbf1',
                            border: '1px solid #99f6e4',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#0d9488';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#ccfbf1';
                            e.currentTarget.style.color = '#0f766e';
                          }}
                        >
                          Ver Exp.
                        </button>

                        {/* Botón Editar — solo admin y recepcionista */}
                        {puedeRegistrarEditar && (
                          <button
                            onClick={() => abrirModal(p)}
                            style={{
                              color: '#0369a1',
                              backgroundColor: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#0284c7';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#e0f2fe';
                              e.currentTarget.style.color = '#0369a1';
                            }}
                          >
                            Editar
                          </button>
                        )}

                        {/* Botón Activar / Desactivar — solo admin */}
                        {puedeActivarDesactivar && (
                          <button
                            onClick={() => cambiarEstado(p.id_paciente)}
                            style={{
                              color: p.estado === 1 ? '#be123c' : '#15803d',
                              backgroundColor: p.estado === 1 ? '#ffe4e6' : '#dcfce7',
                              border: `1px solid ${p.estado === 1 ? '#fecdd3' : '#bbf7d0'}`,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              if (p.estado === 1) {
                                e.currentTarget.style.backgroundColor = '#e11d48';
                                e.currentTarget.style.color = '#ffffff';
                              } else {
                                e.currentTarget.style.backgroundColor = '#16a34a';
                                e.currentTarget.style.color = '#ffffff';
                              }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = p.estado === 1 ? '#ffe4e6' : '#dcfce7';
                              e.currentTarget.style.color = p.estado === 1 ? '#be123c' : '#15803d';
                            }}
                          >
                            {p.estado === 1 ? 'Desactivar' : 'Activar'}
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

      {/* Modal Crear / Editar Paciente con Glassmorphism */}
      {modalAbierto && puedeRegistrarEditar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #f1f5f9'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {pacienteEditando ? 'Editar Paciente' : 'Nuevo Registro de Paciente'}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {pacienteEditando ? 'Actualiza los datos del paciente seleccionado' : 'Ingresa la información para registrar un nuevo expediente'}
                </p>
              </div>
              <button
                onClick={cerrarModal}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardar}>
              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    DPI / Identificación *
                  </label>
                  <input
                    value={form.dpi}
                    onChange={e => setForm({ ...form, dpi: e.target.value })}
                    style={{
                      ...inputStyle,
                      background: pacienteEditando ? '#f8fafc' : '#ffffff',
                      color: pacienteEditando ? '#94a3b8' : '#0f172a',
                      cursor: pacienteEditando ? 'not-allowed' : 'text'
                    }}
                    required={!pacienteEditando}
                    disabled={!!pacienteEditando}
                    placeholder="Ej. 1234567890101"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Fecha Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={form.fecha_nacimiento}
                    onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Nombre *
                  </label>
                  <input
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    style={inputStyle}
                    placeholder="Ej. María"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Apellido *
                  </label>
                  <input
                    value={form.apellido}
                    onChange={e => setForm({ ...form, apellido: e.target.value })}
                    style={inputStyle}
                    placeholder="Ej. Morales"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Teléfono *
                  </label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    style={inputStyle}
                    placeholder="Ej. 55554444"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={e => setForm({ ...form, correo: e.target.value })}
                    style={inputStyle}
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Dirección Domiciliar
                </label>
                <input
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej. Zona 10, Ciudad de Guatemala"
                />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '13px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '18px'
                }}>
                  {error}
                </div>
              )}

              {/* Acciones Modal */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    flex: 1,
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#475569',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    flex: 1,
                    background: guardando ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    boxShadow: guardando ? 'none' : '0 4px 14px rgba(14, 165, 233, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!guardando) e.currentTarget.style.boxShadow = '0 6px 18px rgba(14, 165, 233, 0.45)';
                  }}
                  onMouseLeave={e => {
                    if (!guardando) e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.35)';
                  }}
                >
                  {guardando ? 'Guardando...' : pacienteEditando ? 'Guardar Cambios' : 'Registrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacientes;
