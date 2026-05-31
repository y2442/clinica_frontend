import axios from 'axios';

//crea una instancia de axios con la URL base del backend
/*const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});*/

//configura la instancia de axios con la URL base del backend, tomada de las variables de entorno
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

//agrega el token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//si el token expira o es inválido, redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      //evitar recargar la página si ya estamos en el login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;