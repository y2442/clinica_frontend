import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface ResumenMedico {
  id_medico: number;
  nombre: string;
  total: number;
  completadas: number;
  canceladas: number;
  programadas: number;
  reprogramadas: number;
  efectividad: number;
}

interface EstadoCita {
  estado: string;
  total: number;
}

interface ReporteGeneral {
  totalCitas: number;
  nuevosPacientes: number;
  citasPorEstado: EstadoCita[];
  resumenMedicos: ResumenMedico[];
}

interface CitaMes {
  label: string;
  mes: string;
  total: number;
}

interface TratamientoUso {
  id_tratamiento: number;
  nombre: string;
  costo: number;
  total_usos: number;
}

const MESES_OPCIONES = [
  { label: 'Este mes', value: 'mes' },
  { label: 'Últimos 3 meses', value: '3meses' },
  { label: 'Últimos 6 meses', value: '6meses' },
  { label: 'Este año', value: 'anio' },
];

const calcularFechas = (periodo: string) => {
  const hoy = new Date();
  const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-31`;
  let desde = '';

  if (periodo === 'mes') {
    desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  } else if (periodo === '3meses') {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  } else if (periodo === '6meses') {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
    desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  } else {
    desde = `${hoy.getFullYear()}-01-01`;
  }

  return { desde, hasta };
};

const Reportes = () => {
  const [periodo, setPeriodo] = useState('mes');
  const [reporte, setReporte] = useState<ReporteGeneral | null>(null);
  const [citasMes, setCitasMes] = useState<CitaMes[]>([]);
  const [tratamientos, setTratamientos] = useState<TratamientoUso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const chartEstadosRef = useRef<HTMLCanvasElement>(null);
  const chartMedicosRef = useRef<HTMLCanvasElement>(null);
  const chartMesesRef = useRef<HTMLCanvasElement>(null);
  const chartEstadosInstance = useRef<Chart | null>(null);
  const chartMedicosInstance = useRef<Chart | null>(null);
  const chartMesesInstance = useRef<Chart | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const { desde, hasta } = calcularFechas(periodo);
      const [resGeneral, resMeses, resTrat] = await Promise.all([
        api.get<ReporteGeneral>(`/reportes/general?desde=${desde}&hasta=${hasta}`),
        api.get<CitaMes[]>('/reportes/citas-por-mes'),
        api.get<TratamientoUso[]>('/reportes/tratamientos'),
      ]);
      setReporte(resGeneral.data);
      setCitasMes(resMeses.data);
      setTratamientos(resTrat.data);
    } catch {
      setError('Error al cargar los reportes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [periodo]);

  // Renderizar gráficas cuando los datos estén listos
  useEffect(() => {
    if (!reporte || cargando) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    // Destruir instancias anteriores
    chartEstadosInstance.current?.destroy();
    chartMedicosInstance.current?.destroy();
    chartMesesInstance.current?.destroy();

    // Gráfica de dona — estados
    if (chartEstadosRef.current) {
      const completadas = reporte.citasPorEstado.find(e => e.estado === 'Completada')?.total || 0;
      const canceladas = reporte.citasPorEstado.find(e => e.estado === 'Cancelada')?.total || 0;
      const programadas = reporte.citasPorEstado.find(e => e.estado === 'Programada')?.total || 0;
      const reprogramadas = reporte.citasPorEstado.find(e => e.estado === 'Reprogramada')?.total || 0;

      chartEstadosInstance.current = new Chart(chartEstadosRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Completadas', 'Canceladas', 'Programadas', 'Reprogramadas'],
          datasets: [{
            data: [completadas, canceladas, programadas, reprogramadas],
            backgroundColor: ['#3b6d11', '#a32d2d', '#185fa5', '#854f0b'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { display: false } },
        },
      });
    }

    // Gráfica de barras — médicos
    if (chartMedicosRef.current && reporte.resumenMedicos.length > 0) {
      chartMedicosInstance.current = new Chart(chartMedicosRef.current, {
        type: 'bar',
        data: {
          labels: reporte.resumenMedicos.map(m => `Dr(a). ${m.nombre}`),
          datasets: [
            {
              label: 'Completadas',
              data: reporte.resumenMedicos.map(m => m.completadas),
              backgroundColor: '#3b6d11',
              borderRadius: 4,
              borderSkipped: false,
            },
            {
              label: 'Canceladas',
              data: reporte.resumenMedicos.map(m => m.canceladas),
              backgroundColor: '#a32d2d',
              borderRadius: 4,
              borderSkipped: false,
            },
            {
              label: 'Programadas',
              data: reporte.resumenMedicos.map(m => m.programadas),
              backgroundColor: '#185fa5',
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              stacked: true,
              ticks: { color: textColor, font: { size: 11 } },
              grid: { display: false },
            },
            y: {
              stacked: true,
              ticks: { color: textColor, font: { size: 11 } },
              grid: { color: gridColor },
              beginAtZero: true,
            },
          },
        },
      });
    }

    // Gráfica de línea — meses
    if (chartMesesRef.current && citasMes.length > 0) {
      chartMesesInstance.current = new Chart(chartMesesRef.current, {
        type: 'line',
        data: {
          labels: citasMes.map(m => m.mes),
          datasets: [{
            label: 'Citas',
            data: citasMes.map(m => m.total),
            borderColor: '#185fa5',
            backgroundColor: 'rgba(24,95,165,0.08)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#185fa5',
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: textColor, font: { size: 11 }, autoSkip: false, maxRotation: 45 },
              grid: { display: false },
            },
            y: {
              ticks: { color: textColor, font: { size: 11 } },
              grid: { color: gridColor },
              beginAtZero: true,
            },
          },
        },
      });
    }

    return () => {
      chartEstadosInstance.current?.destroy();
      chartMedicosInstance.current?.destroy();
      chartMesesInstance.current?.destroy();
    };
  }, [reporte, citasMes, cargando]);

  const completadas = reporte?.citasPorEstado.find(e => e.estado === 'Completada')?.total || 0;
  const canceladas = reporte?.citasPorEstado.find(e => e.estado === 'Cancelada')?.total || 0;
  const programadas = reporte?.citasPorEstado.find(e => e.estado === 'Programada')?.total || 0;
  const totalCitas = reporte?.totalCitas || 0;
  const efectividadGeneral = totalCitas > 0 ? Math.round((completadas / totalCitas) * 100) : 0;
  const maxUsos = tratamientos.length > 0 ? Math.max(...tratamientos.map(t => t.total_usos)) : 1;

  const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    border: '0.5px solid #e5e7eb', padding: '1rem 1.25rem',
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#0a2540' }}>Reportes</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Resumen general del sistema</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            style={{ border: '0.5px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', cursor: 'pointer' }}
          >
            {MESES_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}

      {/* Métricas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total citas', valor: cargando ? '...' : totalCitas, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, color: '#185fa5', sub: 'En el período seleccionado' },
          { label: 'Completadas', valor: cargando ? '...' : completadas, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>, color: '#3b6d11', sub: `${efectividadGeneral}% de efectividad` },
          { label: 'Canceladas', valor: cargando ? '...' : canceladas, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>, color: '#a32d2d', sub: `${totalCitas > 0 ? Math.round((canceladas / totalCitas) * 100) : 0}% de cancelación` },
          { label: 'Nuevos pacientes', valor: cargando ? '...' : reporte?.nuevosPacientes || 0, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="8" r="4"/><path d="M2 20c0-3.3 3.1-6 8-6"/><path d="M18 14v6M15 17h6"/></svg>, color: '#534ab7', sub: 'En el período seleccionado' },
        ].map((stat, i) => (
          <div key={i}
            style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '0.5px solid #e5e7eb', transition: 'transform 0.18s, box-shadow 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: stat.color, display: 'flex' }}>{stat.icon}</span> {stat.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 500, color: stat.color, marginBottom: 4 }}>{stat.valor}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Dona — estados */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-chart-donut" style={{ fontSize: 15, color: '#185fa5' }} aria-hidden="true" /> Citas por estado
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Completadas', color: '#3b6d11', bg: '#eaf3de', total: completadas },
              { label: 'Canceladas', color: '#a32d2d', bg: '#fcebeb', total: canceladas },
              { label: 'Programadas', color: '#185fa5', bg: '#e6f1fb', total: programadas },
            ].map(e => (
              <span key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: e.color, background: e.bg, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }}></span>
                {e.label} ({e.total})
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 220 }}>
            <canvas ref={chartEstadosRef} role="img" aria-label="Gráfica de dona con citas por estado">Citas por estado</canvas>
          </div>
        </div>

        {/* Barras — médicos */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-stethoscope" style={{ fontSize: 15, color: '#0f6e56' }} aria-hidden="true" /> Citas por médico
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Completadas', color: '#3b6d11', bg: '#eaf3de' },
              { label: 'Canceladas', color: '#a32d2d', bg: '#fcebeb' },
              { label: 'Programadas', color: '#185fa5', bg: '#e6f1fb' },
            ].map(e => (
              <span key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: e.color, background: e.bg, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: e.color, display: 'inline-block' }}></span>
                {e.label}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 220 }}>
            <canvas ref={chartMedicosRef} role="img" aria-label="Gráfica de barras con citas por médico">Citas por médico</canvas>
          </div>
        </div>
      </div>

      {/* Línea — evolución mensual */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-trending-up" style={{ fontSize: 15, color: '#185fa5' }} aria-hidden="true" /> Evolución de citas — últimos 12 meses
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#185fa5', background: '#e6f1fb', padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#185fa5', display: 'inline-block' }}></span>
            Total citas
          </span>
        </div>
        <div style={{ position: 'relative', height: 200 }}>
          <canvas ref={chartMesesRef} role="img" aria-label="Gráfica de línea con evolución mensual de citas">Evolución mensual</canvas>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Tratamientos más realizados */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-pill" style={{ fontSize: 15, color: '#534ab7' }} aria-hidden="true" /> Tratamientos más realizados
          </div>
          {tratamientos.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '2rem' }}>Sin datos disponibles</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tratamientos.map((t, i) => (
                <div key={t.id_tratamiento}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af', width: 16 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13, color: '#0a2540', fontWeight: 500 }}>{t.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Q{t.costo.toFixed(2)}</span>
                      <span style={{ fontSize: 12, background: '#eeedfe', color: '#534ab7', padding: '2px 8px', borderRadius: 8, fontWeight: 500 }}>{t.total_usos} usos</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(t.total_usos / maxUsos) * 100}%`, background: '#185fa5', borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla resumen médicos */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-layout-list" style={{ fontSize: 15, color: '#0a2540' }} aria-hidden="true" /> Resumen por médico
          </div>
          {reporte?.resumenMedicos.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '2rem' }}>Sin datos disponibles</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                  {['Médico', 'Total', 'Completadas', 'Canceladas', 'Efectividad'].map(h => (
                    <th key={h} style={{ padding: '8px 6px', textAlign: h === 'Médico' ? 'left' : 'center', fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reporte?.resumenMedicos.map(m => (
                  <tr key={m.id_medico}
                    style={{ borderBottom: '0.5px solid #e5e7eb', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '9px 6px', fontWeight: 500, color: '#0a2540' }}>Dr(a). {m.nombre}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'center', color: '#6b7280' }}>{m.total}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                      <span style={{ background: '#eaf3de', color: '#3b6d11', fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 500 }}>{m.completadas}</span>
                    </td>
                    <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                      <span style={{ background: '#fcebeb', color: '#a32d2d', fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 500 }}>{m.canceladas}</span>
                    </td>
                    <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 500, color: m.efectividad >= 80 ? '#3b6d11' : m.efectividad >= 60 ? '#854f0b' : '#a32d2d' }}>
                      {m.efectividad}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;