// frontend/src/app/services/contenido.service.ts

import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, tap, map} from "rxjs";
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
  ContenidoWeb,
  FooterData,
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

  // ✅ Obtener contenido por clave
  getContenidoByClave(clave: string): Observable<ContenidoWeb> {
    return this.http.get<ContenidoWeb>(`${this.apiUrl}/clave/${clave}`);
  }

  // ✅ Obtener múltiples claves
  getContenidoMultiple(claves: string[]): Observable<ContenidoWeb[]> {
    return this.http.post<ContenidoWeb[]>(`${this.apiUrl}/multiples`, {claves});
  }

  // ✅ Obtener datos del footer y transformarlos a FooterData
  getFooterData(): Observable<FooterData> {
    const claves = [
      "footer_nombre",
      "footer_direccion",
      "footer_telefono",
      "footer_email_normal",
      "footer_slogan",
    ];

    return this.getContenidoMultiple(claves).pipe(
      map((items: ContenidoWeb[]) => {
        const datos: Record<string, string> = {};
        items.forEach((item) => {
          datos[item.clave] = item.valor;
        });

        return {
          nombre: datos["footer_nombre"] || "Hotel Amanecer en Campos",
          direccion: datos["footer_direccion"] || "Camino del Molino, 1",
          telefono: datos["footer_telefono"] || "+34 123 456 789",
          email: datos["footer_email_normal"] || "info@hotelamanecer.com",
          emailContacto:
            datos["footer_email_normal"] || "info@hotelamanecer.com",
          slogan:
            datos["footer_slogan"] ||
            "Un lugar donde la naturaleza y el confort se encuentran",
        };
      }),
    );
  }

  // ============================================
  // PÁGINAS LEGALES
  // ============================================
  getPaginasLegalesAdmin(): Observable<PaginaLegal[]> {
    return this.http.get<PaginaLegal[]>(`${this.baseApiUrl}/legal`);
  }

  getPaginaLegal(clave: string): Observable<PaginaLegal> {
    return this.http.get<PaginaLegal>(`${this.baseApiUrl}/legal/${clave}`);
  }

  crearPaginaLegal(datos: PaginaLegalCreacion): Observable<PaginaLegal> {
    return this.http.post<PaginaLegal>(`${this.baseApiUrl}/legal`, datos);
  }

  actualizarPaginaLegal(
    datos: PaginaLegalActualizacion,
  ): Observable<PaginaLegal> {
    return this.http.put<PaginaLegal>(
      `${this.baseApiUrl}/legal/${datos.id}`,
      datos,
    );
  }

  eliminarPaginaLegal(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.baseApiUrl}/legal/${id}`,
    );
  }

  // ============================================
  // REDES SOCIALES
  // ============================================
  getRedesSocialesAdmin(): Observable<RedSocial[]> {
    return this.http.get<RedSocial[]>(`${this.baseApiUrl}/redes`);
  }

  getRedesSociales(): Observable<RedSocial[]> {
    return this.http.get<RedSocial[]>(`${this.baseApiUrl}/redes/activas`);
  }

  crearRedSocial(datos: RedSocialCreacion): Observable<RedSocial> {
    return this.http.post<RedSocial>(`${this.baseApiUrl}/redes`, datos);
  }

  actualizarRedSocial(datos: RedSocialActualizacion): Observable<RedSocial> {
    return this.http.put<RedSocial>(
      `${this.baseApiUrl}/redes/${datos.id}`,
      datos,
    );
  }

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

  getPrecioDesayuno(): Observable<number> {
    return this.getContenidoByClave("habitaciones_desayuno").pipe(
      map((item: ContenidoWeb) => {
        const precio = parseFloat(item.valor);
        return isNaN(precio) ? 10 : precio; // Si no se puede parsear, usar 10 como default
      }),
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

  getReservasSimple(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.baseApiUrl}/reservas`).pipe(
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

  // ============================================
  // SERVICIOS
  // ============================================
  getServiciosAdmin(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.baseApiUrl}/servicios/admin`);
  }

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
}
