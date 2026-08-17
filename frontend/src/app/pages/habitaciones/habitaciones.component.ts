import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {DatepickerModule} from "../../datepicker.module";
import dayjs from "dayjs";
import {ContenidoService} from "../../services/contenido.service";
import {Router} from "@angular/router";
import {environment} from "../../../environments/environment";
import {
  Habitacion,
  BusquedaDisponibilidad,
  ContenidoSeccion,
} from "../../models/contenido.models";

@Component({
  selector: "app-habitaciones",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatepickerModule],
  templateUrl: "./habitaciones.component.html",
  styleUrls: ["./habitaciones.component.scss"],
})
export class HabitacionesComponent implements OnInit {
  habitacionesData: ContenidoSeccion = {};
  habitaciones: Habitacion[] = [];
  habitacionesOriginales: Habitacion[] = [];

  selectedDateRange = {
    startDate: dayjs().add(1, "day").toDate(),
    endDate: dayjs().add(2, "day").toDate(),
  };
  adultos: number = 2;
  ninos: number = 0;
  consultaRealizada = false;

  mensajeDisponibilidad: string = "";
  mostrarMensaje: boolean = false;
  esError: boolean = false;

  constructor(
    private contenidoService: ContenidoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Cargar contenido de habitaciones
    this.contenidoService
      .getContenidoBySeccion("habitaciones")
      .subscribe((data: ContenidoSeccion) => {
        this.habitacionesData = data;
      });

    // Cargar habitaciones
    this.contenidoService.getHabitaciones().subscribe((data: Habitacion[]) => {
      this.habitacionesOriginales = data;
      this.habitaciones = data;

      // ✅ VERIFICAR SI VIENE DE HOME CON BÚSQUEDA
      this.verificarBusquedaPendiente();
    });
  }

  verificarBusquedaPendiente(): void {
    const busquedaGuardada = localStorage.getItem("busquedaDisponibilidad");

    if (busquedaGuardada) {
      try {
        const datosBusqueda = JSON.parse(busquedaGuardada);

        // Actualizar el formulario con los datos de la búsqueda
        this.adultos = datosBusqueda.adultos || 2;
        this.ninos = datosBusqueda.ninos || 0;

        // Convertir fechas de string a Date
        if (datosBusqueda.fecha_entrada && datosBusqueda.fecha_salida) {
          this.selectedDateRange = {
            startDate: dayjs(datosBusqueda.fecha_entrada).toDate(),
            endDate: dayjs(datosBusqueda.fecha_salida).toDate(),
          };
        }

        // ✅ Ejecutar consulta y luego eliminar localStorage
        setTimeout(() => {
          this.ejecutarConsultaDisponibilidad();
          localStorage.removeItem("busquedaDisponibilidad");
        }, 200);
      } catch (error) {
        console.error("❌ Error al procesar búsqueda pendiente:", error);
        this.mostrarMensaje = true;
        this.esError = true;
        this.mensajeDisponibilidad =
          "Error al procesar la búsqueda. Inténtalo de nuevo.";
        localStorage.removeItem("busquedaDisponibilidad");
      }
    }
  }

  ejecutarConsultaDisponibilidad(): void {
    this.consultaRealizada = true;
    this.mostrarMensaje = false;
    this.esError = false;

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
        next: (data: Habitacion[]) => {
          this.habitaciones = data;

          if (data.length === 0) {
            this.mostrarMensaje = true;
            this.esError = true;
            this.mensajeDisponibilidad =
              "No hay habitaciones disponibles para las fechas seleccionadas.";
          } else if (data.length === 1) {
            this.mostrarMensaje = true;
            this.esError = false;
            this.mensajeDisponibilidad = `✅ Hay 1 habitación disponible para tus fechas.`;
          } else {
            this.mostrarMensaje = true;
            this.esError = false;
            this.mensajeDisponibilidad = `✅ Hay ${data.length} habitaciones disponibles para tus fechas.`;
          }
        },
        error: (err) => {
          console.error("❌ Error al consultar disponibilidad:", err);
          this.mostrarMensaje = true;
          this.esError = true;
          this.mensajeDisponibilidad =
            "Error al consultar disponibilidad. Inténtalo de nuevo.";
        },
      });
  }

  consultarDisponibilidad(): void {
    this.ejecutarConsultaDisponibilidad();
  }

  restaurarHabitaciones(): void {
    this.habitaciones = this.habitacionesOriginales;
    this.consultaRealizada = false;
    this.mostrarMensaje = false;
    this.mensajeDisponibilidad = "";
    this.esError = false;

    this.selectedDateRange = {
      startDate: dayjs().add(1, "day").toDate(),
      endDate: dayjs().add(2, "day").toDate(),
    };
    this.adultos = 2;
    this.ninos = 0;
    localStorage.removeItem("busquedaDisponibilidad");
  }

  reservar(habitacion: Habitacion): void {
    const slug = habitacion.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const datosBusqueda = {
      fecha_entrada: dayjs(this.selectedDateRange.startDate).format(
        "YYYY-MM-DD",
      ),
      fecha_salida: dayjs(this.selectedDateRange.endDate).format("YYYY-MM-DD"),
      adultos: this.adultos,
      ninos: this.ninos,
    };
    localStorage.setItem(
      "busquedaDisponibilidad",
      JSON.stringify(datosBusqueda),
    );

    this.router.navigate(["/habitaciones", slug]);
  }

  getImagenUrl(ruta: string): string {
    const baseUrl = environment.apiUrl.replace("/api", "");
    return ruta ? baseUrl + ruta : "";
  }
}
