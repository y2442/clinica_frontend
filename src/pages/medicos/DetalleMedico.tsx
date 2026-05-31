import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Medico, Especialidad, SlotDisponibilidad } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext'; // Control de roles

const DIAS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' },
];

const DetalleMedico = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Control de roles ──────────────────────────────────────────
  //se obtiene el usuario autenticado para verificar su rol
  const { usuario } = useAuth();
  const esAdmin = usuario?.nombre_rol === 'Administrador';
  //solo el admin puede gestionar especialidades y horarios
  //la recepcionista solo puede ver info y consultar disponibilidad
  const puedeGestionar = esAdmin;
  // ──────────────────────────────────────────────────────────────

  const [medico, setMedico] = useState<Medico | null>(null);
  const [todasEspecialidades, setTodasEspecialidades] = useState<Especialidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  //disponibilidad
  const [fechaDisponibilidad, setFechaDisponibilidad] = useState('');
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState('');

  //horario form
  const [horarioForm, setHorarioForm] = useState({ dia_semana: '1', hora_inicio: '', hora_fin: '' });
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  //especialidades form
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
        setMensajeDisponibilidad(data.message || 'El médico no trabaja ese día');
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
    } catch {
      setError('Error al guardar especialidades');
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
    border: '0.5px solid #d1d5db', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, outline: 'none',
  };

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>Cargando...</div>
    </div>
  );

  if (!medico) return null;

  return (
    <div>
      <button onClick={() => navigate('/medicos')}
        style={{ background: 'none', border: 'none', color: '#185fa5', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
      >← Volver a médicos</button>

      {error && <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}

      {/* Info del médico — visible para todos */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: '1.5rem', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e1f5ee', color: '#0f6e56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500 }}>
            {medico.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0a2540' }}>Dr. {medico.nombre} {medico.apellido}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Usuario: {medico.usuario?.nombre_usuario}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ background: medico.usuario?.estado === 1 ? '#eaf3de' : '#fcebeb', color: medico.usuario?.estado === 1 ? '#3b6d11' : '#a32d2d', fontSize: 12, padding: '4px 12px', borderRadius: 10, fontWeight: 500 }}>
              {medico.usuario?.estado === 1 ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'DPI', valor: medico.dpi, icon: 'ti-id-badge', color: '#185fa5' },
            { label: 'Teléfono', valor: medico.telefono, icon: 'ti-phone', color: '#0f6e56' },
            { label: 'Correo', valor: medico.correo || '—', icon: 'ti-mail', color: '#534ab7' },
            { label: 'Fecha de nacimiento', valor: formatearFecha(medico.fecha_nacimiento), icon: 'ti-calendar', color: '#854f0b' },
            { label: 'Dirección', valor: medico.direccion || '—', icon: 'ti-map-pin', color: '#993c1d' },
            { label: 'Rol', valor: medico.usuario?.rol?.nombre_rol || '—', icon: 'ti-user', color: '#0a2540' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 13, color: item.color }} aria-hidden="true" /> {item.label}
              </div>
              <div style={{ fontSize: 14, color: '#0a2540', fontWeight: 500 }}>{item.valor}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Especialidades */}
        <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e5e7eb' }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#0a2540' }}>Especialidades</div>
          </div>
          <div style={{ padding: '16px 20px' }}>

            {/* Admin: puede seleccionar y guardar especialidades */}
            {puedeGestionar ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {todasEspecialidades.map(esp => (
                    <button key={esp.id_especialidad}
                      onClick={() => toggleEsp(esp.id_especialidad)}
                      style={{
                        padding: '5px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: '0.5px solid',
                        fontWeight: 500, transition: 'all 0.15s',
                        background: espSeleccionadas.includes(esp.id_especialidad) ? '#eeedfe' : 'white',
                        color: espSeleccionadas.includes(esp.id_especialidad) ? '#534ab7' : '#6b7280',
                        borderColor: espSeleccionadas.includes(esp.id_especialidad) ? '#534ab7' : '#d1d5db',
                      }}
                    >{esp.nombre}</button>
                  ))}
                </div>
                <button onClick={guardarEspecialidades} disabled={guardandoEsp}
                  style={{ background: guardandoEsp ? '#93c5fd' : '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: guardandoEsp ? 'not-allowed' : 'pointer' }}
                >{guardandoEsp ? 'Guardando...' : 'Guardar especialidades'}</button>
              </>
            ) : (
              /* Recepcionista: solo ve las especialidades asignadas sin poder editarlas */
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {medico.especialidades.length === 0
                  ? <span style={{ color: '#9ca3af', fontSize: 13 }}>Sin especialidades asignadas</span>
                  : medico.especialidades.map(esp => (
                    <span key={esp.id_especialidad} style={{ background: '#eeedfe', color: '#534ab7', fontSize: 12, padding: '5px 12px', borderRadius: 10, fontWeight: 500 }}>
                      {esp.nombre}
                    </span>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Horarios */}
        <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e5e7eb' }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#0a2540' }}>Horarios</div>
          </div>
          <div style={{ padding: '16px 20px' }}>

            {/* Admin: puede agregar horarios */}
            {puedeGestionar && (
              <form onSubmit={guardarHorario} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 16, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Día</label>
                  <select value={horarioForm.dia_semana} onChange={e => setHorarioForm({ ...horarioForm, dia_semana: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                    {DIAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Inicio</label>
                  <input type="time" value={horarioForm.hora_inicio} onChange={e => setHorarioForm({ ...horarioForm, hora_inicio: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Fin</label>
                  <input type="time" value={horarioForm.hora_fin} onChange={e => setHorarioForm({ ...horarioForm, hora_fin: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
                </div>
                <button type="submit" disabled={guardandoHorario}
                  style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >+ Agregar</button>
              </form>
            )}

            {/* Lista de horarios — visible para todos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {medico.horarios?.length === 0
                ? <div style={{ color: '#9ca3af', fontSize: 13 }}>Sin horarios registrados</div>
                : medico.horarios?.map(h => (
                  <div key={h.id_horario} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                    <div>
                      <span style={{ fontWeight: 500, fontSize: 13, color: '#0a2540' }}>{h.dia_nombre}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{h.hora_inicio.slice(0, 5)} — {h.hora_fin.slice(0, 5)}</span>
                    </div>
                    {/* Botón eliminar — solo admin */}
                    {puedeGestionar && (
                      <button onClick={() => eliminarHorario(h.id_horario)}
                        style={{ color: '#a32d2d', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fcebeb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >Eliminar</button>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Disponibilidad — visible para todos los roles con acceso al módulo */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e5e7eb' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0a2540' }}>Consultar disponibilidad</div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <form onSubmit={consultarDisponibilidad} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Selecciona una fecha</label>
              <input type="date" value={fechaDisponibilidad} onChange={e => setFechaDisponibilidad(e.target.value)}
                style={inputStyle} required min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button type="submit" disabled={cargandoSlots}
              style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: cargandoSlots ? 'not-allowed' : 'pointer' }}
            >{cargandoSlots ? 'Consultando...' : 'Ver disponibilidad'}</button>
          </form>

          {mensajeDisponibilidad && (
            <div style={{ background: '#faeeda', color: '#854f0b', fontSize: 13, padding: '8px 12px', borderRadius: 8 }}>{mensajeDisponibilidad}</div>
          )}

          {slots.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                Slots de 30 minutos — <span style={{ color: '#0f6e56' }}>● Disponible</span> <span style={{ color: '#a32d2d', marginLeft: 8 }}>● Ocupado</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {slots.map(slot => (
                  <div key={slot.hora} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: slot.disponible ? '#eaf3de' : '#fcebeb',
                    color: slot.disponible ? '#3b6d11' : '#a32d2d',
                  }}>
                    {slot.hora}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleMedico;