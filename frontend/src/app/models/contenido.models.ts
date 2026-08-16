// frontend/src/app/models/contenido.models.ts

export interface Contenido {
  id: number;
  titulo: string;
  descripcion: string;
  imagen?: string;
  seccion: string;
  orden?: number;
  activo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Servicio {
  id: number;

  titulo: string;
  descripcion: string;
  icono: string;
  orden: number;
  activo: boolean;
  fecha_actualizacion?: string;
}
export interface Habitacion {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagen: string;
  activo: boolean;
  capacidad_adultos: number;
  capacidad_ninos: number;
  caracteristicas: string[];
  fecha_actualizacion: string;
  disponible?: boolean;
  categoria?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReservaBusqueda {
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  ninos: number;
  habitacionId?: number;
}

export interface Reserva {
  id: number;
  habitacion_id: number;
  habitacion_nombre?: string;
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  ninos: number;
  desayuno: boolean;
  importe_total: number;
  nombre_cliente: string;
  apellidos_cliente?: string;
  email_cliente: string;
  telefono_cliente: string;
  dni_cliente?: string;
  hora_llegada?: string;
  solicitud_especial?: string;
  codigo_reserva: string;
  hash_seguro?: string;
  token_prechecking?: string;
  prechecking_realizado: boolean;
  fecha_prechecking?: string;
  dni_frontal_url?: string;
  dni_trasero_url?: string;
  fecha_creacion: string;
  estado?: string;
}
export interface ReservaFiltros {
  fecha_entrada?: string;
  fecha_salida?: string;
  estado?: string;
}

export interface ReservaCreacion {
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  ninos: number;
  desayuno: boolean;
  importe_total: number;
  nombre_cliente: string;
  apellidos_cliente?: string;
  email_cliente: string;
  telefono_cliente: string;
  dni_cliente?: string;
  solicitud_especial?: string;
  hora_llegada?: string;
}

export interface ReservaDetalle {
  id: number;
  habitacionId: number;
  habitacionNombre?: string;
  fechaEntrada: string;
  fechaSalida: string;
  huespedes: number;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  precioTotal: number;
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string;
  observaciones?: string;
  fechaCreacion: Date;
}

export interface ServicioHotel {
  id: number;
  titulo?: string;
  descripcion: string;
  icono?: string;
  precio?: number;
  disponible?: boolean;
  categoria?: string;
}

export interface ContenidoSeccion {
  [key: string]: string | number | boolean | undefined;
}

export interface BusquedaDisponibilidad {
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  ninos: number;
}

export interface TildeMap {
  [key: string]: string;
}

export interface DatosReserva {
  habitacion: {
    id: number;
    nombre: string;
    descripcion: string;
    imagen: string;
    precio: number;
    precioNoche?: number;
    capacidad: number;
    servicios?: string[];
    caracteristicas?: string[];
    capacidad_adultos?: number;
    capacidad_ninos?: number;
  };
  fechas: {
    entrada: string;
    salida: string;
    noches: number;
  };
  huespedes: {
    adultos: number;
    ninos: number;
  };
  desayuno: boolean;
  cliente: {
    nombre: string;
    apellidos: string;
    direccion?: string;
    telefono: string;
    dni: string;
    email: string;
  };
  importe: number;
}

export interface ReservaResponse {
  message: string;
  reserva: {
    id: number;
    habitacion_id: number;
    fecha_entrada: string;
    fecha_salida: string;
    adultos: number;
    ninos: number;
    desayuno: boolean;
    importe_total: number;
    nombre_cliente: string;
    apellidos_cliente?: string;
    email_cliente: string;
    telefono_cliente: string;
    dni_cliente?: string;
    solicitud_especial?: string;
    hora_llegada?: string;
    estado: string;
    created_at: string;
    codigo_reserva: string;
    hash_seguro?: string;
    token_prechecking?: string;
  };
}

export interface ReservaData {
  id: number;
  habitacion_id: number;
  codigo_reserva: string;
  hash_seguro: string;
  fecha_entrada: string;
  fecha_salida: string;
  adultos: number;
  ninos: number;
  desayuno: boolean;
  importe_total: number;
  nombre_cliente: string;
  apellidos_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  dni_cliente: string;
  solicitud_especial?: string;
  estado: "pendiente" | "confirmada" | "cancelada";
  created_at: string;
  habitacion_nombre: string;
  habitacion_descripcion: string;
  habitacion_caracteristicas: string[];
  habitacion_imagen: string;
  habitacion_precio: number;
}

// ============================================
// ✅ INTERFACES PARA PRECHECKING (SES.HOSPEDAJES)
// ============================================

export interface MenorData {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  parentesco: "Hijo/a" | "Nieto/a" | "Sobrino/a" | "Otro";
  tipoDocumento?: "DNI" | "NIE" | "Pasaporte" | "Otro";
  numeroDocumento?: string;
}

export interface PrecheckingData {
  nombre: string;
  apellidos: string;
  tipoDocumento: "DNI" | "NIE" | "Pasaporte" | "Otro";
  numeroDocumento: string;
  fechaExpedicion: string;
  nacionalidad: string;
  fechaNacimiento: string;
  residenciaHabitual: string;
  telefono: string;
  email: string;
  vehiculoMatricula?: string;
  menores?: MenorData[];
  observaciones?: string;
  dniFrontalUrl?: string;
  dniTraseroUrl?: string;
}

export interface TokenVerificationResponse {
  success: boolean;
  reserva: Reserva;
}

export interface PrecheckingResponse {
  success: boolean;
  message: string;
  data?: {
    reservaId: number;
    viajeroId: number;
  };
}

export interface DniUploadResponse {
  success: boolean;
  message: string;
  archivo: {
    frontal?: string;
    trasero?: string;
  };
}

export interface DniOcrResponse {
  success: boolean;
  message: string;
  tipo?: "frontal" | "trasero";
  data?: {
    nombre?: string;
    apellidos?: string;
    tipoDocumento?: "DNI" | "NIE" | "Pasaporte" | "Otro";
    numeroDocumento?: string;
    fechaExpedicion?: string;
    nacionalidad?: string;
    fechaNacimiento?: string;
    residencia?: string;
  };
}

// ============================================
// ✅ INTERFACES PARA ADMIN (HABITACIONES, CONTENIDO)
// ============================================

export interface ContenidoData {
  [key: string]: string | number | boolean | undefined;
}

export interface ActualizarContenidoResponse {
  success: boolean;
  message: string;
  data?: ContenidoData;
}

export interface HabitacionCreacion {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  caracteristicas: string[];
  capacidad_adultos: number;
  capacidad_ninos: number;
  activo: boolean;
}

export interface HabitacionActualizacion {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  caracteristicas: string[];
  capacidad_adultos: number;
  capacidad_ninos: number;
  activo: boolean;
}

export interface HabitacionResponse {
  success: boolean;
  message: string;
  data?: Habitacion;
}

export interface ServicioCreacion {
  titulo: string;
  descripcion: string;
  icono: string;
  orden: number;
  activo: boolean;
}

export interface ServicioActualizacion extends ServicioCreacion {
  id: number;
}

// Exportar lista de iconos disponibles
export const ICONOS_DISPONIBLES = [
  // Servicios comunes
  "bi-wifi",
  "bi-car-front",
  "bi-droplet",
  "bi-bicycle",
  "bi-tree",
  "bi-sun",
  "bi-moon",
  "bi-cloud-sun",
  "bi-umbrella",
  "bi-snow",

  // Comida y bebida
  "bi-cup-hot",
  "bi-cup-straw",
  "bi-egg-fried",
  "bi-basket",
  "bi-cake",
  "bi-wine",
  "bi-beer",

  // Entretenimiento
  "bi-tv",
  "bi-music-note",
  "bi-headphones",
  "bi-film",
  "bi-camera",
  "bi-palette",
  "bi-dice-5",

  // Deportes
  "bi-dribbble",
  "bi-trophy",
  "bi-heart-pulse",
  "bi-bicycle",
  "bi-person-walking",
  "bi-person-swimming",
  "bi-person-arms-up",

  // Servicios
  "bi-clock",
  "bi-calendar",
  "bi-telephone",
  "bi-envelope",
  "bi-geo-alt",
  "bi-shop",
  "bi-bag",
  "bi-box",
  "bi-truck",
  "bi-house",
  "bi-building",
  "bi-hospital",
  "bi-bank",
  "bi-cash",
  "bi-credit-card",

  // Naturaleza
  "bi-flower1",
  "bi-flower2",
  "bi-flower3",
  "bi-tree",
  "bi-pine",
  "bi-cactus",
  "bi-palm",

  // Otros
  "bi-star",
  "bi-heart",
  "bi-shield-check",
  "bi-award",
  "bi-gem",
  "bi-rocket",
  "bi-infinity",
];

// ============================================
// PÁGINAS LEGALES
// ============================================
export interface PaginaLegal {
  id: number;
  clave: string;
  titulo: string;
  contenido: string;
  fecha_actualizacion?: string;
}

export interface PaginaLegalCreacion {
  clave: string;
  titulo: string;
  contenido: string;
}

export interface PaginaLegalActualizacion extends PaginaLegalCreacion {
  id: number;
}

// ✅ Para la vista de edición con 3 editores
export interface PaginasLegalesData {
  aviso_legal: PaginaLegal;
  politica_privacidad: PaginaLegal;
  politica_cookies: PaginaLegal;
}

// ============================================
// REDES SOCIALES
// ============================================
export interface RedSocial {
  id: number;
  nombre: string;
  icono: string;
  url: string;
  activo: boolean;
  orden: number;
  fecha_actualizacion?: string;
}

export interface RedSocialCreacion {
  nombre: string;
  icono: string;
  url: string;
  activo: boolean;
  orden: number;
}

export interface RedSocialActualizacion extends RedSocialCreacion {
  id: number;
}

// ============================================
// ICONOS PARA REDES SOCIALES
// ============================================
export const ICONOS_REDES_DISPONIBLES = [
  // Redes sociales principales
  "bi-facebook",
  "bi-instagram",
  "bi-twitter-x",
  "bi-youtube",
  "bi-tiktok",
  "bi-whatsapp",
  "bi-telegram",
  "bi-linkedin",
  "bi-pinterest",
  "bi-snapchat",
  "bi-reddit",
  "bi-discord",
  "bi-twitch",
  "bi-spotify",
  "bi-apple",
  "bi-google",
  "bi-microsoft",
  "bi-amazon",

  // Otras redes y plataformas
  "bi-medium",
  "bi-flickr",
  "bi-tumblr",
  "bi-vimeo",
  "bi-dribbble",
  "bi-behance",
  "bi-github",
  "bi-stack-overflow",
  "bi-dev",
  "bi-hash",
  "bi-chat",
  "bi-share",
  "bi-link",
  "bi-globe",
  "bi-rss",
  "bi-envelope",
  "bi-phone",
];
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}
export interface SeccionesData {
  [seccion: string]: ContenidoSeccion;
}
