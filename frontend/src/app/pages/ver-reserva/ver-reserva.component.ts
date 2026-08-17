// frontend/src/app/pages/ver-reserva/ver-reserva.component.ts
import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

export interface ReservaData {
  id: number;
  habitacion_id: number;
  codigo_reserva: string;
  hash_seguro?: string;
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
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  created_at: string;
  fecha_creacion?: string;
  habitacion_nombre: string;
  habitacion_descripcion?: string;
  habitacion_caracteristicas?: string[];
  habitacion_imagen?: string;
  habitacion_precio?: number;
  prechecking_realizado?: boolean;
  fecha_prechecking?: string;
  hora_llegada?: string;
  dni_frontal_url?: string;
  dni_trasero_url?: string;
}

@Component({
  selector: "app-ver-reserva",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./ver-reserva.component.html",
  styleUrls: ["./ver-reserva.component.scss"],
})
export class VerReservaComponent implements OnInit {
  reserva: ReservaData | null = null;
  cargando: boolean = true;
  error: boolean = false;
  hashSeguro: string = "";
  reservaId: string = "";
  esAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    // ✅ Obtener el parámetro de la ruta (puede ser hash o código)
    const param =
      this.route.snapshot.params["hash"] ||
      this.route.snapshot.params["id"] ||
      "";

    // ✅ Detectar si es admin
    this.esAdmin = this.route.snapshot.url.some(
      (segment) => segment.path === "admin",
    );

    if (!param) {
      this.error = true;
      this.cargando = false;
      return;
    }

    // ✅ Determinar si es hash o código
    // El hash tiene 32 caracteres hexadecimales, el código comienza con "AMS-"
    if (param.length === 32 || param.length === 33) {
      // Es un hash (MD5 tiene 32 caracteres)
      this.hashSeguro = param;
    } else {
      // Podría ser un código de reserva (AMS-XXXXXXXX)
      this.reservaId = param;
    }

    this.cargarReserva();
  }

  cargarReserva(): void {
    this.cargando = true;

    let url: string;

    // ✅ Si es admin y tenemos ID, usar el endpoint de admin
    if (this.esAdmin && this.reservaId) {
      url = `${environment.apiUrl}/reservas/${this.reservaId}`;
    } else if (this.hashSeguro) {
      // ✅ Si tenemos hash, usar el endpoint público
      url = `${environment.apiUrl}/reservas/ver/${this.hashSeguro}`;
    } else if (this.reservaId) {
      // ✅ Si tenemos un código de reserva, intentar buscar por código
      url = `${environment.apiUrl}/reservas/codigo/${this.reservaId}`;
    } else {
      this.error = true;
      this.cargando = false;
      return;
    }

    this.http.get<ReservaData>(url).subscribe({
      next: (response: ReservaData) => {
        this.reserva = {
          ...response,
          created_at:
            response.created_at ||
            response.fecha_creacion ||
            new Date().toISOString(),
          habitacion_descripcion: response.habitacion_descripcion || "",
          habitacion_caracteristicas: response.habitacion_caracteristicas || [],
        };
        this.cargando = false;
      },
      error: (err) => {
        console.error("❌ Error al cargar reserva:", err);
        this.error = true;
        this.cargando = false;
      },
    });
  }

  calcularNoches(): number {
    if (!this.reserva) return 0;

    const entrada = new Date(this.reserva.fecha_entrada);
    const salida = new Date(this.reserva.fecha_salida);

    const diff = salida.getTime() - entrada.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  volver(): void {
    if (this.esAdmin) {
      this.router.navigate(["/admin"]);
    } else {
      this.router.navigate(["/"]);
    }
  }

  imprimir(): void {
    window.print();
  }
}
