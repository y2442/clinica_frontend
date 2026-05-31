import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowAuto: 'auto' } as any}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;