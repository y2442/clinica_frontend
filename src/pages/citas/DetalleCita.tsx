import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api'; //llamada a axios preconfigurado para el backend
import type { Cita, EstadoCita, Tratamiento, SlotDisponibilidad } from '../../types';
import { formatearFecha } from '../../utils/fecha';
import { useAuth } from '../../context/AuthContext';

const estadoColores: Record<string, { bg: string; color: string }> = {
  'Programada': { bg: '#e6f1fb', color: '#185fa5' },
  'Completada': { bg: '#eaf3de', color: '#3b6d11' },
  'Cancelada': { bg: '#fcebeb', color: '#a32d2d' },
  'Reprogramada': { bg: '#faeeda', color: '#854f0b' },
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
    try {
      await api.post(`/citas/${id}/tratamientos`, { tratamientos: tratSeleccionados });
      setModalTratamientos(false);
      cargar();
    } catch {
      setError('Error al guardar tratamientos');
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
    width: '100%', border: '0.5px solid #d1d5db', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  };

  const esAdmin = usuario?.nombre_rol === 'Administrador';
  const esRecepcionista = usuario?.nombre_rol === 'Recepcionista';
  const esMedico = usuario?.nombre_rol === 'Médico';
  const puedeGestionar = esAdmin || esRecepcionista;
  const citaActiva = cita?.estado.nombre === 'Programada' || cita?.estado.nombre === 'Reprogramada';

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>Cargando...</div>
    </div>
  );

  if (!cita) return null;

  const colorEstado = estadoColores[cita.estado.nombre] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <div>
      <button onClick={() => navigate('/citas')}
        style={{ background: 'none', border: 'none', color: '#185fa5', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
      >← Volver a citas</button>

      {error && <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}

      {/* Info principal */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: '1.5rem', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0a2540' }}>Cita #{cita.id_cita}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Registrada por: {cita.recepcionista?.nombre_usuario}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ background: colorEstado.bg, color: colorEstado.color, fontSize: 12, padding: '5px 14px', borderRadius: 10, fontWeight: 500 }}>
              {cita.estado.nombre}
            </span>
            {puedeGestionar && citaActiva && (
              <>
                <button onClick={() => setModalEstado(true)}
                  style={{ background: '#faeeda', color: '#854f0b', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >Cambiar estado</button>
                <button onClick={() => { setModalReprogramar(true); setNuevaFecha(''); setNuevaHora(''); setSlots([]); }}
                  style={{ background: '#e6f1fb', color: '#185fa5', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >Reprogramar</button>
              </>
            )}
            {(esAdmin || esMedico) && (
              <button onClick={() => setModalTratamientos(true)}
                style={{ background: '#eeedfe', color: '#534ab7', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              >Tratamientos</button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Paciente', valor: `${cita.paciente.nombre} ${cita.paciente.apellido}`, icon: 'ti-user', color: '#185fa5' },
            { label: 'Médico', valor: `Dr. ${cita.medico.nombre} ${cita.medico.apellido}`, icon: 'ti-stethoscope', color: '#0f6e56' },
            { label: 'Teléfono paciente', valor: cita.paciente.telefono, icon: 'ti-phone', color: '#0f6e56' },
            { label: 'Fecha', valor: formatearFecha(cita.fecha_cita), icon: 'ti-calendar', color: '#854f0b' },
            { label: 'Hora', valor: cita.hora_cita.slice(0, 5), icon: 'ti-clock', color: '#534ab7' },
            { label: 'Fecha de registro', valor: formatearFecha(cita.fecha_registro), icon: 'ti-calendar-plus', color: '#185fa5' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 13, color: item.color }} aria-hidden="true" /> {item.label}
              </div>
              <div style={{ fontSize: 14, color: '#0a2540', fontWeight: 500 }}>{item.valor}</div>
            </div>
          ))}
        </div>

        {(cita.motivo || cita.observaciones) && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {cita.motivo && (
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                  <i className="ti ti-notes" style={{ fontSize: 13, color: '#854f0b' }} aria-hidden="true" /> Motivo
                </div>
                <div style={{ fontSize: 13, color: '#0a2540' }}>{cita.motivo}</div>
              </div>
            )}
            {cita.observaciones && (
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                  <i className="ti ti-message" style={{ fontSize: 13, color: '#534ab7' }} aria-hidden="true" /> Observaciones
                </div>
                <div style={{ fontSize: 13, color: '#0a2540' }}>{cita.observaciones}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tratamientos asignados */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0a2540' }}>Tratamientos</div>
          <span style={{ background: '#eeedfe', color: '#534ab7', fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
            {cita.tratamientos?.length || 0} tratamiento{(cita.tratamientos?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>
        {!cita.tratamientos?.length ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            No hay tratamientos asignados a esta cita
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Tratamiento', 'Descripción', 'Costo', 'Observación'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 500, borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cita.tratamientos?.map(t => (
                <tr key={t.id_tratamiento} style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0a2540' }}>{t.nombre}</td>
                  <td style={{ padding: '11px 16px', color: '#6b7280' }}>{t.descripcion || '—'}</td>
                  <td style={{ padding: '11px 16px', color: '#0f6e56', fontWeight: 500 }}>Q{Number(t.costo).toFixed(2)}</td>
                  <td style={{ padding: '11px 16px', color: '#6b7280' }}>{t.citas_tratamientos?.observacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal cambiar estado */}
      {modalEstado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>Cambiar estado</div>
              <button onClick={() => setModalEstado(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <form onSubmit={cambiarEstado}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Nuevo estado</label>
                <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} style={inputStyle} required>
                  <option value="">Selecciona un estado</option>
                  {estados.filter(e => e.nombre !== cita.estado.nombre).map(e => (
                    <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Observaciones <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                <textarea value={obsEstado} onChange={e => setObsEstado(e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModalEstado(false)} style={{ flex: 1, border: '0.5px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ flex: 1, background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  {guardando ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal reprogramar */}
      {modalReprogramar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>Reprogramar cita</div>
              <button onClick={() => setModalReprogramar(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <form onSubmit={reprogramar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Nueva fecha</label>
                  <input type="date" value={nuevaFecha}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { setNuevaFecha(e.target.value); setNuevaHora(''); cargarSlots(e.target.value); }}
                    style={inputStyle} required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                    Nueva hora {cargandoSlots && <span style={{ color: '#9ca3af', fontWeight: 400 }}>cargando...</span>}
                  </label>
                  {slots.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {slots.filter(s => s.disponible).map(slot => (
                        <button key={slot.hora} type="button"
                          onClick={() => setNuevaHora(slot.hora)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid',
                            background: nuevaHora === slot.hora ? '#185fa5' : 'white',
                            color: nuevaHora === slot.hora ? 'white' : '#185fa5',
                            borderColor: nuevaHora === slot.hora ? '#185fa5' : '#b5d4f4',
                          }}
                        >{slot.hora}</button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>Selecciona una fecha primero</div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5 }}>Motivo del cambio <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                <textarea value={obsReprogramar} onChange={e => setObsReprogramar(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModalReprogramar(false)} style={{ flex: 1, border: '0.5px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando || !nuevaHora} style={{ flex: 1, background: !nuevaHora ? '#93c5fd' : '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: !nuevaHora ? 'not-allowed' : 'pointer' }}>
                  {guardando ? 'Guardando...' : 'Reprogramar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tratamientos */}
      {modalTratamientos && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0a2540' }}>Asignar tratamientos</div>
              <button onClick={() => setModalTratamientos(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {tratamientos.map(t => {
                const seleccionado = tratSeleccionados.find(ts => ts.id_tratamiento === t.id_tratamiento);
                return (
                  <div key={t.id_tratamiento} style={{ border: `0.5px solid ${seleccionado ? '#534ab7' : '#e5e7eb'}`, borderRadius: 8, padding: '10px 14px', transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: seleccionado ? 8 : 0 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540' }}>{t.nombre}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Q{Number(t.costo).toFixed(2)}</div>
                      </div>
                      <button type="button" onClick={() => toggleTratamiento(t.id_tratamiento)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid',
                          background: seleccionado ? '#eeedfe' : 'white',
                          color: seleccionado ? '#534ab7' : '#6b7280',
                          borderColor: seleccionado ? '#534ab7' : '#d1d5db',
                        }}
                      >{seleccionado ? '✓ Seleccionado' : 'Agregar'}</button>
                    </div>
                    {seleccionado && (
                      <input
                        placeholder="Observación del tratamiento (opcional)"
                        value={seleccionado.observacion}
                        onChange={e => setTratSeleccionados(prev =>
                          prev.map(ts => ts.id_tratamiento === t.id_tratamiento ? { ...ts, observacion: e.target.value } : ts)
                        )}
                        style={{ ...inputStyle, fontSize: 12, padding: '6px 10px' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalTratamientos(false)} style={{ flex: 1, border: '0.5px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarTratamientos} disabled={guardando}
                style={{ flex: 1, background: '#185fa5', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >{guardando ? 'Guardando...' : 'Guardar tratamientos'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleCita;