import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const todosLosItems = [
  { to: '/inicio', icon: 'ti-home', label: 'Inicio', roles: ['Administrador', 'Médico', 'Recepcionista'] },
  { to: '/usuarios', icon: 'ti-users', label: 'Usuarios', roles: ['Administrador'] },
  { to: '/pacientes', icon: 'ti-user', label: 'Pacientes', roles: ['Administrador', 'Recepcionista'] },
  { to: '/medicos', icon: 'ti-stethoscope', label: 'Médicos', roles: ['Administrador', 'Recepcionista'] },
  { to: '/citas', icon: 'ti-calendar', label: 'Citas', roles: ['Administrador', 'Médico', 'Recepcionista'] },
  { to: '/tratamientos', icon: 'ti-pill', label: 'Tratamientos', roles: ['Administrador', 'Médico', 'Recepcionista'] },
];

const reporteItems = [
  { to: '/reportes', icon: 'ti-chart-bar', label: 'Reportes', roles: ['Administrador'] },
];

const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const rol = usuario?.nombre_rol || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inicial = usuario?.nombre_usuario?.charAt(0).toUpperCase() || 'U';

  const menuFiltrado = todosLosItems.filter(item => item.roles.includes(rol));
  const reportesFiltrado = reporteItems.filter(item => item.roles.includes(rol));

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13.5,
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: 4,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
    background: isActive
      ? 'linear-gradient(90deg, rgba(55, 138, 221, 0.28) 0%, rgba(55, 138, 221, 0.08) 100%)'
      : 'transparent',
    boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
  });

  return (
    <aside style={{
      width: 235,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #07192c 0%, #030d18 100%)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      boxSizing: 'border-box',
      userSelect: 'none',
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Luces y patrones ambientales */}
      <div style={{
        position: 'absolute', top: -70, right: -70, width: 200, height: 200,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,142,221,0.18) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 60, left: -50, width: 160, height: 160,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none', filter: 'blur(30px)',
      }} />

      {/* Header institucional */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #185fa5 0%, #0284c7 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            color: 'white', flexShrink: 0,
          }}>
            🦷
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              DentaCare
            </div>
            <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 500, marginTop: 2 }}>
              Gestión Odontológica
            </div>
          </div>
        </div>

        {/* Tarjeta de usuario */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12, padding: '10px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #185fa5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {inicial}
            </div>
            <span style={{
              position: 'absolute', bottom: 0, right: 0, width: 9, height: 9,
              borderRadius: '50%', background: '#22c55e', border: '2px solid #07192c',
            }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#ffffff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {usuario?.nombre_usuario}
            </div>
            <div style={{
              fontSize: 10.5, fontWeight: 500, color: '#94a3b8',
              marginTop: 1, textTransform: 'capitalize',
            }}>
              {rol}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav style={{ padding: '14px 10px', flex: 1, position: 'relative', zIndex: 2, overflowY: 'auto' }}>
        {menuFiltrado.length > 0 && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255, 255, 255, 0.35)',
              padding: '0 10px', marginBottom: 8, letterSpacing: '0.08em',
            }}>
              MÓDULOS
            </div>
            {menuFiltrado.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => navItemStyle(isActive)}
                onMouseEnter={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, background: '#38bdf8', borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 8px #38bdf8',
                      }} />
                    )}
                    <i className={`ti ${item.icon}`} style={{
                      fontSize: 17,
                      color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.55)',
                      transition: 'color 0.2s',
                    }} aria-hidden="true" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}

        {reportesFiltrado.length > 0 && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255, 255, 255, 0.35)',
              padding: '0 10px', margin: '16px 0 8px', letterSpacing: '0.08em',
            }}>
              ANALÍTICA
            </div>
            {reportesFiltrado.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => navItemStyle(isActive)}
                onMouseEnter={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, background: '#38bdf8', borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 8px #38bdf8',
                      }} />
                    )}
                    <i className={`ti ${item.icon}`} style={{
                      fontSize: 17,
                      color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.55)',
                      transition: 'color 0.2s',
                    }} aria-hidden="true" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer / Cerrar sesión */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 2,
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.6)',
            background: 'transparent',
            border: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: 17 }} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;