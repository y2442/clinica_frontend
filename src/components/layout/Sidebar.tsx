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

  // Filtrar items según el rol
  const menuFiltrado = todosLosItems.filter(item => item.roles.includes(rol));
  const reportesFiltrado = reporteItems.filter(item => item.roles.includes(rol));

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '9px 12px', borderRadius: 8, display: 'flex', alignItems: 'center',
    gap: 9, fontSize: 13, cursor: 'pointer', textDecoration: 'none',
    marginBottom: 2, transition: 'background 0.18s',
    color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
    background: isActive ? 'rgba(55,138,221,0.25)' : 'transparent',
    borderLeft: isActive ? '2px solid #378add' : '2px solid transparent',
    fontWeight: isActive ? 500 : 400,
  });

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#0a2540',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Patrones decorativos */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(56,142,221,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 40, left: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(56,142,221,0.07)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ padding: '18px 14px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, background: 'rgba(55,138,221,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🦷</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>Clínica Dental</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #378add, #185fa5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 500, color: 'white', flexShrink: 0,
          }}>{inicial}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>{usuario?.nombre_usuario}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{rol}</div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ padding: '12px 8px', flex: 1, position: 'relative', zIndex: 1 }}>
        {menuFiltrado.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '0 8px', marginBottom: 8, letterSpacing: '0.08em' }}>PRINCIPAL</div>
            {menuFiltrado.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => navItemStyle(isActive)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        {reportesFiltrado.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '0 8px', margin: '12px 0 8px', letterSpacing: '0.08em' }}>REPORTES</div>
            {reportesFiltrado.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => navItemStyle(isActive)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Cerrar sesión */}
      <div style={{ padding: '10px 8px', borderTop: '0.5px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, display: 'flex',
            alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none',
            transition: 'background 0.18s, color 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,50,50,0.15)'; e.currentTarget.style.color = '#f09595'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <i className="ti ti-logout" style={{ fontSize: 16 }} aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;