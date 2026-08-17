import {Component, OnInit, OnDestroy} from "@angular/core";
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";
import {interval, Subscription} from "rxjs";

@Component({
  selector: "app-confirmacion-reserva",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./confirmacion-reserva.component.html",
  styleUrls: ["./confirmacion-reserva.component.scss"],
})
export class ConfirmacionReservaComponent implements OnInit, OnDestroy {
  codigoReserva: string = "";
  nombreCliente: string = "";
  importeTotal: number = 0;

  // ✅ Barra de progreso
  progreso: number = 0;
  segundosRestantes: number = 5;
  private intervaloSubscription: Subscription | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Cargar datos de la última reserva
    const ultimaReserva = localStorage.getItem("ultimaReserva");
    if (ultimaReserva) {
      try {
        const reserva = JSON.parse(ultimaReserva);
        this.codigoReserva = reserva.codigo_reserva || "N/A";
        this.nombreCliente = reserva.nombre_cliente || "";
        this.importeTotal = reserva.importe_total || 0;
        console.log("✅ Datos de confirmación cargados:", reserva);
      } catch (error) {
        console.error("❌ Error al cargar datos de confirmación:", error);
      }
    }

    // Iniciar barra de progreso
    this.iniciarBarraProgreso();
  }

  ngOnDestroy(): void {
    if (this.intervaloSubscription) {
      this.intervaloSubscription.unsubscribe();
    }
  }

  iniciarBarraProgreso(): void {
    const totalSegundos = 10;
    let segundos = 0;

    this.intervaloSubscription = interval(1000).subscribe(() => {
      segundos++;
      this.segundosRestantes = totalSegundos - segundos;
      this.progreso = (segundos / totalSegundos) * 100;

      if (segundos >= totalSegundos) {
        this.intervaloSubscription?.unsubscribe();
        this.router.navigate(["/"]);
      }
    });
  }

  // ✅ Método para redirigir manualmente al inicio
  irAlInicio(): void {
    if (this.intervaloSubscription) {
      this.intervaloSubscription.unsubscribe();
    }
    this.router.navigate(["/"]);
  }

  // ✅ Método para ver el detalle de la reserva
  verDetalleReserva(): void {
    if (this.intervaloSubscription) {
      this.intervaloSubscription.unsubscribe();
    }
    this.router.navigate(["/reservas/ver", this.codigoReserva]);
  }
}
