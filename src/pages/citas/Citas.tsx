import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Cita, Medico, EstadoCita, Paciente, SlotDisponibilidad } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext';

const estadoColores: Record<string, { bg: string; color: string }> = {
  'Programada': { bg: '#e6f1fb', color: '#185fa5' },
  'Completada': { bg: '#eaf3de', color: '#3b6d11' },
  'Cancelada': { bg: '#fcebeb', color: '#a32d2d' },
  'Reprogramada': { bg: '#faeeda', color: '#854f0b' },
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
      if (!data.disponible) setError(data.message || 'El médico no trabaja ese día');
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
    width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#0a2540' }}>Citas</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Gestión de citas de la clínica</div>
        </div>
        {puedeAgendar && (
          <button
            onClick={abrirModal}
            style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 0.18s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0c447c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#185fa5'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >+ Agendar cita</button>
        )}
      </div>

      {/* Alerta citas de hoy */}
      {citasHoy.length > 0 && (
        <div style={{ background: '#e6f1fb', border: '0.5px solid #378add', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0c447c', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 14, color: '#185fa5' }} aria-hidden="true" />
            Citas programadas para hoy — {citasHoy.length} cita{citasHoy.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {citasHoy.map(c => (
              <div key={c.id_cita}
                style={{ background: 'white', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onClick={() => navigate(`/citas/${c.id_cita}`)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#185fa5' }}>{c.hora_cita.slice(0, 5)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540' }}>{c.paciente.nombre} {c.paciente.apellido}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Dr. {c.medico.nombre} {c.medico.apellido}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{c.motivo || 'Sin motivo'}</span>
                  <span style={{ ...estadoColores[c.estado.nombre], fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 500 }}>
                    {c.estado.nombre}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total citas', valor: citas.length, color: '#0a2540',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
          },
          {
            label: 'Programadas', valor: programadas, color: '#185fa5',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01" /></svg>,
          },
          {
            label: 'Completadas', valor: completadas, color: '#0f6e56',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>,
          },
          {
            label: 'Canceladas', valor: canceladas, color: '#a32d2d',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>,
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
            <div style={{ fontSize: 26, fontWeight: 500, color: stat.color }}>{stat.valor}</div>
          </div>
        ))}
      </div>

      {error && !modalAbierto && (
        <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>
      )}

      {/* Filtros y tabla */}
      <div style={{ background: 'white', borderRadius: 10, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540' }}>Lista de citas</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              style={{ border: '0.5px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}
            />
            {!esMedico && (
              <select value={filtroMedico} onChange={e => setFiltroMedico(e.target.value)}
                style={{ border: '0.5px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}
              >
                <option value="">Todos los médicos</option>
                {medicos.map(m => <option key={m.id_medico} value={m.id_medico}>Dr. {m.nombre} {m.apellido}</option>)}
              </select>
            )}
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              style={{ border: '0.5px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}
            >
              <option value="">Todos los estados</option>
              {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
            </select>
            <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Buscar paciente..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                style={{ ...inputStyle, width: 200, padding: '7px 12px', fontSize: 13 }}
              />
              <button type="submit" style={{ background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
                Buscar
              </button>
            </form>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['#', 'Paciente', 'Médico', 'Fecha', 'Hora', 'Motivo', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 500, borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</td></tr>
            ) : citas.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No se encontraron citas</td></tr>
            ) : citas.map(c => {
              const colorEstado = estadoColores[c.estado.nombre] || { bg: '#f3f4f6', color: '#374151' };
              return (
                <tr key={c.id_cita}
                  style={{ borderBottom: '0.5px solid #e5e7eb', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '11px 16px', color: '#9ca3af' }}>{c.id_cita}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ fontWeight: 500, color: '#0a2540' }}>{c.paciente.nombre} {c.paciente.apellido}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.paciente.telefono}</div>
                  </td>
                  <td style={{ padding: '11px 16px', color: '#6b7280' }}>Dr. {c.medico.nombre} {c.medico.apellido}</td>
                  <td style={{ padding: '11px 16px', color: '#6b7280' }}>{formatearFecha(c.fecha_cita)}</td>
                  <td style={{ padding: '11px 16px', color: '#6b7280' }}>{c.hora_cita.slice(0, 5)}</td>
                  <td style={{ padding: '11px 16px', color: '#6b7280' }}>{c.motivo || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ background: colorEstado.bg, color: colorEstado.color, fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 500 }}>
                      {c.estado.nombre}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <button
                      onClick={() => navigate(`/citas/${c.id_cita}`)}
                      style={{ color: '#0f6e56', fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5, background: 'transparent', border: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#eaf3de')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >Ver detalle</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal agendar cita */}
      {modalAbierto && puedeAgendar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>Agendar cita</div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <form onSubmit={guardar}>
              {/* Paciente */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Paciente</label>
                <select value={form.id_paciente}
                  onChange={e => setForm({ ...form, id_paciente: e.target.value })}
                  style={inputStyle} required
                >
                  <option value="">Selecciona un paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido} — {p.dpi}</option>
                  ))}
                </select>
              </div>

              {/* Médico y fecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Médico</label>
                  <select value={form.id_medico}
                    onChange={e => {
                      setForm({ ...form, id_medico: e.target.value, hora_cita: '' });
                      handleMedicoFechaChange(e.target.value, form.fecha_cita);
                    }}
                    style={inputStyle} required
                  >
                    <option value="">Selecciona un médico</option>
                    {medicos.map(m => (
                      <option key={m.id_medico} value={m.id_medico}>Dr. {m.nombre} {m.apellido}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Fecha</label>
                  <input type="date"
                    value={form.fecha_cita}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      setForm({ ...form, fecha_cita: e.target.value, hora_cita: '' });
                      handleMedicoFechaChange(form.id_medico, e.target.value);
                    }}
                    style={inputStyle} required
                  />
                </div>
              </div>

              {/* Slots de hora */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                  Hora disponible {cargandoSlots && <span style={{ color: '#9ca3af', fontWeight: 400 }}>cargando...</span>}
                </label>
                {slots.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.filter(s => s.disponible).map(slot => (
                      <button key={slot.hora} type="button"
                        onClick={() => setForm({ ...form, hora_cita: slot.hora })}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                          cursor: 'pointer', border: '0.5px solid',
                          transition: 'all 0.15s',
                          background: form.hora_cita === slot.hora ? '#185fa5' : 'white',
                          color: form.hora_cita === slot.hora ? 'white' : '#185fa5',
                          borderColor: form.hora_cita === slot.hora ? '#185fa5' : '#b5d4f4',
                        }}
                      >{slot.hora}</button>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>
                    {form.id_medico && form.fecha_cita ? 'No hay horarios disponibles ese día' : 'Selecciona médico y fecha para ver horarios'}
                  </div>
                )}
                {form.hora_cita && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#0f6e56', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-circle-check" style={{ fontSize: 13 }} aria-hidden="true" /> Hora seleccionada: {form.hora_cita}
                  </div>
                )}
              </div>

              {/* Motivo y observaciones */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                  Motivo <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
                </label>
                <input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}
                  style={inputStyle} placeholder="Ej: Dolor de muela, revisión general..."
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                  Observaciones <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
                </label>
                <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  placeholder="Observaciones adicionales..."
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
                <button type="submit" disabled={guardando || !form.hora_cita}
                  style={{ flex: 1, background: guardando || !form.hora_cita ? '#93c5fd' : '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: guardando || !form.hora_cita ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!guardando && form.hora_cita) e.currentTarget.style.background = '#0c447c'; }}
                  onMouseLeave={e => { if (!guardando && form.hora_cita) e.currentTarget.style.background = '#185fa5'; }}
                >{guardando ? 'Agendando...' : 'Agendar cita'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Citas;