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

@Component({
  selector: "app-resumen-reserva",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./resumen-reserva.component.html",
  styleUrls: ["./resumen-reserva.component.scss"],
})
export class ResumenReservaComponent implements OnInit {
  datos: DatosReserva | null = null;
  solicitudEspecial: string = "";
  horaEstimadaLlegada: string = "";
  totalNoches: number = 0;

  // ✅ VARIABLES PARA MENSAJES
  mensajeError: string = "";
  mostrarError: boolean = false;
  esError: boolean = false;
  mensajeExito: string = "";
  mostrarExito: boolean = false;
  procesando: boolean = false;

  constructor(
    private router: Router,
    private contenidoService: ContenidoService,
  ) {}

  ngOnInit(): void {
    const datosGuardados = localStorage.getItem("datosReserva");
    if (datosGuardados) {
      this.datos = JSON.parse(datosGuardados);
      localStorage.removeItem("datosReserva");

      if (this.datos) {
        this.calcularNochesYValidarPrecio();
      }
    } else {
      this.router.navigate(["/habitaciones"]);
    }
  }

  private calcularNochesYValidarPrecio(): void {
    if (!this.datos) return;

    const entrada = new Date(this.datos.fechas.entrada);
    const salida = new Date(this.datos.fechas.salida);

    const diffTime = salida.getTime() - entrada.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      console.error(
        "❌ Error: La fecha de salida debe ser posterior a la de entrada.",
      );
      this.totalNoches = 0;
      return;
    }

    this.totalNoches = diffDays;
  }

  private formatearFechaParaBackend(fecha: string | Date): string {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ✅ CONFIRMAR RESERVA - CORREGIDO (sin alerts)
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

    const formatearFecha = (fechaStr: string): string => {
      if (!fechaStr) return "";
      const partes = fechaStr.split("/");
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
      }
      return fechaStr;
    };

    const importeTotal = Number(this.datos.importe) || 0;

    const datosParaBackend: ReservaCreacion = {
      habitacion_id: Number(this.datos.habitacion.id),
      fecha_entrada: formatearFecha(String(this.datos.fechas.entrada)),
      fecha_salida: formatearFecha(String(this.datos.fechas.salida)),
      adultos: Number(this.datos.huespedes.adultos) || 1,
      ninos: Number(this.datos.huespedes.ninos) || 0,
      desayuno: Boolean(this.datos.desayuno),
      importe_total: importeTotal,
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

        // ✅ Mostrar mensaje de éxito
        this.mostrarExito = true;
        this.mensajeExito = `✅ ¡Reserva confirmada con éxito! Código: ${response.reserva?.codigo_reserva || "N/A"}`;

        // ✅ Guardar datos de la reserva para el prechecking
        if (response.reserva) {
          localStorage.setItem(
            "ultimaReserva",
            JSON.stringify(response.reserva),
          );
        }

        // ✅ Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigate(["/"]);
        }, 3000);
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

  // ✅ MOSTRAR MENSAJE DE ERROR
  mostrarMensajeError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarError = true;
    this.esError = true;
    this.mostrarExito = false;
  }

  volverAlDetalle(): void {
    if (!this.datos) return;
    const id = String(this.datos.habitacion.id);
    this.router.navigate(["/habitaciones", id]);
  }
}
