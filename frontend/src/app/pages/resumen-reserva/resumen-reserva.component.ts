import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";
import {ContenidoService} from "../../services/contenido.service";
import {
  DatosReserva,
  ReservaResponse,
  ReservaCreacion,
} from "../../models/contenido.models";
import dayjs from "dayjs";

@Component({
  selector: "app-resumen-reserva",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./resumen-reserva.component.html",
  styleUrls: ["./resumen-reserva.component.scss"],
})
export class ResumenReservaComponent implements OnInit {
  // ============================================
  // 1. DATOS DE LA RESERVA
  // ============================================
  datos: DatosReserva | null = null;
  totalNoches: number = 0;
  precioDesayuno: number = 10; // Valor por defecto, se actualizará desde BD

  // ============================================
  // 2. CAMPOS ADICIONALES
  // ============================================
  solicitudEspecial: string = "";
  horaEstimadaLlegada: string = "";

  // ============================================
  // 3. ESTADO DEL FORMULARIO
  // ============================================
  procesando: boolean = false;

  // ============================================
  // 4. MENSAJES
  // ============================================
  mensajeError: string = "";
  mostrarError: boolean = false;
  esError: boolean = false;
  mensajeExito: string = "";
  mostrarExito: boolean = false;

  constructor(
    private router: Router,
    private contenidoService: ContenidoService,
  ) {}

  // ============================================
  // 5. CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    this.cargarDatosReserva();
    this.cargarPrecioDesayuno();
  }

  // ============================================
  // 6. CARGA DE DATOS
  // ============================================

  /**
   * Carga los datos de la reserva desde localStorage
   */
  cargarDatosReserva(): void {
    const datosGuardados = localStorage.getItem("datosReserva");
    if (datosGuardados) {
      try {
        this.datos = JSON.parse(datosGuardados);
        // No eliminar inmediatamente por si hay que volver atrás
        // localStorage.removeItem("datosReserva");

        if (this.datos) {
          this.calcularNoches();
        }
      } catch (error) {
        console.error("❌ Error al cargar datos de reserva:", error);
        this.mostrarMensajeError("Error al cargar los datos de la reserva.");
        this.router.navigate(["/habitaciones"]);
      }
    } else {
      this.router.navigate(["/habitaciones"]);
    }
  }

  /**
   * Carga el precio del desayuno desde la BD
   */
  cargarPrecioDesayuno(): void {
    this.contenidoService
      .getContenidoByClave("habitaciones_desayuno")
      .subscribe({
        next: (item) => {
          const precio = parseFloat(item.valor);
          this.precioDesayuno = isNaN(precio) ? 10 : precio;
        },
        error: (error) => {
          console.error("❌ Error al cargar precio del desayuno:", error);
          this.precioDesayuno = 10;
        },
      });
  }

  // ============================================
  // 7. CÁLCULOS
  // ============================================

  /**
   * Calcula el número de noches correctamente usando dayjs
   */
  calcularNoches(): void {
    if (!this.datos) return;

    try {
      // Intentar parsear fechas en diferentes formatos
      let entrada: dayjs.Dayjs;
      let salida: dayjs.Dayjs;

      // Si las fechas vienen en formato DD/MM/YYYY
      if (this.datos.fechas.entrada.includes("/")) {
        entrada = dayjs(this.datos.fechas.entrada, "DD/MM/YYYY");
        salida = dayjs(this.datos.fechas.salida, "DD/MM/YYYY");
      } else {
        // Si vienen en formato ISO o YYYY-MM-DD
        entrada = dayjs(this.datos.fechas.entrada);
        salida = dayjs(this.datos.fechas.salida);
      }

      // Validar que las fechas sean válidas
      if (!entrada.isValid() || !salida.isValid()) {
        console.error("❌ Fechas inválidas:", this.datos.fechas);
        this.totalNoches = 1;
        return;
      }

      // Calcular diferencia en días
      const diffDays = salida.diff(entrada, "day");

      if (diffDays <= 0) {
        console.error(
          "❌ Error: La fecha de salida debe ser posterior a la de entrada.",
        );
        this.totalNoches = 1;
        return;
      }

      this.totalNoches = diffDays;
    } catch (error) {
      console.error("❌ Error al calcular noches:", error);
      this.totalNoches = 1;
    }
  }

  /**
   * Calcula el precio total de la reserva
   */
  calcularPrecioTotal(): number {
    if (!this.datos) return 0;

    const precioNoche = this.datos.habitacion.precio || 0;
    const noches = this.totalNoches || 1;
    let total = precioNoche * noches;

    // Añadir desayuno si está incluido
    if (this.datos.desayuno) {
      const totalPersonas =
        (this.datos.huespedes.adultos || 0) + (this.datos.huespedes.ninos || 0);
      total += this.precioDesayuno * totalPersonas * noches;
    }

    return total;
  }

  /**
   * Calcula el precio base (sin desayuno)
   */
  calcularPrecioBase(): number {
    if (!this.datos) return 0;
    return (this.datos.habitacion.precio || 0) * (this.totalNoches || 1);
  }

  /**
   * Calcula el precio del desayuno
   */
  calcularPrecioDesayunoTotal(): number {
    if (!this.datos || !this.datos.desayuno) return 0;
    const totalPersonas =
      (this.datos.huespedes.adultos || 0) + (this.datos.huespedes.ninos || 0);
    return this.precioDesayuno * totalPersonas * (this.totalNoches || 1);
  }

  // ============================================
  // 8. FORMATEO DE FECHAS
  // ============================================

  /**
   * Formatea una fecha para mostrarla correctamente
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return "";

    try {
      // Si viene en formato DD/MM/YYYY, devolver igual
      if (fecha.includes("/")) {
        return fecha;
      }

      // Intentar parsear
      const date = dayjs(fecha);
      return date.isValid() ? date.format("DD/MM/YYYY") : fecha;
    } catch {
      return fecha;
    }
  }

  /**
   * Formatea fecha para el backend (YYYY-MM-DD)
   */
  private formatearFechaParaBackend(fecha: string): string {
    if (!fecha) return "";

    try {
      let date: dayjs.Dayjs;

      if (fecha.includes("/")) {
        date = dayjs(fecha, "DD/MM/YYYY");
      } else {
        date = dayjs(fecha);
      }

      return date.isValid() ? date.format("YYYY-MM-DD") : fecha;
    } catch {
      return fecha;
    }
  }

  // ============================================
  // 9. ACCIONES
  // ============================================

  /**
   * Confirma la reserva enviándola al backend
   */
  confirmarReserva(): void {
    // Limpiar mensajes anteriores
    this.mostrarError = false;
    this.mensajeError = "";
    this.mostrarExito = false;
    this.mensajeExito = "";

    if (!this.datos) {
      this.mostrarMensajeError("❌ No hay datos de reserva.");
      return;
    }

    if (!this.datos.cliente?.email) {
      this.mostrarMensajeError("❌ El email del cliente es requerido.");
      return;
    }

    this.procesando = true;

    const datosParaBackend: ReservaCreacion = {
      habitacion_id: Number(this.datos.habitacion.id),
      fecha_entrada: this.formatearFechaParaBackend(
        String(this.datos.fechas.entrada),
      ),
      fecha_salida: this.formatearFechaParaBackend(
        String(this.datos.fechas.salida),
      ),
      adultos: Number(this.datos.huespedes.adultos) || 1,
      ninos: Number(this.datos.huespedes.ninos) || 0,
      desayuno: Boolean(this.datos.desayuno),
      importe_total: this.calcularPrecioTotal(),
      nombre_cliente: String(this.datos.cliente.nombre || ""),
      apellidos_cliente: String(this.datos.cliente.apellidos || ""),
      email_cliente: String(this.datos.cliente.email),
      telefono_cliente: String(this.datos.cliente.telefono || ""),
      dni_cliente: String(this.datos.cliente.dni || ""),
      solicitud_especial: String(this.solicitudEspecial || ""),
      hora_llegada: String(this.horaEstimadaLlegada || ""),
    };

    this.contenidoService.crearReserva(datosParaBackend).subscribe({
      next: (response: ReservaResponse) => {
        this.procesando = false;

        // ✅ Guardar datos de la reserva para la página de confirmación
        if (response.reserva) {
          localStorage.setItem(
            "ultimaReserva",
            JSON.stringify(response.reserva),
          );
        }

        // ✅ Redirigir DIRECTAMENTE a la página de confirmación
        // (sin esperar 3 segundos ni mostrar mensaje aquí)
        this.router.navigate(["/reservas/confirmacion"]);
      },
      error: (err: HttpErrorResponse) => {
        console.error("❌ Error al guardar la reserva:", err);
        this.procesando = false;

        let mensajeError =
          "Error al confirmar la reserva. Inténtalo de nuevo más tarde.";

        if (err.error?.message) {
          mensajeError = err.error.message;
        } else if (err.status === 400) {
          mensajeError = "Datos de reserva inválidos. Verifica la información.";
        } else if (err.status === 500) {
          mensajeError = "Error del servidor. Inténtalo más tarde.";
        }

        this.mostrarMensajeError(`❌ ${mensajeError}`);
      },
    });
  }

  /**
   * Vuelve al detalle de la habitación
   */
  volverAlDetalle(): void {
    if (!this.datos) return;
    // Guardar datos antes de volver
    localStorage.setItem("datosReserva", JSON.stringify(this.datos));
    this.router.navigate(["/habitaciones", this.datos.habitacion.id]);
  }

  // ============================================
  // 10. MENSAJES
  // ============================================

  mostrarMensajeError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarError = true;
    this.esError = true;
    this.mostrarExito = false;
  }
}
