import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {DatepickerModule} from "../../datepicker.module";
import dayjs from "dayjs";
import {ContenidoService} from "../../services/contenido.service";
// 🔥 Importar la interfaz Habitacion
import {Habitacion, TildeMap} from "../../models/contenido.models";

@Component({
  selector: "app-detalle-reserva",
  standalone: true,
  imports: [CommonModule, FormsModule, DatepickerModule],
  templateUrl: "./detalle-reserva.component.html",
  styleUrls: ["./detalle-reserva.component.scss"],
})
export class DetalleReservaComponent implements OnInit {
  today: dayjs.Dayjs = dayjs();
  habitacion: Habitacion | null = null;
  slug: string = "";

  selectedDateRange = {
    startDate: dayjs().add(1, "day").toDate(),
    endDate: dayjs().add(2, "day").toDate(),
  };
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
        // 🔥 CORREGIDO: Tipar data
        const habitacionEncontrada = data.find((h: Habitacion) => {
          // 🔥 CORREGIDO: Tipar h
          const hSlug = h.nombre
            .toLowerCase()
            .replace(/[áéíóú]/g, (match: string) => {
              const map: TildeMap = {
                á: "a",
                é: "e",
                í: "i",
                ó: "o",
                ú: "u",
              };
              return map[match] || match;
            })
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
  }

  calcularImporte(): number {
    if (!this.habitacion) return 0;
    const start = dayjs(this.selectedDateRange.startDate);
    const end = dayjs(this.selectedDateRange.endDate);
    const noches = end.diff(start, "day");

    // Convertir precio de string a number
    const precio = parseFloat(this.habitacion.precio) || 0;
    let total = precio * noches;

    if (this.desayuno) {
      total += (this.adultos + this.ninos) * 10 * noches;
    }
    return total;
  }

  accionBoton(): void {
    if (this.datosModificados) {
      this.consultarDisponibilidad();
    } else {
      this.confirmarReserva();
    }
  }

  consultarDisponibilidad(): void {
    this.datosModificados = false;
  }

  confirmarReserva(): void {}

  getImagenUrl(ruta: string): string {
    return ruta ? "http://localhost:3000" + ruta : "";
  }
}
