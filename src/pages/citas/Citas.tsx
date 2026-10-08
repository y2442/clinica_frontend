import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Cita, Medico, EstadoCita, Paciente, SlotDisponibilidad } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext';

const estadoColores: Record<string, { bg: string; color: string; border: string }> = {
  'Programada': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  'Completada': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  'Cancelada': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  'Reprogramada': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
};

const Citas = () => {
  const navigate = useNavigate();

  // ── Control de roles ──────────────────────────────────────────
  const { usuario } = useAuth();
  const esMedico = usuario?.nombre_rol === 'Médico';
  const puedeAgendar = usuario?.nombre_rol === 'Administrador' || usuario?.nombre_rol === 'Recepcionista';
  // ──────────────────────────────────────────────────────────────

  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [estados, setEstados] = useState<EstadoCita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal agendar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  const formInicial = {
    id_paciente: '', id_medico: '', fecha_cita: '',
    hora_cita: '', motivo: '', observaciones: '',
  };
  const [form, setForm] = useState(formInicial);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params: any = {};
      if (filtroFecha) params.fecha = filtroFecha;
      if (filtroMedico) params.id_medico = filtroMedico;
      if (filtroEstado) params.id_estado = filtroEstado;
      if (busqueda) params.busqueda = busqueda;

      const [resCitas, resHoy, resMedicos, resEstados, resPacientes] = await Promise.all([
        api.get<Cita[]>('/citas', { params }),
        api.get<Cita[]>('/citas/hoy'),
        api.get<Medico[]>('/medicos?estado=1'),
        api.get<EstadoCita[]>('/citas/estados'),
        api.get<Paciente[]>('/pacientes?estado=1'),
      ]);

      let medicosData = resMedicos.data;
      let citasData = resCitas.data;
      let citasHoyData = resHoy.data;

      if (esMedico) {
        const medicoLogueado = medicosData.find(m => m.id_usuario === usuario?.id_usuario);
        if (medicoLogueado) {
          citasData = citasData.filter(c => c.medico.id_medico === medicoLogueado.id_medico);
          citasHoyData = citasHoyData.filter(c => c.medico.id_medico === medicoLogueado.id_medico);
        }
      }

      setCitas(citasData);
      setCitasHoy(citasHoyData);
      setMedicos(medicosData);
      setEstados(resEstados.data);
      setPacientes(resPacientes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [filtroFecha, filtroMedico, filtroEstado]);

  const buscar = (e: React.FormEvent) => { e.preventDefault(); cargarDatos(); };

  // Cargar slots cuando cambia médico o fecha
  const cargarSlots = async (idMedico: string, fecha: string) => {
    if (!idMedico || !fecha) return;
    setCargandoSlots(true);
    setSlots([]);
    try {
      const { data } = await api.get(`/medicos/${idMedico}/disponibilidad`, { params: { fecha } });
      setSlots(data.slots || []);
      if (!data.disponible) setError(data.message || 'El médico no tiene horario ese día');
      else setError('');
    } catch {
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  };

  const handleMedicoFechaChange = (nuevoMedico: string, nuevaFecha: string) => {
    setForm(prev => ({ ...prev, hora_cita: '' }));
    cargarSlots(nuevoMedico, nuevaFecha);
  };

  const abrirModal = () => {
    setForm(formInicial);
    setSlots([]);
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setError(''); setSlots([]); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await api.post('/citas', {
        id_paciente: Number(form.id_paciente),
        id_medico: Number(form.id_medico),
        fecha_cita: form.fecha_cita,
        hora_cita: form.hora_cita + ':00',
        motivo: form.motivo || null,
        observaciones: form.observaciones || null,
      });
      cerrarModal();
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agendar cita');
    } finally {
      setGuardando(false);
    }
  };

  const programadas = citas.filter(c => c.estado.nombre === 'Programada').length;
  const completadas = citas.filter(c => c.estado.nombre === 'Completada').length;
  const canceladas = citas.filter(c => c.estado.nombre === 'Cancelada').length;

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
            Citas
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Gestión y programación de citas médicas de la clínica
          </p>
        </div>
        {puedeAgendar && (
          <button
            onClick={abrirModal}
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
            <span>Agendar cita</span>
          </button>
        )}
      </div>

      {/* Alerta Citas de Hoy */}
      {citasHoy.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: 16,
          padding: '18px 22px',
          marginBottom: 24,
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.08)'
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Citas Programadas para Hoy — {citasHoy.length} {citasHoy.length === 1 ? 'cita' : 'citas'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {citasHoy.map(c => {
              const colEst = estadoColores[c.estado.nombre] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
              return (
                <div
                  key={c.id_cita}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => navigate(`/citas/${c.id_cita}`)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0284c7',
                      backgroundColor: '#e0f2fe',
                      padding: '4px 10px',
                      borderRadius: 8
                    }}>
                      {c.hora_cita.slice(0, 5)} hrs
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.paciente.nombre} {c.paciente.apellido}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Atiende: Dr. {c.medico.nombre} {c.medico.apellido}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{c.motivo || 'Consulta general'}</span>
                    <span style={{
                      background: colEst.bg,
                      color: colEst.color,
                      border: `1px solid ${colEst.border}`,
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 8,
                      fontWeight: 600
                    }}>
                      {c.estado.nombre}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tarjetas resumen KPI Unificadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total citas',
            valor: citas.length,
            color: '#0f172a',
            iconBg: '#e2e8f0',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            ),
          },
          {
            label: 'Programadas',
            valor: programadas,
            color: '#0369a1',
            iconBg: '#e0f2fe',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M8 14h.01M12 14h.01M16 14h.01" />
              </svg>
            ),
          },
          {
            label: 'Completadas',
            valor: completadas,
            color: '#047857',
            iconBg: '#dcfce7',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            ),
          },
          {
            label: 'Canceladas',
            valor: canceladas,
            color: '#b91c1c',
            iconBg: '#fee2e2',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filtros y tabla */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Toolbar de filtros */}
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
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Directorio de Citas</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {citas.length} citas
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              style={{ ...inputStyle, width: 'auto', padding: '8px 12px' }}
            />
            {!esMedico && (
              <select
                value={filtroMedico}
                onChange={e => setFiltroMedico(e.target.value)}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px' }}
              >
                <option value="">Todos los médicos</option>
                {medicos.map(m => <option key={m.id_medico} value={m.id_medico}>Dr. {m.nombre} {m.apellido}</option>)}
              </select>
            )}
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              style={{ ...inputStyle, width: 'auto', padding: '8px 12px' }}
            >
              <option value="">Todos los estados</option>
              {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
            </select>
            <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Buscar paciente..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{ ...inputStyle, width: 180, paddingLeft: 34, padding: '8px 12px 8px 34px' }}
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
        </div>

        {/* Tabla de citas */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Paciente', 'Médico Asignado', 'Fecha Cita', 'Hora', 'Motivo', 'Estado', 'Acciones'].map((h, index) => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: index === 7 ? 'right' : 'left',
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
                  <td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#0ea5e9',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Cargando citas...</span>
                    </div>
                  </td>
                </tr>
              ) : citas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>No se encontraron citas</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Intenta ajustar tus filtros o búsqueda</div>
                  </td>
                </tr>
              ) : citas.map(c => {
                const colEst = estadoColores[c.estado.nombre] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
                return (
                  <tr
                    key={c.id_cita}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 500 }}>#{c.id_cita}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.paciente.nombre} {c.paciente.apellido}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.paciente.telefono}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 600 }}>
                      Dr. {c.medico.nombre} {c.medico.apellido}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 500 }}>
                      {formatearFecha(c.fecha_cita)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#0369a1',
                        backgroundColor: '#e0f2fe',
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        {c.hora_cita.slice(0, 5)} hrs
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>{c.motivo || '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: colEst.bg,
                        color: colEst.color,
                        border: `1px solid ${colEst.border}`,
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}>
                        {c.estado.nombre}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/citas/${c.id_cita}`)}
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
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agendar Cita */}
      {modalAbierto && puedeAgendar && (
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
            maxWidth: 560,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Agendar Nueva Cita Médica
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                  Selecciona el paciente, médico y horario disponible para programar la consulta
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
              {/* Paciente */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Paciente *
                </label>
                <select
                  value={form.id_paciente}
                  onChange={e => setForm({ ...form, id_paciente: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Selecciona un paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido} — DPI: {p.dpi}</option>
                  ))}
                </select>
              </div>

              {/* Médico y fecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Médico Asignado *</label>
                  <select
                    value={form.id_medico}
                    onChange={e => {
                      setForm({ ...form, id_medico: e.target.value, hora_cita: '' });
                      handleMedicoFechaChange(e.target.value, form.fecha_cita);
                    }}
                    style={inputStyle}
                    required
                  >
                    <option value="">Selecciona un médico</option>
                    {medicos.map(m => (
                      <option key={m.id_medico} value={m.id_medico}>Dr. {m.nombre} {m.apellido}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Fecha de Cita *</label>
                  <input
                    type="date"
                    value={form.fecha_cita}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      setForm({ ...form, fecha_cita: e.target.value, hora_cita: '' });
                      handleMedicoFechaChange(form.id_medico, e.target.value);
                    }}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              {/* Slots de hora */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Horario Disponible * {cargandoSlots && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(cargando horarios...)</span>}
                </label>
                {slots.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.filter(s => s.disponible).map(slot => {
                      const seleccionado = form.hora_cita === slot.hora;
                      return (
                        <button
                          key={slot.hora}
                          type="button"
                          onClick={() => setForm({ ...form, hora_cita: slot.hora })}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '1px solid',
                            transition: 'all 0.15s ease',
                            background: seleccionado ? 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)' : '#ffffff',
                            color: seleccionado ? 'white' : '#0369a1',
                            borderColor: seleccionado ? '#0284c7' : '#bae6fd',
                            boxShadow: seleccionado ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                          }}
                        >
                          {slot.hora} hrs
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 13, padding: '8px 0' }}>
                    {form.id_medico && form.fecha_cita ? 'No hay horarios disponibles para la fecha elegida' : 'Selecciona médico y fecha para visualizar horarios'}
                  </div>
                )}
                {form.hora_cita && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    Hora seleccionada: {form.hora_cita} hrs
                  </div>
                )}
              </div>

              {/* Motivo y observaciones */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Motivo de Consulta <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span>
                </label>
                <input
                  value={form.motivo}
                  onChange={e => setForm({ ...form, motivo: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej. Limpieza dental, revisión de cordales..."
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Observaciones adicionales <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span>
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  placeholder="Notas adicionales para el expediente..."
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
                  disabled={guardando || !form.hora_cita}
                  style={{
                    flex: 1,
                    background: guardando || !form.hora_cita ? '#93c5fd' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: 11,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: guardando || !form.hora_cita ? 'not-allowed' : 'pointer',
                    boxShadow: guardando || !form.hora_cita ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {guardando ? 'Agendando...' : 'Agendar cita'}
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

export default Citas;