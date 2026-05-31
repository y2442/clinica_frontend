import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Usuarios from './pages/usuarios/Usuarios';
import Pacientes from './pages/pacientes/Pacientes';
import DetallePaciente from './pages/pacientes/DetallePaciente';
import Medicos from './pages/medicos/Medicos';
import DetalleMedico from './pages/medicos/DetalleMedico';
import Citas from './pages/citas/Citas';
import DetalleCita from './pages/citas/DetalleCita';
import Inicio from './pages/Inicio';
import Tratamientos from './pages/tratamientos/Tratamientos';
import Reportes from './pages/reportes/Reportes';
import RutaRol from './components/RutaRol';

// Protege rutas que requieren login
const RutaProtegida = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

// Rutas separadas para que RutaProtegida esté dentro del AuthProvider
/*const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <RutaProtegida>
          <Layout />
        </RutaProtegida>
      }>
        <Route index element={<Navigate to="/inicio" />} />
        <Route path="inicio" element={<Inicio />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="pacientes/:id" element={<DetallePaciente />} />
        <Route path="medicos" element={<Medicos />} />
        <Route path="medicos/:id" element={<DetalleMedico />} />
        <Route path="citas" element={<Citas />} />
        <Route path="citas/:id" element={<DetalleCita />} />
        <Route path="tratamientos" element={<Tratamientos />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};*/

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <RutaProtegida>
          <Layout />
        </RutaProtegida>
      }>
        <Route index element={<Navigate to="/inicio" />} />

        {/* Todos los roles ----*/}
        <Route path="inicio" element={<Inicio />} />
        <Route path="citas" element={<Citas />} />
        <Route path="citas/:id" element={<DetalleCita />} />
        <Route path="tratamientos" element={<Tratamientos />} />

        {/* Solo Administrador */}
        <Route path="usuarios" element={
          <RutaRol roles={['Administrador']}>
            <Usuarios />
          </RutaRol>
        } />
        <Route path="reportes" element={
          <RutaRol roles={['Administrador']}>
            <Reportes />
          </RutaRol>
        } />

        {/* Administrador y Recepcionista */}
        <Route path="pacientes" element={
          <RutaRol roles={['Administrador', 'Recepcionista']}>
            <Pacientes />
          </RutaRol>
        } />
        <Route path="pacientes/:id" element={
          <RutaRol roles={['Administrador', 'Recepcionista']}>
            <DetallePaciente />
          </RutaRol>
        } />
        <Route path="medicos" element={
          <RutaRol roles={['Administrador', 'Recepcionista']}>
            <Medicos />
          </RutaRol>
        } />
        <Route path="medicos/:id" element={
          <RutaRol roles={['Administrador', 'Recepcionista']}>
            <DetalleMedico />
          </RutaRol>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;