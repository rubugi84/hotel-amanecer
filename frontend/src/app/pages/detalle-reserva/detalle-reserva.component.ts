import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {DatepickerModule} from "../../datepicker.module";
import dayjs from "dayjs";
import {ContenidoService} from "../../services/contenido.service";
import {
  Habitacion,
  BusquedaDisponibilidad,
} from "../../models/contenido.models";

@Component({
  selector: "app-detalle-reserva",
  standalone: true,
  imports: [CommonModule, FormsModule, DatepickerModule],
  templateUrl: "./detalle-reserva.component.html",
  styleUrls: ["./detalle-reserva.component.scss"],
})
export class DetalleReservaComponent implements OnInit {
  habitacion: Habitacion | null = null;
  slug: string = "";

  selectedDateRange = {
    startDate: dayjs().add(1, "day").toDate(),
    endDate: dayjs().add(2, "day").toDate(),
  };
  today = dayjs();
  adultos: number = 2;
  ninos: number = 0;
  desayuno: boolean = false;

  nombre: string = "";
  apellidos: string = "";
  direccion: string = "";
  telefono: string = "";
  dni: string = "";
  email: string = "";

  datosModificados: boolean = false;

  mensajeError: string = "";
  mostrarError: boolean = false;
  esError: boolean = false;

  emailValido: boolean = true;
  telefonoValido: boolean = true;
  dniValido: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contenidoService: ContenidoService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.slug = params["slug"];
      this.cargarHabitacionPorSlug(this.slug);
    });
  }

  cargarHabitacionPorSlug(slug: string): void {
    this.contenidoService.getHabitaciones().subscribe({
      next: (data: Habitacion[]) => {
        const habitacionEncontrada = data.find((h: Habitacion) => {
          const hSlug = h.nombre
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          return hSlug === slug;
        });

        if (habitacionEncontrada) {
          this.habitacion = habitacionEncontrada;
        } else {
          console.error("❌ Habitación no encontrada");
          this.router.navigate(["/habitaciones"]);
        }
      },
      error: (err) => {
        console.error("❌ Error al cargar habitaciones:", err);
        this.router.navigate(["/habitaciones"]);
      },
    });
  }

  detectarCambios(): void {
    this.datosModificados = true;
    this.mostrarError = false;
    this.mensajeError = "";
  }

  calcularImporte(): number {
    if (!this.habitacion) return 0;
    const start = dayjs(this.selectedDateRange.startDate);
    const end = dayjs(this.selectedDateRange.endDate);
    const noches = end.diff(start, "day");

    const precio = parseFloat(this.habitacion.precio) || 0;
    let total = precio * noches;

    if (this.desayuno) {
      total += (this.adultos + this.ninos) * 10 * noches;
    }
    return total;
  }

  // ✅ VALIDACIONES CORREGIDAS - Sin escape innecesario
  validarEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValido = emailRegex.test(this.email) || this.email === "";
    this.limpiarMensaje();
  }

  validarTelefono(): void {
    // ✅ CORREGIDO: sin escape innecesario en paréntesis
    const telefonoRegex = /^[+\d\s\-()]{12,15}$/;
    this.telefonoValido =
      telefonoRegex.test(this.telefono) || this.telefono === "";
    this.limpiarMensaje();
  }

  validarDni(): void {
    const dniRegex =
      /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[A-Z]{1,2}\d{6,9}[A-Z0-9]?)$/;
    this.dniValido = dniRegex.test(this.dni.toUpperCase()) || this.dni === "";
    this.limpiarMensaje();
  }

  limpiarMensaje(): void {
    if (this.emailValido && this.telefonoValido && this.dniValido) {
      this.mostrarError = false;
      this.mensajeError = "";
    }
  }

  mostrarMensajeError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarError = true;
    this.esError = true;
  }

  accionBoton(): void {
    if (this.datosModificados) {
      this.consultarDisponibilidad();
    } else {
      this.validarYAvanzarAResumen();
    }
  }

  consultarDisponibilidad(): void {
    if (!this.habitacion) return;

    const datosConsulta: BusquedaDisponibilidad = {
      adultos: this.adultos,
      ninos: this.ninos,
      fecha_entrada: dayjs(this.selectedDateRange.startDate).format(
        "YYYY-MM-DD",
      ),
      fecha_salida: dayjs(this.selectedDateRange.endDate).format("YYYY-MM-DD"),
    };

    this.contenidoService
      .buscarHabitacionesDisponibles(datosConsulta)
      .subscribe({
        next: (habitacionesDisponibles: Habitacion[]) => {
          const estaDisponible = habitacionesDisponibles.some(
            (h: Habitacion) => h.id === this.habitacion?.id,
          );

          if (estaDisponible) {
            this.datosModificados = false;
            this.mostrarError = true;
            this.esError = false;
            this.mensajeError =
              "✅ La habitación está disponible para las fechas seleccionadas. Ya puedes reservar.";
          } else {
            this.mostrarMotivoNoDisponible();
          }
        },
        error: (err) => {
          console.error("❌ Error al consultar disponibilidad:", err);
          this.mostrarMensajeError(
            "❌ Error al consultar disponibilidad. Intenta de nuevo.",
          );
        },
      });
  }

  mostrarMotivoNoDisponible(): void {
    if (!this.habitacion) return;

    const capacidadRequerida = this.adultos + this.ninos;
    const capacidadMaxima =
      this.habitacion.capacidad_adultos + this.habitacion.capacidad_ninos;

    if (capacidadRequerida > capacidadMaxima) {
      this.mostrarMensajeError(
        `❌ Capacidad insuficiente. Máximo ${capacidadMaxima} personas ` +
          `(${this.habitacion.capacidad_adultos} adultos + ${this.habitacion.capacidad_ninos} niños).`,
      );
      return;
    }

    this.mostrarMensajeError(
      "❌ Esta habitación no está disponible para las fechas seleccionadas. " +
        "Por favor, elige otras fechas o prueba con otra habitación.",
    );
  }

  validarYAvanzarAResumen(): void {
    // Validar campos obligatorios
    if (
      !this.nombre?.trim() ||
      !this.apellidos?.trim() ||
      !this.email?.trim() ||
      !this.telefono?.trim() ||
      !this.dni?.trim()
    ) {
      this.mostrarMensajeError(
        "❌ Todos los campos son obligatorios (Nombre, Apellidos, Email, Teléfono y DNI).",
      );
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.mostrarMensajeError("❌ Por favor, introduce un email válido.");
      return;
    }

    // ✅ Validar teléfono - CORREGIDO
    const telefonoRegex = /^[+\d\s\-()]{9,15}$/;
    if (!telefonoRegex.test(this.telefono)) {
      this.mostrarMensajeError(
        "❌ Por favor, introduce un teléfono válido (mínimo 9 dígitos).",
      );
      return;
    }

    // Validar DNI/NIE/Pasaporte
    const dniRegex =
      /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[A-Z]{1,2}\d{6,9}[A-Z0-9]?)$/;
    if (!dniRegex.test(this.dni.toUpperCase())) {
      this.mostrarMensajeError(
        "❌ DNI/NIE/Pasaporte no válido. Formato: 12345678A, X1234567A o pasaporte.",
      );
      return;
    }

    if (!this.habitacion) {
      this.mostrarMensajeError("❌ No se ha seleccionado ninguna habitación.");
      return;
    }

    const importeCalculado = this.calcularImporte();
    if (isNaN(importeCalculado) || importeCalculado <= 0) {
      this.mostrarMensajeError(
        "❌ Error al calcular el importe. Por favor, revisa las fechas.",
      );
      return;
    }

    const datosReserva = {
      habitacion: {
        id: this.habitacion.id,
        nombre: this.habitacion.nombre,
        descripcion: this.habitacion.descripcion,
        imagen: this.habitacion.imagen,
        precio: parseFloat(this.habitacion.precio) || 0,
        capacidad:
          this.habitacion.capacidad_adultos + this.habitacion.capacidad_ninos,
        capacidad_adultos: this.habitacion.capacidad_adultos,
        capacidad_ninos: this.habitacion.capacidad_ninos,
        caracteristicas: this.habitacion.caracteristicas,
      },
      fechas: {
        entrada: dayjs(this.selectedDateRange.startDate).format("DD/MM/YYYY"),
        salida: dayjs(this.selectedDateRange.endDate).format("DD/MM/YYYY"),
        noches: dayjs(this.selectedDateRange.endDate).diff(
          dayjs(this.selectedDateRange.startDate),
          "day",
        ),
      },
      huespedes: {
        adultos: this.adultos,
        ninos: this.ninos,
      },
      desayuno: this.desayuno,
      cliente: {
        nombre: this.nombre.trim(),
        apellidos: this.apellidos.trim(),
        direccion: this.direccion?.trim() || "",
        telefono: this.telefono.trim(),
        dni: this.dni.trim().toUpperCase(),
        email: this.email.trim().toLowerCase(),
      },
      importe: importeCalculado,
    };

    try {
      localStorage.setItem("datosReserva", JSON.stringify(datosReserva));

      this.router.navigate(["/reservas/resumen"]);
    } catch (error) {
      console.error("❌ Error al guardar datos de reserva:", error);
      this.mostrarMensajeError(
        "❌ Error al guardar los datos. Intenta de nuevo.",
      );
    }
  }

  getImagenUrl(ruta: string): string {
    return ruta ? "http://localhost:3000" + ruta : "";
  }
}
