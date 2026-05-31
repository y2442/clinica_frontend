//este componente se encarga de proteger las rutas segun el rol del usuario, 
//si el rol no es el correcto redirige a la pagina de inicio

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  roles: string[];
}

const RutaRol = ({ children, roles }: Props) => {
  const { usuario } = useAuth();
  const rol = usuario?.nombre_rol || '';

  if (!roles.includes(rol)) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};

export default RutaRol;