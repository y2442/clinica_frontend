import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import recepcion from '../assets/imagenes_clinica/recepcion.jpeg';
import cita from '../assets/imagenes_clinica/cita.jpeg';
import fachada from '../assets/imagenes_clinica/fachada.jpeg';

const Inicio = () => {
  const { usuario } = useAuth();
  const [hora, setHora] = useState(new Date());
  const [imagenActiva, setImagenActiva] = useState(0);

  const imagenes = [
    { src: fachada, titulo: 'Nuestra clínica', descripcion: 'Instalaciones modernas para tu comodidad' },
    { src: recepcion, titulo: 'Recepción', descripcion: 'Te atendemos con calidez y profesionalismo' },
    { src: cita, titulo: 'Atención dental', descripcion: 'Tecnología de vanguardia para tu salud bucal' },
  ];

  // Reloj en tiempo real
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setImagenActiva(prev => (prev + 1) % imagenes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const horaFormateada = hora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fechaFormateada = hora.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const saludo = hora.getHours() < 12 ? 'Buenos días' : hora.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  const servicios = [
    { icon: '🦷', titulo: 'Odontología General', descripcion: 'Revisiones, limpiezas y tratamientos preventivos para mantener tu salud bucal.' },
    { icon: '😁', titulo: 'Ortodoncia', descripcion: 'Corrección de la posición dental con brackets y alineadores modernos.' },
    { icon: '🔬', titulo: 'Endodoncia', descripcion: 'Tratamiento de conductos para salvar dientes con infección profunda.' },
    { icon: '🧒', titulo: 'Odontopediatría', descripcion: 'Atención especializada y amigable para los más pequeños de la familia.' },
    { icon: '⚕️', titulo: 'Periodoncia', descripcion: 'Tratamiento de encías y estructuras de soporte dental.' },
    { icon: '🏥', titulo: 'Cirugía Oral', descripcion: 'Extracciones, implantes y procedimientos quirúrgicos bucales.' },
  ];

  return (
    <div>
      {/* Hero de bienvenida */}
      <div style={{
        background: 'linear-gradient(135deg, #07192c 0%, #0d2847 100%)',
        borderRadius: 16,
        padding: '2.2rem 2rem',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -10px rgba(7, 25, 44, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Círculos decorativos de fondo (preservados y mejorados) */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(55,138,221,0.15)', border: '1px solid rgba(55,138,221,0.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '25%', width: 170, height: 170, borderRadius: '50%', background: 'rgba(55,138,221,0.08)', border: '1px solid rgba(55,138,221,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', left: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#38bdf8', fontWeight: 600, marginBottom: 6, textTransform: 'capitalize', letterSpacing: '0.02em' }}>
              🗓️ {fechaFormateada}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.02em' }}>
              {saludo}, {usuario?.nombre_usuario}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Bienvenid@ al Sistema de Gestión de Citas de <span style={{ color: '#38bdf8', fontWeight: 600 }}>DentaCare</span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                background: 'linear-gradient(90deg, rgba(56,142,221,0.3) 0%, rgba(56,142,221,0.1) 100%)',
                color: '#7dd3fc', border: '1px solid rgba(56,142,221,0.3)',
                fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8' }} />
                {usuario?.nombre_rol}
              </span>
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12, padding: '14px 20px', textAlign: 'right',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#ffffff', letterSpacing: 2, fontFamily: 'monospace' }}>
              {horaFormateada}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Hora local — Guatemala
            </div>
          </div>
        </div>
      </div>

      {/* Galería de imágenes — carrusel */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}>
        <div style={{ position: 'relative' }}>
          {/* Imagen principal */}
          <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
            <img
              src={imagenes[imagenActiva].src}
              alt={imagenes[imagenActiva].titulo}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s ease-in-out' }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(7,25,44,0.85) 100%)', padding: '36px 24px 20px' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#ffffff' }}>{imagenes[imagenActiva].titulo}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{imagenes[imagenActiva].descripcion}</div>
            </div>
            {/* Flechas navegación */}
            <button
              onClick={() => setImagenActiva(prev => (prev - 1 + imagenes.length) % imagenes.length)}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: 'none',
                borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 18,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >‹</button>
            <button
              onClick={() => setImagenActiva(prev => (prev + 1) % imagenes.length)}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: 'none',
                borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 18,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >›</button>
          </div>

          {/* Miniaturas */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 18px', background: '#f8fafc' }}>
            {imagenes.map((img, i) => (
              <div key={i} onClick={() => setImagenActiva(i)}
                style={{
                  flex: 1, height: 68, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                  border: `2px solid ${imagenActiva === i ? '#0284c7' : 'transparent'}`,
                  boxShadow: imagenActiva === i ? '0 0 0 2px rgba(2, 132, 199, 0.25)' : 'none',
                  transition: 'all 0.2s ease', opacity: imagenActiva === i ? 1 : 0.65,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = imagenActiva === i ? '1' : '0.65')}
              >
                <img src={img.src} alt={img.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* Puntos indicadores */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 14, background: '#f8fafc' }}>
            {imagenes.map((_, i) => (
              <div key={i} onClick={() => setImagenActiva(i)}
                style={{
                  width: imagenActiva === i ? 24 : 8, height: 8, borderRadius: 4,
                  background: imagenActiva === i ? '#0284c7' : '#cbd5e1',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            🦷
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Nuestros servicios odontológicos</div>
        </div>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {servicios.map((s, i) => (
            <div key={i}
              style={{
                padding: '14px 16px', background: '#f8fafc', border: '1px solid #f1f5f9',
                borderRadius: 12, transition: 'all 0.2s ease', cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#bae6fd';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#f1f5f9';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{s.titulo}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{s.descripcion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inicio;