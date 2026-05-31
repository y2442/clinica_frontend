

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  estado: number;
  id_rol: number;
  rol?: Rol;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id_usuario: number;
    nombre_usuario: string;
    id_rol: number;
    nombre_rol: string;
  };
}

export interface Paciente {
  id_paciente: number;
  dpi: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  fecha_nacimiento: string;
  fecha_registro: string;
  estado: number;
}

export interface CitaHistorial {
  id_cita: number;
  fecha_cita: string;
  hora_cita: string;
  motivo: string | null;
  observaciones: string | null;
  medico: { nombre: string; apellido: string };
  estado: { nombre: string };
}

export interface Especialidad {
  id_especialidad: number;
  nombre: string;
}

export interface Horario {
  id_horario: number;
  dia_semana: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface Medico {
  id_medico: number;
  dpi: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  fecha_nacimiento: string;
  id_usuario: number;
  usuario: {
    id_usuario: number;
    nombre_usuario: string;
    estado: number;
    rol: { nombre_rol: string };
  };
  especialidades: Especialidad[];
  horarios?: Horario[];
}

export interface SlotDisponibilidad {
  hora: string;
  disponible: boolean;
}

export interface EstadoCita {
  id_estado: number;
  nombre: string;
}

export interface Tratamiento {
  id_tratamiento: number;
  nombre: string;
  descripcion: string | null;
  costo: number;
}

export interface Cita {
  id_cita: number;
  fecha_cita: string;
  hora_cita: string;
  motivo: string | null;
  observaciones: string | null;
  fecha_registro: string;
  paciente: { id_paciente: number; nombre: string; apellido: string; telefono: string };
  medico: { id_medico: number; nombre: string; apellido: string };
  estado: EstadoCita;
  recepcionista: { nombre_usuario: string };
  tratamientos?: (Tratamiento & { citas_tratamientos: { observacion: string | null } })[];
}