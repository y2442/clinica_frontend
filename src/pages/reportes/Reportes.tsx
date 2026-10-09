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
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const hasta = `${finMes.getFullYear()}-${String(finMes.getMonth() + 1).padStart(2, '0')}-${String(finMes.getDate()).padStart(2, '0')}`;
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

    const textColor = '#64748b';
    const gridColor = 'rgba(226, 232, 240, 0.8)';

    // Destruir instancias anteriores
    chartEstadosInstance.current?.destroy();
    chartMedicosInstance.current?.destroy();
    chartMesesInstance.current?.destroy();
    chartEstadosInstance.current = null;
    chartMedicosInstance.current = null;
    chartMesesInstance.current = null;

    // Gráfica de dona — estados
    if (chartEstadosRef.current) {
      const completadas = reporte.citasPorEstado.find(e => e.estado?.toLowerCase() === 'completada')?.total || 0;
      const canceladas = reporte.citasPorEstado.find(e => e.estado?.toLowerCase() === 'cancelada')?.total || 0;
      const programadas = reporte.citasPorEstado.find(e => e.estado?.toLowerCase() === 'programada')?.total || 0;
      const reprogramadas = reporte.citasPorEstado.find(e => e.estado?.toLowerCase() === 'reprogramada')?.total || 0;

      chartEstadosInstance.current = new Chart(chartEstadosRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Completadas', 'Canceladas', 'Programadas', 'Reprogramadas'],
          datasets: [{
            data: [completadas, canceladas, programadas, reprogramadas],
            backgroundColor: ['#10b981', '#ef4444', '#0284c7', '#f97316'],
            borderWidth: 2,
            borderColor: '#ffffff',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: { legend: { display: false } },
        },
      });
    }

    // Gráfica de barras — médicos
    if (chartMedicosRef.current && reporte.resumenMedicos.length > 0) {
      chartMedicosInstance.current = new Chart(chartMedicosRef.current, {
        type: 'bar',
        data: {
          labels: reporte.resumenMedicos.map(m => `Dr. ${m.nombre}`),
          datasets: [
            {
              label: 'Completadas',
              data: reporte.resumenMedicos.map(m => m.completadas),
              backgroundColor: '#10b981',
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Canceladas',
              data: reporte.resumenMedicos.map(m => m.canceladas),
              backgroundColor: '#ef4444',
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Programadas',
              data: reporte.resumenMedicos.map(m => m.programadas),
              backgroundColor: '#0284c7',
              borderRadius: 6,
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
              ticks: { color: textColor, font: { size: 11, family: 'Inter' } },
              grid: { display: false },
            },
            y: {
              stacked: true,
              ticks: { color: textColor, font: { size: 11, family: 'Inter' } },
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
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#0284c7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: textColor, font: { size: 11, family: 'Inter' }, autoSkip: false, maxRotation: 45 },
              grid: { display: false },
            },
            y: {
              ticks: { color: textColor, font: { size: 11, family: 'Inter' } },
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
      chartEstadosInstance.current = null;
      chartMedicosInstance.current = null;
      chartMesesInstance.current = null;
    };
  }, [reporte, citasMes, cargando]);

  const completadas = reporte?.citasPorEstado.find(e => e.estado?.toLowerCase() === 'completada')?.total || 0;
  const canceladas = reporte?.citasPorEstado.find(e => e.estado?.toLowerCase() === 'cancelada')?.total || 0;
  const programadas = reporte?.citasPorEstado.find(e => e.estado?.toLowerCase() === 'programada')?.total || 0;
  const totalCitas = reporte?.totalCitas || 0;
  const efectividadGeneral = totalCitas > 0 ? Math.round((completadas / totalCitas) * 100) : 0;
  const maxUsos = (tratamientos.length > 0 && Math.max(...tratamientos.map(t => t.total_usos)) > 0)
    ? Math.max(...tratamientos.map(t => t.total_usos))
    : 1;

  const exportarCSV = () => {
    if (!reporte) return;
    const periodoObj = MESES_OPCIONES.find(o => o.value === periodo);
    const periodoNombre = periodoObj ? periodoObj.label : periodo;
    const fechaActual = new Date().toLocaleDateString('es-GT', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let csv = '\uFEFF';
    csv += `DENTACARE - REPORTE EJECUTIVO Y ESTADÍSTICAS\n`;
    csv += `Filtro de tiempo:;"${periodoNombre}"\n`;
    csv += `Fecha de generación:;"${fechaActual}"\n\n`;

    csv += `--- RESUMEN GENERAL DE INDICADORES ---\n`;
    csv += `Métrica;Valor;Notas\n`;
    csv += `Total de citas;${totalCitas};Período: ${periodoNombre}\n`;
    csv += `Citas completadas;${completadas};${efectividadGeneral}% de efectividad\n`;
    csv += `Citas canceladas;${canceladas};${totalCitas > 0 ? Math.round((canceladas / totalCitas) * 100) : 0}% de cancelación\n`;
    csv += `Nuevos pacientes registrados;${reporte.nuevosPacientes};En el período seleccionado\n\n`;

    csv += `--- CITAS POR ESTADO ---\n`;
    csv += `Estado;Total\n`;
    reporte.citasPorEstado.forEach(e => {
      csv += `"${e.estado}";${e.total}\n`;
    });
    csv += `\n`;

    csv += `--- RESUMEN POR MÉDICO ---\n`;
    csv += `Médico;Total Citas;Completadas;Canceladas;Programadas;Efectividad (%)\n`;
    reporte.resumenMedicos.forEach(m => {
      csv += `"Dr. ${m.nombre}";${m.total};${m.completadas};${m.canceladas};${m.programadas};${m.efectividad}%\n`;
    });
    csv += `\n`;

    if (citasMes.length > 0) {
      csv += `--- EVOLUCIÓN MENSUAL DE CITAS ---\n`;
      csv += `Mes;Total Citas\n`;
      citasMes.forEach(m => {
        csv += `"${m.label}";${m.total}\n`;
      });
      csv += `\n`;
    }

    if (tratamientos.length > 0) {
      csv += `--- TRATAMIENTOS MÁS REALIZADOS ---\n`;
      csv += `Tratamiento;Costo (Q);Total Usos\n`;
      tratamientos.forEach(t => {
        csv += `"${t.nombre}";Q${t.costo.toFixed(2)};${t.total_usos}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_DentaCare_${periodo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    padding: '20px 22px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  };

  const inputStyle: React.CSSProperties = {
    border: '1.5px solid #cbd5e1',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Banner impreso visible solo al imprimir */}
      <div className="print-only" style={{ display: 'none', marginBottom: 20, borderBottom: '2px solid #0284c7', paddingBottom: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>DentaCare — Reporte Ejecutivo Clínico</h1>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>
          Generado el: {new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — Período: {MESES_OPCIONES.find(o => o.value === periodo)?.label}
        </p>
      </div>

      {/* Encabezado Unificado sin icono lateral */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Reportes
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Análisis estadístico y métricas generales del sistema DentaCare
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            style={inputStyle}
          >
            {MESES_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={exportarCSV}
            disabled={!reporte || cargando}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#047857',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: (!reporte || cargando) ? 'not-allowed' : 'pointer',
              opacity: (!reporte || cargando) ? 0.6 : 1,
              boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (reporte && !cargando) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.background = '#065f46';
              }
            }}
            onMouseLeave={e => {
              if (reporte && !cargando) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#047857';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={!reporte || cargando}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: (!reporte || cargando) ? 'not-allowed' : 'pointer',
              opacity: (!reporte || cargando) ? 0.6 : 1,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (reporte && !cargando) {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (reporte && !cargando) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Métricas KPI principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total citas',
            valor: cargando ? '...' : totalCitas,
            color: '#0f172a',
            sub: 'En el período seleccionado',
            iconBg: '#e2e8f0',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            ),
          },
          {
            label: 'Citas completadas',
            valor: cargando ? '...' : completadas,
            color: '#047857',
            sub: `${efectividadGeneral}% de efectividad`,
            iconBg: '#dcfce7',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            ),
          },
          {
            label: 'Citas canceladas',
            valor: cargando ? '...' : canceladas,
            color: '#b91c1c',
            sub: `${totalCitas > 0 ? Math.round((canceladas / totalCitas) * 100) : 0}% de cancelación`,
            iconBg: '#fee2e2',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ),
          },
          {
            label: 'Nuevos pacientes',
            valor: cargando ? '...' : reporte?.nuevosPacientes || 0,
            color: '#6d28d9',
            sub: 'Registrados en el período',
            iconBg: '#f3e8ff',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            ),
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="report-card"
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '18px 20px',
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
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.valor}</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{stat.sub}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Dona — Estados */}
        <div className="report-card" style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <span>Distribución de Citas por Estado</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Completadas', color: '#10b981', bg: '#ecfdf5', total: completadas },
              { label: 'Canceladas', color: '#ef4444', bg: '#fef2f2', total: canceladas },
              { label: 'Programadas', color: '#0284c7', bg: '#e0f2fe', total: programadas },
            ].map(e => (
              <span key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: e.color, background: e.bg, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                {e.label} ({e.total})
              </span>
            ))}
          </div>

          <div style={{ position: 'relative', height: 230 }}>
            <canvas ref={chartEstadosRef} role="img" aria-label="Gráfica de dona con citas por estado">Citas por estado</canvas>
          </div>
        </div>

        {/* Barras — Médicos */}
        <div className="report-card" style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v12M8 18h8" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Rendimiento por Médico Tratante</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Completadas', color: '#10b981', bg: '#ecfdf5' },
              { label: 'Canceladas', color: '#ef4444', bg: '#fef2f2' },
              { label: 'Programadas', color: '#0284c7', bg: '#e0f2fe' },
            ].map(e => (
              <span key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: e.color, background: e.bg, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: e.color, display: 'inline-block' }} />
                {e.label}
              </span>
            ))}
          </div>

          <div style={{ position: 'relative', height: 230 }}>
            <canvas ref={chartMedicosRef} role="img" aria-label="Gráfica de barras con citas por médico">Citas por médico</canvas>
          </div>
        </div>
      </div>

      {/* Evolución Mensual de Citas */}
      <div className="report-card" style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <span>Evolución Histórica de Citas (Últimos 12 Meses)</span>
        </div>

        <div style={{ position: 'relative', height: 220 }}>
          <canvas ref={chartMesesRef} role="img" aria-label="Gráfica de línea con evolución mensual de citas">Evolución mensual</canvas>
        </div>
      </div>

      {/* Tratamientos más realizados & Resumen médicos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Tratamientos más realizados */}
        <div className="report-card" style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span>Tratamientos Más Solicitados</span>
          </div>

          {tratamientos.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '2.5rem' }}>No hay registros disponibles</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tratamientos.map((t, i) => (
                <div key={t.id_tratamiento}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', width: 20 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600 }}>{t.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>Q{t.costo.toFixed(2)}</span>
                      <span style={{ fontSize: 11.5, background: '#f3e8ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                        {t.total_usos} {t.total_usos === 1 ? 'uso' : 'usos'}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 7, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(t.total_usos / maxUsos) * 100}%`,
                      background: 'linear-gradient(90deg, #185fa5 0%, #0284c7 100%)',
                      borderRadius: 10,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla resumen médicos */}
        <div className="report-card" style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
            <span>Resumen Detallado por Médico</span>
          </div>

          {reporte?.resumenMedicos.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '2.5rem' }}>No hay datos disponibles</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Médico</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Completadas</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Canceladas</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Efectividad</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte?.resumenMedicos.map(m => (
                    <tr
                      key={m.id_medico}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>Dr. {m.nombre}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#334155', fontWeight: 500 }}>{m.total}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: 11.5, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                          {m.completadas}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: 11.5, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                          {m.canceladas}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: m.efectividad >= 80 ? '#047857' : m.efectividad >= 60 ? '#c2410c' : '#b91c1c' }}>
                        {m.efectividad}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .report-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reportes;