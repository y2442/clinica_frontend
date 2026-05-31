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
      <div style={{ background: '#0a2540', borderRadius: 14, padding: '2rem', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(55,138,221,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(55,138,221,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'capitalize' }}>{fechaFormateada}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: 'white', marginBottom: 6 }}>
              {saludo}, {usuario?.nombre_usuario}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              Bienvenid@ al Sistema de Gestión de Citas de <span style={{ color: '#378add', fontWeight: 500 }}>Clínica Dental</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ background: 'rgba(55,138,221,0.2)', color: '#85b7eb', fontSize: 12, padding: '4px 12px', borderRadius: 10, fontWeight: 500 }}>
                {usuario?.nombre_rol}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 500, color: 'white', letterSpacing: 2, fontFamily: 'monospace' }}>{horaFormateada}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Hora local — Guatemala</div>
          </div>
        </div>
      </div>

      {/* Galería de imágenes — carrusel */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          {/* Imagen principal */}
          <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
            <img
              src={imagenes[imagenActiva].src}
              alt={imagenes[imagenActiva].titulo}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s ease' }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(10,37,64,0.85))', padding: '30px 20px 16px' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'white' }}>{imagenes[imagenActiva].titulo}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{imagenes[imagenActiva].descripcion}</div>
            </div>
            {/* Flechas navegación */}
            <button
              onClick={() => setImagenActiva(prev => (prev - 1 + imagenes.length) % imagenes.length)}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >‹</button>
            <button
              onClick={() => setImagenActiva(prev => (prev + 1) % imagenes.length)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >›</button>
          </div>

          {/* Miniaturas */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
            {imagenes.map((img, i) => (
              <div key={i} onClick={() => setImagenActiva(i)}
                style={{ flex: 1, height: 70, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${imagenActiva === i ? '#185fa5' : 'transparent'}`, transition: 'border-color 0.2s, opacity 0.2s', opacity: imagenActiva === i ? 1 : 0.6 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = imagenActiva === i ? '1' : '0.6')}
              >
                <img src={img.src} alt={img.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* Puntos indicadores */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 14 }}>
            {imagenes.map((_, i) => (
              <div key={i} onClick={() => setImagenActiva(i)}
                style={{ width: imagenActiva === i ? 20 : 8, height: 8, borderRadius: 4, background: imagenActiva === i ? '#185fa5' : '#d1d5db', cursor: 'pointer', transition: 'all 0.3s' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 16 }}>🦷</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0a2540' }}>Nuestros servicios</div>
        </div>
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {servicios.map((s, i) => (
            <div key={i}
              style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, transition: 'background 0.15s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0a2540', marginBottom: 4 }}>{s.titulo}</div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{s.descripcion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inicio;