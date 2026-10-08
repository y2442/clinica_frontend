import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Paciente, CitaHistorial } from '../../types';
import { formatearFecha } from '../../utils/fecha';

const estadoColores: Record<string, { bg: string; color: string; border: string }> = {
  'Programada': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  'Completada': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  'Cancelada': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  'Reprogramada': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
};

const DetallePaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [citas, setCitas] = useState<CitaHistorial[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get(`/pacientes/${id}`);
        setPaciente(data.paciente);
        setCitas(data.citas);
      } catch {
        navigate('/pacientes');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350, fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
        </svg>
        <span>Cargando expediente del paciente...</span>
      </div>
    </div>
  );

  if (!paciente) return null;

  const calcularEdad = (fechaNac: string) => {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const inicial = paciente.nombre ? paciente.nombre.charAt(0).toUpperCase() : 'P';

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif", paddingBottom: 32 }}>
      {/* Botón regresar */}
      <button
        onClick={() => navigate('/pacientes')}
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
        <span>Volver a Pacientes</span>
      </button>

      {/* Tarjeta Principal del Paciente */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Cabecera del expediente */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #185fa5 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}>
              {inicial}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {paciente.nombre} {paciente.apellido}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Expediente #{paciente.id_paciente}</span>
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
                  DPI: {paciente.dpi}
                </span>
              </div>
            </div>
          </div>

          <span style={{
            background: paciente.estado === 1 ? '#ecfdf5' : '#fef2f2',
            color: paciente.estado === 1 ? '#047857' : '#b91c1c',
            border: `1px solid ${paciente.estado === 1 ? '#a7f3d0' : '#fecaca'}`,
            fontSize: 12.5,
            padding: '6px 14px',
            borderRadius: 20,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: paciente.estado === 1 ? '#10b981' : '#ef4444' }} />
            {paciente.estado === 1 ? 'Paciente Activo' : 'Paciente Inactivo'}
          </span>
        </div>

        {/* Grilla de Datos de Contacto e Información Personal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            {
              label: 'Teléfono de contacto',
              valor: paciente.telefono,
              iconBg: '#e0f2fe',
              iconColor: '#0284c7',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            },
            {
              label: 'Correo electrónico',
              valor: paciente.correo || 'No registrado',
              iconBg: '#f3e8ff',
              iconColor: '#7e22ce',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            },
            {
              label: 'Edad actual',
              valor: `${calcularEdad(paciente.fecha_nacimiento)} años`,
              iconBg: '#ecfdf5',
              iconColor: '#047857',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            },
            {
              label: 'Fecha de nacimiento',
              valor: formatearFecha(paciente.fecha_nacimiento),
              iconBg: '#fff7ed',
              iconColor: '#c2410c',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            },
            {
              label: 'Dirección domiciliar',
              valor: paciente.direccion || 'No registrada',
              iconBg: '#fef2f2',
              iconColor: '#b91c1c',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            },
            {
              label: 'Fecha de registro',
              valor: formatearFecha(paciente.fecha_registro),
              iconBg: '#f1f5f9',
              iconColor: '#475569',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
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

      {/* Historial de Citas Médicas */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Encabezado de la lista de citas */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafbfc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Historial de Citas Médicas</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 10px',
              borderRadius: 20
            }}>
              {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>
        </div>

        {citas.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: 10 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>Sin historial de citas</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Este paciente no posee citas registradas en el sistema</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Fecha Cita', 'Hora', 'Médico Asignado', 'Motivo de Consulta', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citas.map(c => {
                  const colorEstado = estadoColores[c.estado.nombre] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
                  return (
                    <tr
                      key={c.id_cita}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 600 }}>
                        {formatearFecha(c.fecha_cita)}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 500 }}>
                        {c.hora_cita}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 600 }}>
                        Dr. {c.medico.nombre} {c.medico.apellido}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {c.motivo || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: colorEstado.bg,
                          color: colorEstado.color,
                          border: `1px solid ${colorEstado.border}`,
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

export default DetallePaciente;