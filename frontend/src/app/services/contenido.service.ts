// frontend/src/app/services/contenido.service.ts

import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, tap} from "rxjs";
import {environment} from "../../environments/environment";
import {
  ContenidoSeccion,
  Servicio,
  RedSocial,
  PaginaLegal,
  Habitacion,
  ReservaCreacion,
  ReservaResponse,
  BusquedaDisponibilidad,
  HabitacionCreacion,
  HabitacionActualizacion,
  HabitacionResponse,
  ContenidoData,
  ActualizarContenidoResponse,
  ServicioCreacion,
  ServicioActualizacion,
  PaginaLegalCreacion,
  PaginaLegalActualizacion,
  RedSocialCreacion,
  RedSocialActualizacion,
  Reserva,
  ReservaFiltros,
  SeccionesData,
} from "../models/contenido.models";

@Injectable({
  providedIn: "root",
})
export class ContenidoService {
  private apiUrl = environment.apiUrl + "/contenido";
  private baseApiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============================================
  // CONTENIDO
  // ============================================
  getContenidoBySeccion(seccion: string): Observable<ContenidoSeccion> {
    return this.http.get<ContenidoSeccion>(`${this.apiUrl}/seccion/${seccion}`);
  }

  actualizarContenido(
    seccion: string,
    datos: ContenidoData,
  ): Observable<ActualizarContenidoResponse> {
    return this.http.put<ActualizarContenidoResponse>(
      `${this.apiUrl}/seccion/${seccion}`,
      datos,
    );
  }

  // ============================================
  // PÁGINAS LEGALES
  // ============================================
  // Admin: Obtener todas las páginas legales
  getPaginasLegalesAdmin(): Observable<PaginaLegal[]> {
    return this.http.get<PaginaLegal[]>(`${this.baseApiUrl}/legal`);
  }

  // Público: Obtener página legal por clave
  getPaginaLegal(clave: string): Observable<PaginaLegal> {
    return this.http.get<PaginaLegal>(`${this.baseApiUrl}/legal/${clave}`);
  }

  // Admin: Crear nueva página legal
  crearPaginaLegal(datos: PaginaLegalCreacion): Observable<PaginaLegal> {
    return this.http.post<PaginaLegal>(`${this.baseApiUrl}/legal`, datos);
  }

  // Admin: Actualizar página legal
  actualizarPaginaLegal(
    datos: PaginaLegalActualizacion,
  ): Observable<PaginaLegal> {
    return this.http.put<PaginaLegal>(
      `${this.baseApiUrl}/legal/${datos.id}`,
      datos,
    );
  }

  // Admin: Eliminar página legal
  eliminarPaginaLegal(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.baseApiUrl}/legal/${id}`,
    );
  }

  // ============================================
  // REDES SOCIALES
  // ============================================
  // Admin: Obtener todas las redes sociales
  getRedesSocialesAdmin(): Observable<RedSocial[]> {
    return this.http.get<RedSocial[]>(`${this.baseApiUrl}/redes`);
  }

  // Público: Obtener solo redes activas
  getRedesSociales(): Observable<RedSocial[]> {
    return this.http.get<RedSocial[]>(`${this.baseApiUrl}/redes/activas`);
  }

  // Admin: Crear nueva red social
  crearRedSocial(datos: RedSocialCreacion): Observable<RedSocial> {
    return this.http.post<RedSocial>(`${this.baseApiUrl}/redes`, datos);
  }

  // Admin: Actualizar red social
  actualizarRedSocial(datos: RedSocialActualizacion): Observable<RedSocial> {
    return this.http.put<RedSocial>(
      `${this.baseApiUrl}/redes/${datos.id}`,
      datos,
    );
  }

  // Admin: Eliminar red social
  eliminarRedSocial(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.baseApiUrl}/redes/${id}`,
    );
  }

  // ============================================
  // HABITACIONES
  // ============================================
  getHabitaciones(): Observable<Habitacion[]> {
    return this.http.get<Habitacion[]>(`${this.baseApiUrl}/habitaciones`);
  }

  buscarHabitacionesDisponibles(
    datos: BusquedaDisponibilidad,
  ): Observable<Habitacion[]> {
    return this.http.post<Habitacion[]>(
      `${this.baseApiUrl}/reservas/buscar`,
      datos,
    );
  }

  crearHabitacion(datos: HabitacionCreacion): Observable<HabitacionResponse> {
    return this.http.post<HabitacionResponse>(
      `${this.baseApiUrl}/habitaciones`,
      datos,
    );
  }

  actualizarHabitacion(
    datos: HabitacionActualizacion,
  ): Observable<HabitacionResponse> {
    return this.http.put<HabitacionResponse>(
      `${this.baseApiUrl}/habitaciones/${datos.id}`,
      datos,
    );
  }

  eliminarHabitacion(
    id: number,
    imagen?: string,
  ): Observable<{message: string}> {
    let url = `${this.baseApiUrl}/habitaciones/${id}`;

    if (imagen) {
      const imagenClean = imagen.startsWith("/") ? imagen.substring(1) : imagen;
      url += `?imagen=${encodeURIComponent(imagenClean)}`;
    }

    return this.http.delete<{message: string}>(url);
  }

  // ============================================
  // RESERVAS
  // ============================================
  getReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.baseApiUrl}/reservas`);
  }

  getReservasConFiltros(filtros: ReservaFiltros): Observable<Reserva[]> {
    let url = `${this.baseApiUrl}/reservas`;
    const params = new URLSearchParams();

    if (filtros.fecha_entrada) {
      params.append("fecha_entrada", filtros.fecha_entrada);
    }
    if (filtros.fecha_salida) {
      params.append("fecha_salida", filtros.fecha_salida);
    }
    if (filtros.estado) {
      params.append("estado", filtros.estado);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return this.http.get<Reserva[]>(url);
  }

  crearReserva(datos: ReservaCreacion): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(
      `${this.baseApiUrl}/reservas`,
      datos,
    );
  }

  actualizarReserva(datos: Reserva): Observable<Reserva> {
    return this.http.put<Reserva>(
      `${this.baseApiUrl}/reservas/${datos.id}`,
      datos,
    );
  }

  eliminarReserva(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.baseApiUrl}/reservas/${id}`,
    );
  }
  reenviarEmailConfirmacion(
    id: number,
  ): Observable<{message: string; email?: string; codigo?: string}> {
    return this.http.post<{message: string; email?: string; codigo?: string}>(
      `${this.baseApiUrl}/reservas/${id}/reenviar-email`,
      {},
    );
  }

  actualizarEstadoReserva(id: number, estado: string): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.baseApiUrl}/reservas/${id}/estado`, {
      estado,
    });
  }

  realizarCheckin(id: number): Observable<{message: string}> {
    return this.http.post<{message: string}>(
      `${this.baseApiUrl}/reservas/${id}/checkin`,
      {},
    );
  }

  // ============================================
  // UPLOAD
  // ============================================
  subirImagen(formData: FormData): Observable<{ruta: string}> {
    return this.http.post<{ruta: string}>(
      `${this.baseApiUrl}/upload`,
      formData,
    );
  }

  subirImagenHabitacion(formData: FormData): Observable<{ruta: string}> {
    return this.http.post<{ruta: string}>(
      `${this.baseApiUrl}/upload/habitacion`,
      formData,
    );
  }

  // ============================================
  // SERVICIOS
  // ============================================
  // Admin: Obtener todos los servicios
  getServiciosAdmin(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.baseApiUrl}/servicios/admin`);
  }

  // Público: Obtener servicios activos
  getServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.baseApiUrl}/servicios`);
  }

  crearServicio(datos: ServicioCreacion): Observable<Servicio> {
    return this.http.post<Servicio>(`${this.baseApiUrl}/servicios`, datos);
  }

  actualizarServicio(datos: ServicioActualizacion): Observable<Servicio> {
    return this.http.put<Servicio>(
      `${this.baseApiUrl}/servicios/${datos.id}`,
      datos,
    );
  }

  eliminarServicio(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.baseApiUrl}/servicios/${id}`,
    );
  }

  // frontend/src/app/services/contenido.service.ts

  getReservasSimple(): Observable<Reserva[]> {
    // ✅ Usar el endpoint GET /reservas (que ya existe y funciona)
    const url = `${this.baseApiUrl}/reservas`;

    return this.http.get<Reserva[]>(url).pipe(
      tap({
        next: (_data) => {
          // Verificar tokens
        },
        error: (error) => {
          console.error("❌ [SERVICE] Error:", error);
        },
      }),
    );
  }
  // ✅ Obtener todas las secciones con su contenido
  getTodasSecciones(): Observable<SeccionesData> {
    return this.http.get<SeccionesData>(`${this.apiUrl}/secciones`);
  }

  // ✅ Obtener lista de secciones
  getSeccionesLista(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/secciones/lista`);
  }

  // ✅ Actualizar sección completa
  actualizarSeccion(
    seccion: string,
    datos: ContenidoSeccion,
  ): Observable<{success: boolean; message: string; data: ContenidoSeccion}> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: ContenidoSeccion;
    }>(`${this.apiUrl}/seccion/${seccion}`, datos);
  }

  // ✅ Subir imagen del hero
  subirImagenHero(
    formData: FormData,
  ): Observable<{success: boolean; message: string; ruta: string}> {
    return this.http.post<{success: boolean; message: string; ruta: string}>(
      `${this.baseApiUrl}/upload/hero`,
      formData,
    );
  }

  // ✅ Eliminar imagen del hero
  eliminarImagenHero(
    ruta: string,
  ): Observable<{success: boolean; message: string}> {
    return this.http.delete<{success: boolean; message: string}>(
      `${this.baseApiUrl}/upload/hero?ruta=${encodeURIComponent(ruta)}`,
    );
  }
}
