import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Medico, Especialidad, SlotDisponibilidad } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext';

const DIAS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' },
];

const DetalleMedico = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Control de roles ──────────────────────────────────────────
  const { usuario } = useAuth();
  const esAdmin = usuario?.nombre_rol === 'Administrador';
  const puedeGestionar = esAdmin;
  // ──────────────────────────────────────────────────────────────

  const [medico, setMedico] = useState<Medico | null>(null);
  const [todasEspecialidades, setTodasEspecialidades] = useState<Especialidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Disponibilidad
  const [fechaDisponibilidad, setFechaDisponibilidad] = useState('');
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState('');

  // Horario form
  const [horarioForm, setHorarioForm] = useState({ dia_semana: '1', hora_inicio: '', hora_fin: '' });
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  // Especialidades form
  const [espSeleccionadas, setEspSeleccionadas] = useState<number[]>([]);
  const [guardandoEsp, setGuardandoEsp] = useState(false);

  const cargar = async () => {
    try {
      const [resMedico, resEsp] = await Promise.all([
        api.get<Medico>(`/medicos/${id}`),
        api.get<Especialidad[]>('/medicos/especialidades'),
      ]);
      setMedico(resMedico.data);
      setTodasEspecialidades(resEsp.data);
      setEspSeleccionadas(resMedico.data.especialidades.map(e => e.id_especialidad));
    } catch {
      navigate('/medicos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  const consultarDisponibilidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoSlots(true);
    setSlots([]);
    setMensajeDisponibilidad('');
    try {
      const { data } = await api.get(`/medicos/${id}/disponibilidad`, { params: { fecha: fechaDisponibilidad } });
      if (!data.disponible) {
        setMensajeDisponibilidad(data.message || 'El médico no tiene horario asignado para este día');
      } else {
        setSlots(data.slots);
      }
    } catch {
      setMensajeDisponibilidad('Error al consultar disponibilidad');
    } finally {
      setCargandoSlots(false);
    }
  };

  const guardarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoHorario(true);
    setError('');
    try {
      await api.post(`/medicos/${id}/horarios`, {
        dia_semana: Number(horarioForm.dia_semana),
        hora_inicio: horarioForm.hora_inicio,
        hora_fin: horarioForm.hora_fin,
      });
      setHorarioForm({ dia_semana: '1', hora_inicio: '', hora_fin: '' });
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar horario');
    } finally {
      setGuardandoHorario(false);
    }
  };

  const eliminarHorario = async (idHorario: number) => {
    try {
      await api.delete(`/medicos/${id}/horarios/${idHorario}`);
      cargar();
    } catch {
      setError('Error al eliminar horario');
    }
  };

  const guardarEspecialidades = async () => {
    setGuardandoEsp(true);
    setError('');
    try {
      await api.post(`/medicos/${id}/especialidades`, { especialidades: espSeleccionadas });
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar especialidades');
    } finally {
      setGuardandoEsp(false);
    }
  };

  const toggleEsp = (idEsp: number) => {
    setEspSeleccionadas(prev =>
      prev.includes(idEsp) ? prev.filter(e => e !== idEsp) : [...prev, idEsp]
    );
  };

  const inputStyle: React.CSSProperties = {
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

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350, fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
        </svg>
        <span>Cargando expediente del médico...</span>
      </div>
    </div>
  );

  if (!medico) return null;

  const inicial = medico.nombre ? medico.nombre.charAt(0).toUpperCase() : 'M';

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif", paddingBottom: 32 }}>
      {/* Botón regresar */}
      <button
        onClick={() => navigate('/medicos')}
        style={{
          background: 'white',
          border: '1px solid #cbd5e1',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: '#475569',
          cursor: 'pointer',
          marginBottom: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.borderColor = '#94a3b8';
          e.currentTarget.style.color = '#0f172a';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.color = '#475569';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Volver a Médicos</span>
      </button>

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

      {/* Tarjeta Principal del Médico */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Cabecera del perfil médico */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #047857 0%, #0f6e56 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
            }}>
              {inicial}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Dr. {medico.nombre} {medico.apellido}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Ficha Médica #{medico.id_medico}</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: 6
                }}>
                  Usuario: {medico.usuario?.nombre_usuario || '—'}
                </span>
              </div>
            </div>
          </div>

          <span style={{
            background: medico.usuario?.estado === 1 ? '#ecfdf5' : '#fef2f2',
            color: medico.usuario?.estado === 1 ? '#047857' : '#b91c1c',
            border: `1px solid ${medico.usuario?.estado === 1 ? '#a7f3d0' : '#fecaca'}`,
            fontSize: 12.5,
            padding: '6px 14px',
            borderRadius: 20,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: medico.usuario?.estado === 1 ? '#10b981' : '#ef4444' }} />
            {medico.usuario?.estado === 1 ? 'Médico Activo' : 'Médico Inactivo'}
          </span>
        </div>

        {/* Grilla de Datos Profesionales y Personales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            {
              label: 'DPI / Identificación',
              valor: medico.dpi,
              iconBg: '#e0f2fe',
              iconColor: '#0284c7',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg>
            },
            {
              label: 'Teléfono de contacto',
              valor: medico.telefono,
              iconBg: '#ecfdf5',
              iconColor: '#047857',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            },
            {
              label: 'Correo electrónico',
              valor: medico.correo || 'No registrado',
              iconBg: '#f3e8ff',
              iconColor: '#7e22ce',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            },
            {
              label: 'Fecha de nacimiento',
              valor: formatearFecha(medico.fecha_nacimiento),
              iconBg: '#fff7ed',
              iconColor: '#c2410c',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            },
            {
              label: 'Dirección domiciliar',
              valor: medico.direccion || 'No registrada',
              iconBg: '#fef2f2',
              iconColor: '#b91c1c',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            },
            {
              label: 'Rol en el sistema',
              valor: medico.usuario?.rol?.nombre_rol || 'Médico',
              iconBg: '#f1f5f9',
              iconColor: '#475569',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: item.iconBg,
                color: item.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.valor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grilla Especialidades y Horarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>

        {/* Bloque Especialidades */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafbfc'
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Especialidades Médicas</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {medico.especialidades.length} asignadas
            </span>
          </div>
          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {puedeGestionar ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {todasEspecialidades.map(esp => {
                    const seleccionada = espSeleccionadas.includes(esp.id_especialidad);
                    return (
                      <button
                        key={esp.id_especialidad}
                        onClick={() => toggleEsp(esp.id_especialidad)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 10,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          border: '1px solid',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                          background: seleccionada ? '#f3e8ff' : '#ffffff',
                          color: seleccionada ? '#7e22ce' : '#64748b',
                          borderColor: seleccionada ? '#d8b4fe' : '#cbd5e1',
                          boxShadow: seleccionada ? '0 2px 6px rgba(126, 34, 206, 0.15)' : 'none'
                        }}
                      >
                        {seleccionada ? '✓ ' : '+ '}{esp.nombre}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={guardarEspecialidades}
                  disabled={guardandoEsp}
                  style={{
                    background: guardandoEsp ? '#93c5fd' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: guardandoEsp ? 'not-allowed' : 'pointer',
                    boxShadow: guardandoEsp ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)',
                    transition: 'all 0.2s ease',
                    width: 'fit-content'
                  }}
                >
                  {guardandoEsp ? 'Guardando...' : 'Guardar Especialidades'}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {medico.especialidades.length === 0 ? (
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Sin especialidades asignadas</span>
                ) : (
                  medico.especialidades.map(esp => (
                    <span
                      key={esp.id_especialidad}
                      style={{
                        background: '#f3e8ff',
                        color: '#7e22ce',
                        border: '1px solid #e9d5ff',
                        fontSize: 12.5,
                        padding: '6px 14px',
                        borderRadius: 10,
                        fontWeight: 600
                      }}
                    >
                      {esp.nombre}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bloque Horarios de Atención */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafbfc'
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Horarios de Atención</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {medico.horarios?.length || 0} turnos
            </span>
          </div>
          <div style={{ padding: '20px' }}>
            {puedeGestionar && (
              <form onSubmit={guardarHorario} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 8, marginBottom: 18, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Día Semana</label>
                  <select value={horarioForm.dia_semana} onChange={e => setHorarioForm({ ...horarioForm, dia_semana: e.target.value })} style={{ ...inputStyle, width: '100%', padding: '8px 10px' }}>
                    {DIAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Inicio</label>
                  <input type="time" value={horarioForm.hora_inicio} onChange={e => setHorarioForm({ ...horarioForm, hora_inicio: e.target.value })} style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Fin</label>
                  <input type="time" value={horarioForm.hora_fin} onChange={e => setHorarioForm({ ...horarioForm, hora_fin: e.target.value })} style={{ ...inputStyle, width: '100%', padding: '8px 10px' }} required />
                </div>
                <button
                  type="submit"
                  disabled={guardandoHorario}
                  style={{
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  + Agregar
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {medico.horarios?.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13, padding: '10px 0' }}>Sin horarios de atención asignados</div>
              ) : (
                medico.horarios?.map(h => (
                  <div
                    key={h.id_horario}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: 10,
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{h.dia_nombre}</span>
                      <span style={{
                        fontSize: 12,
                        color: '#0369a1',
                        backgroundColor: '#e0f2fe',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 600
                      }}>
                        {h.hora_inicio.slice(0, 5)} hrs — {h.hora_fin.slice(0, 5)} hrs
                      </span>
                    </div>
                    {puedeGestionar && (
                      <button
                        onClick={() => eliminarHorario(h.id_horario)}
                        style={{
                          color: '#be123c',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: '#ffe4e6',
                          border: '1px solid #fecdd3',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bloque Consultar Disponibilidad */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafbfc'
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Consultar Agenda & Disponibilidad</span>
        </div>
        <div style={{ padding: '20px' }}>
          <form onSubmit={consultarDisponibilidad} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Selecciona una fecha de consulta
              </label>
              <input
                type="date"
                value={fechaDisponibilidad}
                onChange={e => setFechaDisponibilidad(e.target.value)}
                style={{ ...inputStyle, width: 220 }}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button
              type="submit"
              disabled={cargandoSlots}
              style={{
                background: cargandoSlots ? '#94a3b8' : '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: cargandoSlots ? 'not-allowed' : 'pointer',
                boxShadow: cargandoSlots ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                transition: 'background 0.2s ease'
              }}
            >
              {cargandoSlots ? 'Consultando...' : 'Ver Disponibilidad'}
            </button>
          </form>

          {mensajeDisponibilidad && (
            <div style={{
              background: '#fff7ed',
              border: '1px solid #ffedd5',
              color: '#c2410c',
              fontSize: 13,
              fontWeight: 500,
              padding: '10px 14px',
              borderRadius: 10
            }}>
              {mensajeDisponibilidad}
            </div>
          )}

          {slots.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>Horarios de 30 minutos:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ color: '#166534', fontSize: 12 }}>Disponible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
                  <span style={{ color: '#991b1b', fontSize: 12 }}>Ocupado</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {slots.map(slot => (
                  <div
                    key={slot.hora}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: slot.disponible ? '#ecfdf5' : '#fef2f2',
                      color: slot.disponible ? '#047857' : '#b91c1c',
                      border: `1px solid ${slot.disponible ? '#a7f3d0' : '#fecaca'}`,
                    }}
                  >
                    {slot.hora} hrs
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DetalleMedico;