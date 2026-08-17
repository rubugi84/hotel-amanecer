// frontend/src/app/models/administrador.models.ts

export interface Administrador {
  id: number;
  usuario: string;
  email: string;
  nombre: string;
  rol: "admin" | "editor" | "viewer";
  ultimo_acceso?: string;
  activo?: boolean;
}

export interface HabitacionAdmin {
  id: number;
  nombre: string;
  precio: number;
  activo: boolean;
  descripcion?: string;
  imagen?: string;
  capacidad_adultos?: number;
  capacidad_ninos?: number;
  caracteristicas?: string[];
}

export interface ServicioAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
  activo: boolean;
  fecha_actualizacion?: string;
}

export interface RedSocialAdmin {
  id: number;
  nombre: string;
  url: string;
  icono: string;
  activo?: boolean;
}

export interface ReservaAdmin {
  id: number;
  codigo: string;
  cliente: string;
  fecha: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  email?: string;
  telefono?: string;
}

export interface PrecheckingAdmin {
  id: number;
  reserva: string;
  cliente: string;
  fecha: string;
  estado: "pendiente" | "completado";
}

export interface UsuarioAdmin {
  id: number;
  usuario: string;
  email: string;
  nombre: string;
  rol: "admin" | "editor" | "viewer";
  activo?: boolean;
}

export interface EstadisticasAdmin {
  reservasHoy: number;
  reservasSemana: number;
  precheckingsPendientes: number;
  habitacionesDisponibles: number;
}

export interface TinyMCEBlobInfo {
  id: () => string;
  name: () => string;
  filename: () => string;
  blob: () => Blob;
  base64: () => string;
  blobUri: () => string;
  uri: () => string | undefined;
}

export interface AboutContentResponse {
  about_content?: string;
  about_title?: string;
  about_subtitle?: string;
  about_text_1?: string;
  about_text_2?: string;
  about_btn_text?: string;
  imagen?: string;
}
export interface EstadisticasAdmin {
  reservasHoy: number;
  reservasSemana: number;
  precheckingsPendientes: number;
  habitacionesDisponibles: number;
}

export interface ReservaReciente {
  id: number;
  habitacion_id: number;
  habitacion_nombre: string;
  fecha_entrada: string;
  fecha_salida: string;
  nombre_cliente: string;
  apellidos_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  adultos: number;
  ninos: number;
  desayuno: boolean;
  importe_total: number;
  codigo_reserva: string;
  estado: string;
  fecha_creacion: string;
}
