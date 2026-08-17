import {Component, OnInit, OnDestroy} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {DatepickerModule} from "../../datepicker.module";
import dayjs from "dayjs";
import {ContenidoService} from "../../services/contenido.service";
import {
  Habitacion,
  BusquedaDisponibilidad,
  ContenidoWeb,
} from "../../models/contenido.models";
import {Subscription} from "rxjs";

@Component({
  selector: "app-detalle-reserva",
  standalone: true,
  imports: [CommonModule, FormsModule, DatepickerModule],
  templateUrl: "./detalle-reserva.component.html",
  styleUrls: ["./detalle-reserva.component.scss"],
})
export class DetalleReservaComponent implements OnInit, OnDestroy {
  // ============================================
  // 1. DATOS DE LA HABITACIÓN
  // ============================================
  habitacion: Habitacion | null = null;
  slug: string = "";

  // ============================================
  // 2. FECHAS Y HUÉSPEDES
  // ============================================
  selectedDateRange = {
    startDate: dayjs().add(1, "day").toDate(),
    endDate: dayjs().add(2, "day").toDate(),
  };
  today = dayjs();
  adultos: number = 2;
  ninos: number = 0;

  // ============================================
  // 3. DESAYUNO (cargado desde BD)
  // ============================================
  desayuno: boolean = false;
  precioDesayuno: number = 10; // Valor por defecto, se carga desde BD

  // ============================================
  // 4. DATOS DEL CLIENTE
  // ============================================
  nombre: string = "";
  apellidos: string = "";
  direccion: string = "";
  telefono: string = "";
  dni: string = "";
  email: string = "";

  // ============================================
  // 5. ESTADO DEL FORMULARIO
  // ============================================
  datosModificados: boolean = false;
  mensajeError: string = "";
  mostrarError: boolean = false;
  esError: boolean = false;

  // ============================================
  // 6. VALIDACIONES
  // ============================================
  emailValido: boolean = true;
  telefonoValido: boolean = true;
  dniValido: boolean = true;

  // ============================================
  // 7. SUBSCRIPCIONES
  // ============================================
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contenidoService: ContenidoService,
  ) {}

  // ============================================
  // 8. CICLO DE VIDA
  // ============================================
  ngOnInit(): void {
    // Cargar precio del desayuno desde BD
    this.cargarPrecioDesayuno();

    // Cargar habitación por slug
    this.route.params.subscribe((params) => {
      this.slug = params["slug"];
      this.cargarHabitacionPorSlug(this.slug);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // ============================================
  // 9. CARGA DE DATOS DESDE BD
  // ============================================

  /**
   * Carga el precio del desayuno desde la tabla contenido_web
   * Clave: habitaciones_desayuno
   */
  cargarPrecioDesayuno(): void {
    const sub = this.contenidoService
      .getContenidoByClave("habitaciones_desayuno")
      .subscribe({
        next: (item: ContenidoWeb) => {
          const precio = parseFloat(item.valor);
          this.precioDesayuno = isNaN(precio) ? 10 : precio;
          console.log("✅ Precio desayuno cargado:", this.precioDesayuno);
        },
        error: (error) => {
          console.error("❌ Error al cargar precio del desayuno:", error);
          this.precioDesayuno = 10; // Valor por defecto
        },
      });
    this.subscriptions.push(sub);
  }

  /**
   * Carga la habitación por slug (nombre convertido a URL amigable)
   */
  cargarHabitacionPorSlug(slug: string): void {
    const sub = this.contenidoService.getHabitaciones().subscribe({
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
    this.subscriptions.push(sub);
  }

  // ============================================
  // 10. CÁLCULO DE IMPORTES
  // ============================================

  /**
   * Calcula el importe total de la reserva
   * Usa el precio del desayuno cargado desde BD
   */
  calcularImporte(): number {
    if (!this.habitacion) return 0;

    const start = dayjs(this.selectedDateRange.startDate);
    const end = dayjs(this.selectedDateRange.endDate);
    const noches = end.diff(start, "day");

    const precio = parseFloat(this.habitacion.precio) || 0;
    let total = precio * noches;

    // Usar precio del desayuno desde BD
    if (this.desayuno) {
      const totalPersonas = this.adultos + this.ninos;
      total += this.precioDesayuno * totalPersonas * noches;
    }

    return total;
  }

  /**
   * Calcula el número de noches
   */
  calcularNoches(): number {
    const start = dayjs(this.selectedDateRange.startDate);
    const end = dayjs(this.selectedDateRange.endDate);
    return end.diff(start, "day");
  }

  /**
   * Calcula el precio base de la habitación (sin desayuno)
   */
  calcularPrecioBase(): number {
    if (!this.habitacion) return 0;
    const precio = parseFloat(this.habitacion.precio) || 0;
    return precio * this.calcularNoches();
  }

  /**
   * Calcula el precio del desayuno
   */
  calcularPrecioDesayuno(): number {
    if (!this.desayuno) return 0;
    const totalPersonas = this.adultos + this.ninos;
    return this.precioDesayuno * totalPersonas * this.calcularNoches();
  }

  /**
   * Devuelve el texto del desayuno con el precio dinámico
   */
  getTextoDesayuno(): string {
    return `Incluir desayuno (+${this.precioDesayuno}€/persona/noche)`;
  }

  // ============================================
  // 11. VALIDACIONES
  // ============================================

  validarEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValido = emailRegex.test(this.email) || this.email === "";
    this.limpiarMensaje();
  }

  validarTelefono(): void {
    const telefonoRegex = /^[+\d\s\-()]{9,15}$/;
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

  // ============================================
  // 12. DETECCIÓN DE CAMBIOS
  // ============================================

  detectarCambios(): void {
    this.datosModificados = true;
    this.mostrarError = false;
    this.mensajeError = "";
  }

  // ============================================
  // 13. MENSAJES DE ERROR
  // ============================================

  mostrarMensajeError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarError = true;
    this.esError = true;
  }

  mostrarMensajeExito(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarError = true;
    this.esError = false;
  }

  // ============================================
  // 14. ACCIONES DEL BOTÓN
  // ============================================

  accionBoton(): void {
    if (this.datosModificados) {
      this.consultarDisponibilidad();
    } else {
      this.validarYAvanzarAResumen();
    }
  }

  // ============================================
  // 15. CONSULTA DE DISPONIBILIDAD
  // ============================================

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

    const sub = this.contenidoService
      .buscarHabitacionesDisponibles(datosConsulta)
      .subscribe({
        next: (habitacionesDisponibles: Habitacion[]) => {
          const estaDisponible = habitacionesDisponibles.some(
            (h: Habitacion) => h.id === this.habitacion?.id,
          );

          if (estaDisponible) {
            this.datosModificados = false;
            this.mostrarMensajeExito(
              "✅ La habitación está disponible para las fechas seleccionadas. Ya puedes reservar.",
            );
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
    this.subscriptions.push(sub);
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

  // ============================================
  // 16. VALIDACIÓN Y AVANCE A RESUMEN
  // ============================================

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

    // Validar teléfono
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

    // Construir datos de la reserva
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
        noches: this.calcularNoches(),
      },
      huespedes: {
        adultos: this.adultos,
        ninos: this.ninos,
      },
      desayuno: this.desayuno,
      precioDesayuno: this.precioDesayuno, // ✅ Añadido para usar en el resumen
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

  // ============================================
  // 17. UTILIDADES
  // ============================================

  getImagenUrl(ruta: string): string {
    return ruta ? "http://localhost:3000" + ruta : "";
  }

  fechaActual(): string {
    return dayjs().format("YYYY-MM-DD");
  }

  volver(): void {
    window.history.back();
  }
}
