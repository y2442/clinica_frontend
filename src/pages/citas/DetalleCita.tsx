import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Cita, EstadoCita, Tratamiento, SlotDisponibilidad } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext';

const estadoColores: Record<string, { bg: string; color: string; border: string }> = {
  'Programada': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  'Completada': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  'Cancelada': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  'Reprogramada': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
};

const DetalleCita = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [cita, setCita] = useState<Cita | null>(null);
  const [estados, setEstados] = useState<EstadoCita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Modal cambiar estado
  const [modalEstado, setModalEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [obsEstado, setObsEstado] = useState('');

  // Modal reprogramar
  const [modalReprogramar, setModalReprogramar] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [obsReprogramar, setObsReprogramar] = useState('');
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  // Modal tratamientos
  const [modalTratamientos, setModalTratamientos] = useState(false);
  const [tratSeleccionados, setTratSeleccionados] = useState<{ id_tratamiento: number; observacion: string }[]>([]);

  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const [resCita, resEstados, resTrat] = await Promise.all([
        api.get<Cita>(`/citas/${id}`),
        api.get<EstadoCita[]>('/citas/estados'),
        api.get<Tratamiento[]>('/tratamientos'),
      ]);
      setCita(resCita.data);
      setEstados(resEstados.data);
      setTratamientos(resTrat.data);
      setTratSeleccionados(
        resCita.data.tratamientos?.map(t => ({
          id_tratamiento: t.id_tratamiento,
          observacion: t.citas_tratamientos?.observacion || '',
        })) || []
      );
    } catch {
      navigate('/citas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  const cargarSlots = async (fecha: string) => {
    if (!cita || !fecha) return;
    setCargandoSlots(true);
    setSlots([]);
    try {
      const { data } = await api.get(`/medicos/${cita.medico.id_medico}/disponibilidad`, { params: { fecha } });
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  };

  const cambiarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.patch(`/citas/${id}/estado`, { id_estado: Number(nuevoEstado), observaciones: obsEstado || undefined });
      setModalEstado(false);
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setGuardando(false);
    }
  };

  const reprogramar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put(`/citas/${id}/reprogramar`, {
        fecha_cita: nuevaFecha,
        hora_cita: nuevaHora + ':00',
        observaciones: obsReprogramar || undefined,
      });
      setModalReprogramar(false);
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reprogramar');
    } finally {
      setGuardando(false);
    }
  };

  const guardarTratamientos = async () => {
    setGuardando(true);
    setError('');
    try {
      await api.post(`/citas/${id}/tratamientos`, { tratamientos: tratSeleccionados });
      setModalTratamientos(false);
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar tratamientos');
    } finally {
      setGuardando(false);
    }
  };

  const toggleTratamiento = (idTrat: number) => {
    setTratSeleccionados(prev =>
      prev.find(t => t.id_tratamiento === idTrat)
        ? prev.filter(t => t.id_tratamiento !== idTrat)
        : [...prev, { id_tratamiento: idTrat, observacion: '' }]
    );
  };

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

  const esAdmin = usuario?.nombre_rol === 'Administrador';
  const esRecepcionista = usuario?.nombre_rol === 'Recepcionista';
  const esMedico = usuario?.nombre_rol === 'Médico';
  const puedeGestionar = esAdmin || esRecepcionista;
  const citaActiva = cita?.estado.nombre === 'Programada' || cita?.estado.nombre === 'Reprogramada';

  if (cargando) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 350, gap: 12 }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid #e2e8f0',
        borderTopColor: '#0ea5e9',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Cargando expediente de la cita...</div>
    </div>
  );

  if (!cita) return null;

  const colEst = estadoColores[cita.estado.nombre] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  const totalCostoTratamientos = cita.tratamientos?.reduce((sum, t) => sum + Number(t.costo), 0) || 0;

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Botón Volver */}
      <button
        onClick={() => navigate('/citas')}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          color: '#475569',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 14px',
          cursor: 'pointer',
          marginBottom: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s ease',
          boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.color = '#0f172a';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.color = '#475569';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Volver a Citas</span>
      </button>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: 13,
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Info Principal Card */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        {/* Header de Cita sin icono junto al título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                Detalle de Cita #{cita.id_cita}
              </h1>
              <span style={{
                background: colEst.bg,
                color: colEst.color,
                border: `1px solid ${colEst.border}`,
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 8,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colEst.color }} />
                {cita.estado.nombre}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
              Registrada en sistema por: <strong style={{ color: '#334155' }}>{cita.recepcionista?.nombre_usuario || 'Sistema'}</strong>
            </p>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {puedeGestionar && citaActiva && (
              <>
                <button
                  onClick={() => { setNuevoEstado(''); setObsEstado(''); setModalEstado(true); }}
                  style={{
                    background: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #ffedd5',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Cambiar estado</span>
                </button>

                <button
                  onClick={() => { setModalReprogramar(true); setNuevaFecha(''); setNuevaHora(''); setSlots([]); setObsReprogramar(''); }}
                  style={{
                    background: 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span>Reprogramar</span>
                </button>
              </>
            )}

            {(esAdmin || esMedico) && (
              <button
                onClick={() => setModalTratamientos(true)}
                style={{
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  border: '1px solid #ddd6fe',
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Asignar tratamientos</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid de Información Clave */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              label: 'Paciente',
              valor: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
              subvalor: 'Paciente de la clínica',
              iconBg: '#e0f2fe',
              iconColor: '#0284c7',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )
            },
            {
              label: 'Médico Asignado',
              valor: `Dr. ${cita.medico.nombre} ${cita.medico.apellido}`,
              subvalor: 'Médico tratante',
              iconBg: '#dcfce7',
              iconColor: '#059669',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V6h15V2.6a.3.3 0 0 0-.3-.3H4.8z" />
                  <path d="M12 6v12M8 18h8" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )
            },
            {
              label: 'Teléfono Paciente',
              valor: cita.paciente.telefono || 'Sin teléfono',
              subvalor: 'Contacto principal',
              iconBg: '#fef3c7',
              iconColor: '#d97706',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              )
            },
            {
              label: 'Fecha de Cita',
              valor: formatearFecha(cita.fecha_cita),
              subvalor: 'Programada',
              iconBg: '#f3e8ff',
              iconColor: '#7c3aed',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              )
            },
            {
              label: 'Hora de Cita',
              valor: `${cita.hora_cita.slice(0, 5)} hrs`,
              subvalor: 'Horario confirmado',
              iconBg: '#e0e7ff',
              iconColor: '#4338ca',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )
            },
            {
              label: 'Fecha de Registro',
              valor: formatearFecha(cita.fecha_registro),
              subvalor: 'Creación del expediente',
              iconBg: '#f1f5f9',
              iconColor: '#475569',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              )
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
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
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{item.valor}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.subvalor}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivo & Observaciones */}
        {(cita.motivo || cita.observaciones) && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {cita.motivo && (
              <div style={{
                padding: '14px 16px',
                background: '#f0f9ff',
                borderRadius: 12,
                borderLeft: '4px solid #0284c7'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>Motivo de la consulta</span>
                </div>
                <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.5 }}>{cita.motivo}</div>
              </div>
            )}
            {cita.observaciones && (
              <div style={{
                padding: '14px 16px',
                background: '#fcf5ff',
                borderRadius: 12,
                borderLeft: '4px solid #8b5cf6'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Observaciones registradas</span>
                </div>
                <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.5 }}>{cita.observaciones}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secciones de Tratamientos */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafbfc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Tratamientos Asignados</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#f3e8ff',
              color: '#6d28d9',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {cita.tratamientos?.length || 0} {cita.tratamientos?.length === 1 ? 'tratamiento' : 'tratamientos'}
            </span>
          </div>

          {(esAdmin || esMedico) && (
            <button
              onClick={() => setModalTratamientos(true)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              Gestionar Tratamientos
            </button>
          )}
        </div>

        {!cita.tratamientos?.length ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              color: '#94a3b8'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>No hay tratamientos vinculados a esta cita</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              {(esAdmin || esMedico) ? 'Haz clic en "Asignar tratamientos" para registrar procedimientos' : 'El médico tratante o administrador asignará los procedimientos'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Tratamiento</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Descripción</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Observaciones</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Costo</th>
                </tr>
              </thead>
              <tbody>
                {cita.tratamientos?.map(t => (
                  <tr key={t.id_tratamiento} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>{t.nombre}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>{t.descripcion || '—'}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>{t.citas_tratamientos?.observacion || '—'}</td>
                    <td style={{ padding: '14px 20px', color: '#047857', fontWeight: 700, textAlign: 'right', fontSize: 14 }}>
                      Q{Number(t.costo).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Fila total costo */}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '14px 20px', color: '#0f172a', textAlign: 'right', fontSize: 13.5 }}>
                    Total Estimado Tratamientos:
                  </td>
                  <td style={{ padding: '14px 20px', color: '#0284c7', fontSize: 16, textAlign: 'right' }}>
                    Q{totalCostoTratamientos.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cambiar Estado */}
      {modalEstado && (
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
            maxWidth: 420,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Cambiar Estado de Cita
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0 0' }}>
                  Selecciona el nuevo estado para actualizar la cita #{cita.id_cita}
                </p>
              </div>
              <button
                onClick={() => setModalEstado(false)}
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

            <form onSubmit={cambiarEstado}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nuevo Estado *
                </label>
                <select
                  value={nuevoEstado}
                  onChange={e => setNuevoEstado(e.target.value)}
                  style={inputStyle}
                  required
                >
                  <option value="">Selecciona un estado</option>
                  {estados.filter(e => e.nombre !== cita.estado.nombre).map(e => (
                    <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Observaciones <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span>
                </label>
                <textarea
                  value={obsEstado}
                  onChange={e => setObsEstado(e.target.value)}
                  style={{ ...inputStyle, minHeight: 75, resize: 'vertical' }}
                  placeholder="Detalles del cambio de estado..."
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalEstado(false)}
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
                  disabled={guardando || !nuevoEstado}
                  style={{
                    flex: 1,
                    background: guardando || !nuevoEstado ? '#cbd5e1' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: 11,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: guardando || !nuevoEstado ? 'not-allowed' : 'pointer',
                    boxShadow: guardando || !nuevoEstado ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {guardando ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reprogramar */}
      {modalReprogramar && (
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
            maxWidth: 480,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Reprogramar Cita #{cita.id_cita}
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0 0' }}>
                  Selecciona la nueva fecha y hora para el Dr. {cita.medico.nombre} {cita.medico.apellido}
                </p>
              </div>
              <button
                onClick={() => setModalReprogramar(false)}
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

            <form onSubmit={reprogramar}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nueva Fecha *
                </label>
                <input
                  type="date"
                  value={nuevaFecha}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setNuevaFecha(e.target.value);
                    setNuevaHora('');
                    cargarSlots(e.target.value);
                  }}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nueva Hora * {cargandoSlots && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(cargando...)</span>}
                </label>
                {slots.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.filter(s => s.disponible).map(slot => {
                      const seleccionado = nuevaHora === slot.hora;
                      return (
                        <button
                          key={slot.hora}
                          type="button"
                          onClick={() => setNuevaHora(slot.hora)}
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
                  <div style={{ color: '#94a3b8', fontSize: 13, padding: '6px 0' }}>
                    {nuevaFecha ? 'No hay horarios disponibles para esta fecha' : 'Selecciona una fecha para ver horarios'}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Motivo de reprogramación <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span>
                </label>
                <textarea
                  value={obsReprogramar}
                  onChange={e => setObsReprogramar(e.target.value)}
                  style={{ ...inputStyle, minHeight: 65, resize: 'vertical' }}
                  placeholder="Motivo o cambios solicitados por el paciente..."
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalReprogramar(false)}
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
                  disabled={guardando || !nuevaHora}
                  style={{
                    flex: 1,
                    background: guardando || !nuevaHora ? '#cbd5e1' : 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: 11,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: guardando || !nuevaHora ? 'not-allowed' : 'pointer',
                    boxShadow: guardando || !nuevaHora ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {guardando ? 'Reprogramando...' : 'Confirmar reprogramación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Tratamientos */}
      {modalTratamientos && (
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
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            animation: 'modalSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Asignar Tratamientos a la Cita
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0 0' }}>
                  Selecciona los procedimientos médicos realizados en la cita #{cita.id_cita}
                </p>
              </div>
              <button
                onClick={() => setModalTratamientos(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {tratamientos.map(t => {
                const seleccionado = tratSeleccionados.find(ts => ts.id_tratamiento === t.id_tratamiento);
                return (
                  <div
                    key={t.id_tratamiento}
                    style={{
                      border: `1.5px solid ${seleccionado ? '#7c3aed' : '#e2e8f0'}`,
                      background: seleccionado ? '#faf5ff' : '#ffffff',
                      borderRadius: 12,
                      padding: '12px 16px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: seleccionado ? 10 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{t.nombre}</div>
                        <div style={{ fontSize: 12.5, color: '#047857', fontWeight: 600, marginTop: 2 }}>Q{Number(t.costo).toFixed(2)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTratamiento(t.id_tratamiento)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid',
                          transition: 'all 0.15s ease',
                          background: seleccionado ? '#7c3aed' : '#ffffff',
                          color: seleccionado ? '#ffffff' : '#475569',
                          borderColor: seleccionado ? '#7c3aed' : '#cbd5e1'
                        }}
                      >
                        {seleccionado ? '✓ Seleccionado' : 'Agregar'}
                      </button>
                    </div>

                    {seleccionado && (
                      <input
                        placeholder="Observación técnica o detalles del tratamiento..."
                        value={seleccionado.observacion}
                        onChange={e => setTratSeleccionados(prev =>
                          prev.map(ts => ts.id_tratamiento === t.id_tratamiento ? { ...ts, observacion: e.target.value } : ts)
                        )}
                        style={{ ...inputStyle, fontSize: 12.5, padding: '7px 11px', marginTop: 4 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setModalTratamientos(false)}
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
                onClick={guardarTratamientos}
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
                {guardando ? 'Guardando...' : 'Guardar tratamientos'}
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

export default DetalleCita;