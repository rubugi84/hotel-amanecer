// frontend/src/app/pages/prechecking/prechecking.component.ts
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {PrecheckingService} from "../../services/prechecking.service";
import {
  PrecheckingData,
  TokenVerificationResponse,
  DniUploadResponse,
} from "../../models/contenido.models";

@Component({
  selector: "app-prechecking",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./prechecking.component.html",
  styleUrls: ["./prechecking.component.scss"],
})
export class PrecheckingComponent implements OnInit, OnDestroy {
  // Estado
  token: string = "";
  reservaValida: boolean = false;
  realizado: boolean = false;
  error: boolean = false;
  cargando: boolean = false;
  leyendoDni: boolean = false;
  ocrCompletado: boolean = false;
  aceptaTerminos: boolean = false;
  Math = Math;

  // ✅ VARIABLES PARA MENSAJES
  mensajeError: string = "";
  mostrarError: boolean = false;
  mensajeExito: string = "";
  mostrarExito: boolean = false;

  // Datos de la reserva
  reserva: TokenVerificationResponse["reserva"] | null = null;

  progresoRedireccion: number = 100;
  mostrarBarraProgreso: boolean = false;
  private temporizadorRedireccion: ReturnType<typeof setInterval> | null = null;

  // Listas para selects
  tiposDocumento = ["DNI", "NIE", "Pasaporte", "Otro"];
  nacionalidades = [
    "Española",
    "Alemana",
    "Andorrana",
    "Argentina",
    "Belga",
    "Boliviana",
    "Brasileña",
    "Británica",
    "Canadiense",
    "Chilena",
    "China",
    "Colombiana",
    "Costarricense",
    "Cubana",
    "Danesa",
    "Ecuatoriana",
    "Estadounidense",
    "Francesa",
    "Guatemalteca",
    "Hondureña",
    "Italiana",
    "Japonesa",
    "Mexicana",
    "Nicaragüense",
    "Noruega",
    "Panameña",
    "Paraguaya",
    "Peruana",
    "Portuguesa",
    "Puertorriqueña",
    "República Dominicana",
    "Salvadoreña",
    "Sueca",
    "Suiza",
    "Uruguaya",
    "Venezolana",
  ];
  parentescos = ["Hijo/a", "Nieto/a", "Sobrino/a", "Otro"];

  // Datos del formulario - INICIALIZAR VACÍO
  datos: PrecheckingData = {
    nombre: "",
    apellidos: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    fechaExpedicion: "",
    nacionalidad: "",
    fechaNacimiento: "",
    residenciaHabitual: "",
    telefono: "",
    email: "",
    vehiculoMatricula: "",
    observaciones: "",
    menores: [],
    dniFrontalUrl: "",
    dniTraseroUrl: "",
  };

  // Archivos y previsualización
  archivoFrontal: File | null = null;
  archivoTrasero: File | null = null;
  previewFrontal: string | null = null;
  previewTrasero: string | null = null;
  mostrarMenores: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private precheckingService: PrecheckingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.params["token"];
    if (this.token) {
      this.verificarToken();
    } else {
      this.error = true;
    }
  }

  ngOnDestroy(): void {
    if (this.temporizadorRedireccion !== null) {
      clearInterval(this.temporizadorRedireccion);
      this.temporizadorRedireccion = null;
    }
  }

  // ============================================
  // MÉTODOS PRINCIPALES
  // ============================================

  verificarToken(): void {
    this.cargando = true;
    this.precheckingService.verificarToken(this.token).subscribe({
      next: (response) => {
        this.reservaValida = true;
        this.reserva = response.reserva;
        this.cargando = false;

        if (this.reserva) {
          this.datos.email = this.reserva.email_cliente || "";
          this.datos.telefono = this.reserva.telefono_cliente || "";
        }
      },
      error: () => {
        this.error = true;
        this.reservaValida = false;
        this.cargando = false;
      },
    });
  }

  realizarPrechecking(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.subirImagenesYEnviar();
  }

  // ============================================
  // SUBIDA DE IMÁGENES Y ENVÍO
  // ============================================

  subirImagenesYEnviar(): void {
    const promesas: Promise<DniUploadResponse>[] = [];

    if (this.archivoFrontal) {
      promesas.push(
        this.precheckingService
          .subirDni(this.token, this.archivoFrontal, "frontal")
          .toPromise() as Promise<DniUploadResponse>,
      );
    }

    if (this.archivoTrasero) {
      promesas.push(
        this.precheckingService
          .subirDni(this.token, this.archivoTrasero, "trasero")
          .toPromise() as Promise<DniUploadResponse>,
      );
    }

    if (promesas.length === 0) {
      this.enviarPrechecking();
      return;
    }

    Promise.all(promesas)
      .then((respuestas: DniUploadResponse[]) => {
        respuestas.forEach((respuesta) => {
          if (respuesta?.archivo?.frontal) {
            this.datos.dniFrontalUrl = respuesta.archivo.frontal;
          }
          if (respuesta?.archivo?.trasero) {
            this.datos.dniTraseroUrl = respuesta.archivo.trasero;
          }
        });
        this.enviarPrechecking();
      })
      .catch((error: Error) => {
        console.error("❌ Error al subir imágenes:", error);
        this.cargando = false;
        this.mostrarMensajeError(
          "❌ Error al subir las imágenes del DNI. Intente nuevamente.",
        );
      });
  }

  enviarPrechecking(): void {
    const payload = {
      token: this.token,
      datos: this.datos,
    };

    this.precheckingService.realizarPrechecking(payload).subscribe({
      next: () => {
        this.realizado = true;
        this.cargando = false;
        this.mostrarBarraProgreso = true;
        this.progresoRedireccion = 100;

        // ✅ INICIAR BARRA DE PROGRESO DE 5 SEGUNDOS
        this.iniciarBarraProgreso();
      },
      error: (error) => {
        console.error("❌ Error:", error);
        this.cargando = false;
        this.mostrarMensajeError(
          "❌ Error al realizar el pre-checking. Intente nuevamente.",
        );
      },
    });
  }

  iniciarBarraProgreso(): void {
    const duracion = 5000;
    const intervalo = 50;
    const pasos = duracion / intervalo;
    let pasoActual = 0;

    if (this.temporizadorRedireccion !== null) {
      clearInterval(this.temporizadorRedireccion);
      this.temporizadorRedireccion = null;
    }

    this.temporizadorRedireccion = setInterval(() => {
      pasoActual++;
      const porcentaje = 100 - (pasoActual / pasos) * 100;
      this.progresoRedireccion = Math.max(0, Math.round(porcentaje));
      this.cdr.detectChanges();

      if (this.progresoRedireccion <= 0) {
        if (this.temporizadorRedireccion !== null) {
          clearInterval(this.temporizadorRedireccion);
          this.temporizadorRedireccion = null;
        }
        this.volver();
      }
    }, intervalo);
  }

  // ============================================
  // MANEJO DE ARCHIVOS (DNI)
  // ============================================

  onDniFrontalSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.archivoFrontal = file;
      this.ocrCompletado = false;
      this.limpiarMensajes();

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewFrontal = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      this.leerDniConOcr(file, "frontal");
    }
  }

  onDniTraseroSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.archivoTrasero = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewTrasero = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      this.leerDniConOcr(file, "trasero");
    }
  }

  // ============================================
  // OCR - LEER DATOS DEL DNI
  // ============================================

  leerDniConOcr(file: File, tipo: "frontal" | "trasero" = "frontal"): void {
    this.leyendoDni = true;
    this.limpiarMensajes();

    this.precheckingService.leerDni(file, tipo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;

          this.ngZone.run(() => {
            if (tipo === "frontal") {
              if (data.nombre) this.datos.nombre = data.nombre;
              if (data.apellidos) this.datos.apellidos = data.apellidos;
              if (data.tipoDocumento)
                this.datos.tipoDocumento = data.tipoDocumento;
              if (data.numeroDocumento)
                this.datos.numeroDocumento = data.numeroDocumento;
              if (data.fechaExpedicion)
                this.datos.fechaExpedicion = data.fechaExpedicion;
              if (data.nacionalidad)
                this.datos.nacionalidad = data.nacionalidad;
              if (data.fechaNacimiento)
                this.datos.fechaNacimiento = data.fechaNacimiento;

              this.ocrCompletado = true;
              this.mostrarMensajeExito("✅ Datos del DNI leídos correctamente");
            } else if (tipo === "trasero") {
              if (data.residencia) {
                this.datos.residenciaHabitual = data.residencia;
                this.mostrarMensajeExito("🏠 Residencia leída correctamente");
              }
            }

            this.cdr.detectChanges();
          });
        }
        this.leyendoDni = false;
      },
      error: (error) => {
        console.error(`❌ Error al leer el ${tipo} del DNI:`, error);
        this.leyendoDni = false;
        this.mostrarMensajeError(
          `❌ No se pudieron leer los datos del ${tipo}. Complete los campos manualmente.`,
        );
      },
    });
  }

  // ============================================
  // MANEJO DE MENORES
  // ============================================

  agregarMenor(): void {
    if (!this.datos.menores) {
      this.datos.menores = [];
    }
    this.datos.menores.push({
      nombre: "",
      apellidos: "",
      fechaNacimiento: "",
      parentesco: "Hijo/a",
    });
  }

  eliminarMenor(index: number): void {
    if (this.datos.menores) {
      this.datos.menores.splice(index, 1);
    }
  }

  toggleMenores(): void {
    this.mostrarMenores = !this.mostrarMenores;
    if (
      this.mostrarMenores &&
      (!this.datos.menores || this.datos.menores.length === 0)
    ) {
      this.agregarMenor();
    }
  }

  // ============================================
  // MENSAJES
  // ============================================

  mostrarMensajeError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarError = true;
    this.mostrarExito = false;
  }

  mostrarMensajeExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarExito = true;
    this.mostrarError = false;
  }

  limpiarMensajes(): void {
    this.mostrarError = false;
    this.mostrarExito = false;
    this.mensajeError = "";
    this.mensajeExito = "";
  }

  // ============================================
  // VALIDACIONES (SIN ALERTS)
  // ============================================

  validarFormulario(): boolean {
    this.limpiarMensajes();

    if (!this.ocrCompletado) {
      this.mostrarMensajeError(
        "❌ Debes subir el anverso del DNI para leer los datos.",
      );
      return false;
    }

    if (!this.datos.nombre.trim()) {
      this.mostrarMensajeError("❌ El nombre es obligatorio.");
      return false;
    }
    if (!this.datos.apellidos.trim()) {
      this.mostrarMensajeError("❌ Los apellidos son obligatorios.");
      return false;
    }
    if (!this.datos.numeroDocumento.trim()) {
      this.mostrarMensajeError("❌ El número de documento es obligatorio.");
      return false;
    }
    if (!this.datos.fechaExpedicion) {
      this.mostrarMensajeError("❌ La fecha de expedición es obligatoria.");
      return false;
    }
    if (!this.datos.nacionalidad) {
      this.mostrarMensajeError("❌ La nacionalidad es obligatoria.");
      return false;
    }
    if (!this.datos.fechaNacimiento) {
      this.mostrarMensajeError("❌ La fecha de nacimiento es obligatoria.");
      return false;
    }
    if (!this.datos.residenciaHabitual.trim()) {
      this.mostrarMensajeError("❌ La residencia habitual es obligatoria.");
      return false;
    }
    if (!this.datos.telefono.trim()) {
      this.mostrarMensajeError("❌ El teléfono es obligatorio.");
      return false;
    }
    if (!this.datos.email.trim()) {
      this.mostrarMensajeError("❌ El email es obligatorio.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.datos.email)) {
      this.mostrarMensajeError("❌ Por favor, ingrese un email válido.");
      return false;
    }

    if (!this.archivoFrontal) {
      this.mostrarMensajeError("❌ Es obligatorio subir el anverso del DNI.");
      return false;
    }

    if (this.datos.menores && this.datos.menores.length > 0) {
      for (const menor of this.datos.menores) {
        if (
          !menor.nombre.trim() ||
          !menor.apellidos.trim() ||
          !menor.fechaNacimiento
        ) {
          this.mostrarMensajeError(
            "❌ Complete todos los datos de los menores.",
          );
          return false;
        }
      }
    }

    // ✅ El checkbox es informativo - solo mostramos mensaje pero no bloquea
    if (!this.aceptaTerminos) {
      this.mostrarMensajeError(
        "⚠️ Recuerda aceptar que los datos introducidos son correctos.",
      );
      // No return false - solo mostramos el mensaje pero continuamos
    }

    return true;
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================

  volver(): void {
    if (this.temporizadorRedireccion !== null) {
      clearInterval(this.temporizadorRedireccion);
      this.temporizadorRedireccion = null;
    }
    this.router.navigate(["/"]);
  }
}
