//archivo para crear la estructura de la aplicación con react router dom
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
      <Sidebar />
      <main className="app-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;