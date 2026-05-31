import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Paciente, CitaHistorial } from '../../types';
import { formatearFecha } from '../../utils/fecha';

const estadoColores: Record<string, { bg: string; color: string }> = {
  'Programada': { bg: '#e6f1fb', color: '#185fa5' },
  'Completada': { bg: '#eaf3de', color: '#3b6d11' },
  'Cancelada': { bg: '#fcebeb', color: '#a32d2d' },
  'Reprogramada': { bg: '#faeeda', color: '#854f0b' },
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>Cargando...</div>
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

  return (
    <div>
      {/* Botón regresar */}
      <button
        onClick={() => navigate('/pacientes')}
        style={{ background: 'none', border: 'none', color: '#185fa5', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
      >
        ← Volver a pacientes
      </button>

      {/* Tarjeta de información */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: '1.5rem', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e6f1fb', color: '#185fa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, flexShrink: 0 }}>
            {paciente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0a2540' }}>{paciente.nombre} {paciente.apellido}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>DPI: {paciente.dpi}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ background: paciente.estado === 1 ? '#eaf3de' : '#fcebeb', color: paciente.estado === 1 ? '#3b6d11' : '#a32d2d', fontSize: 12, padding: '4px 12px', borderRadius: 10, fontWeight: 500 }}>
              {paciente.estado === 1 ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Teléfono', valor: paciente.telefono, icon: 'ti-phone', color: '#0f6e56' },
            { label: 'Correo', valor: paciente.correo || '—', icon: 'ti-mail', color: '#534ab7' },
            { label: 'Edad', valor: `${calcularEdad(paciente.fecha_nacimiento)} años`, icon: 'ti-user', color: '#185fa5' },
            { label: 'Fecha de nacimiento', valor: formatearFecha(paciente.fecha_nacimiento), icon: 'ti-calendar', color: '#854f0b' },
            { label: 'Dirección', valor: paciente.direccion || '—', icon: 'ti-map-pin', color: '#993c1d' },
            { label: 'Fecha de registro', valor: formatearFecha(paciente.fecha_registro), icon: 'ti-calendar-plus', color: '#185fa5' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 13, color: item.color }} aria-hidden="true" /> {item.label}
              </div>
              <div style={{ fontSize: 14, color: '#0a2540', fontWeight: 500 }}>{item.valor}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de citas */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0a2540' }}>Historial de citas</div>
          <span style={{ background: '#e6f1fb', color: '#185fa5', fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
            {citas.length} cita{citas.length !== 1 ? 's' : ''}
          </span>
        </div>

        {citas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            Este paciente no tiene citas registradas
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Fecha', 'Hora', 'Médico', 'Motivo', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 500, borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citas.map(c => {
                const colorEstado = estadoColores[c.estado.nombre] || { bg: '#f3f4f6', color: '#374151' };
                return (
                  <tr
                    key={c.id_cita}
                    style={{ borderBottom: '0.5px solid #e5e7eb', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px', color: '#0a2540', fontWeight: 500 }}>{formatearFecha(c.fecha_cita)}</td>
                    <td style={{ padding: '11px 16px', color: '#6b7280' }}>{c.hora_cita}</td>
                    <td style={{ padding: '11px 16px', color: '#6b7280' }}>Dr. {c.medico.nombre} {c.medico.apellido}</td>
                    <td style={{ padding: '11px 16px', color: '#6b7280' }}>{c.motivo || '—'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ background: colorEstado.bg, color: colorEstado.color, fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 500 }}>
                        {c.estado.nombre}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div> 
  );
};

export default DetallePaciente;