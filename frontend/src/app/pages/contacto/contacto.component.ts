import {Component, OnInit, OnDestroy} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {ContenidoService} from "../../services/contenido.service";
import {
  DatosContacto,
  FooterData,
  ContenidoSeccion,
} from "../../models/contenido.models";
import {Subscription} from "rxjs";

@Component({
  selector: "app-contacto",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./contacto.component.html",
  styleUrls: ["./contacto.component.scss"],
})
export class ContactoComponent implements OnInit, OnDestroy {
  // Datos del hotel - se cargarán desde la BD
  datosHotel: FooterData = {
    nombre: "Hotel Amanecer en Campos",
    direccion: "Camino del Molino, 1",
    direccionCompleta: "Camino del Molino, 1",
    telefono: "+34 123 456 789",
    email: "info@hotelamanecer.com",
    emailContacto: "info@hotelamanecer.com",
    slogan: "Un lugar donde la naturaleza y el confort se encuentran",
    checkIn: "15:00 – 22:00",
    checkOut: "12:00",
    certificacion1: "Calidad Turística",
    certificacion2: "Recomendado 2025",
  };

  // Datos del formulario
  contacto: DatosContacto = {
    nombre: "",
    email: "",
    telefono: "",
    mensaje: "",
    formaContacto: "indistinto",
    horarioContacto: "indistinto",
  };

  // Estado del formulario
  estadoEnvio: "idle" | "enviando" | "exito" | "error" = "idle";
  mensajeEstado: string = "";
  cargando: boolean = true;
  private subscriptions: Subscription[] = [];

  // Coordenadas exactas del hotel (reemplazar con las correctas)
  private readonly LATITUD = "42.2686659";
  private readonly LONGITUD = "-4.4454503";

  constructor(
    private http: HttpClient,
    private contenidoService: ContenidoService,
  ) {}

  ngOnInit() {
    this.cargarDatosFooter();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // ✅ Cargar datos del footer desde la BD
  cargarDatosFooter() {
    this.cargando = true;

    const sub = this.contenidoService
      .getContenidoBySeccion("footer")
      .subscribe({
        next: (data: ContenidoSeccion) => {
          const direccionCompleta = String(
            data["footer_direccion"] ||
              "C/ Fuente Nueva, s/n Población de Campos 34449 - Palencia",
          );
          const direccionUrl = direccionCompleta.replace(/ /g, "+");

          this.datosHotel = {
            nombre: String(data["footer_nombre"] || "Hotel Amanecer en Campos"),
            direccion: direccionUrl,
            direccionCompleta: direccionCompleta,
            telefono: String(data["footer_telefono"] || "+34 123 456 789"),
            email: String(
              data["footer_email_normal"] || "info@hotelamanecer.com",
            ),
            emailContacto: String(
              data["footer_email_normal"] || "info@hotelamanecer.com",
            ),
            slogan: String(
              data["footer_slogan"] ||
                "Un lugar donde la naturaleza y el confort se encuentran",
            ),
            checkIn: String(data["footer_check_in"] || "15:00 – 22:00"),
            checkOut: String(data["footer_check_out"] || "12:00"),
            certificacion1: String(
              data["footer_certificacion_1"] || "Calidad Turística",
            ),
            certificacion2: String(
              data["footer_certificacion_2"] || "Recomendado 2025",
            ),
          };

          this.cargando = false;
        },
        error: (error) => {
          console.error("❌ Error al cargar datos del footer:", error);
          this.cargando = false;
        },
      });

    this.subscriptions.push(sub);
  }

  // Método para limpiar el teléfono (eliminar espacios)
  getTelefonoLimpio(): string {
    return this.datosHotel.telefono.replace(/\s/g, "");
  }

  // ✅ Método para obtener la URL de Google Maps con coordenadas exactas
  getGoogleMapsUrl(): string {
    const nombre = this.datosHotel.nombre.replace(/\s+/g, "+");
    const lat = this.LATITUD;
    const lng = this.LONGITUD;

    // Formato con Place ID y coordenadas para máxima precisión
    return `https://www.google.com/maps/place/${nombre}/@${lat},${lng},17z/data=!3m1!4b1!4m5!3m4!1s0xd47cdacc9e9a091:0x4cf6a70a10a4931e!8m2!3d${lat}!4d${lng}`;
  }

  // ✅ Método alternativo para obtener la URL de Google Maps (para llegar desde tu ubicación)
  getGoogleMapsDirUrl(): string {
    const lat = this.LATITUD;
    const lng = this.LONGITUD;
    return `https://www.google.com/maps/dir//${lat},${lng}`;
  }

  // ✅ Método para obtener la URL del QR
  getQrUrl(): string {
    const url = this.getGoogleMapsUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }

  // ✅ Método para obtener la URL del QR con "Cómo llegar"
  getQrDirUrl(): string {
    const url = this.getGoogleMapsDirUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }

  onSubmit() {
    if (!this.validarFormulario()) {
      return;
    }

    this.estadoEnvio = "enviando";
    this.mensajeEstado = "Enviando mensaje...";

    const sub = this.http
      .post("http://localhost:3000/api/contacto/enviar", this.contacto)
      .subscribe({
        next: (response: any) => {
          this.estadoEnvio = "exito";
          this.mensajeEstado =
            response.mensaje || "¡Mensaje enviado con éxito!";
          this.resetearFormulario();
          this.ocultarMensajeDespuesDe(5000);
        },
        error: (error) => {
          this.estadoEnvio = "error";
          this.mensajeEstado =
            error.error?.mensaje ||
            "Error al enviar el mensaje. Por favor, inténtalo de nuevo.";
          console.error("Error al enviar mensaje:", error);
          this.ocultarMensajeDespuesDe(5000);
        },
      });

    this.subscriptions.push(sub);
  }

  validarFormulario(): boolean {
    if (!this.contacto.nombre.trim()) {
      this.estadoEnvio = "error";
      this.mensajeEstado = "Por favor, introduce tu nombre";
      this.ocultarMensajeDespuesDe(3000);
      return false;
    }

    if (
      !this.contacto.email.trim() ||
      !this.validarEmail(this.contacto.email)
    ) {
      this.estadoEnvio = "error";
      this.mensajeEstado = "Por favor, introduce un email válido";
      this.ocultarMensajeDespuesDe(3000);
      return false;
    }

    if (!this.contacto.telefono.trim()) {
      this.estadoEnvio = "error";
      this.mensajeEstado = "Por favor, introduce tu teléfono";
      this.ocultarMensajeDespuesDe(3000);
      return false;
    }

    if (!this.contacto.mensaje.trim() || this.contacto.mensaje.length < 10) {
      this.estadoEnvio = "error";
      this.mensajeEstado =
        "Por favor, escribe un mensaje de al menos 10 caracteres";
      this.ocultarMensajeDespuesDe(3000);
      return false;
    }

    return true;
  }

  validarEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  resetearFormulario() {
    this.contacto = {
      nombre: "",
      email: "",
      telefono: "",
      mensaje: "",
      formaContacto: "indistinto",
      horarioContacto: "indistinto",
    };
  }

  ocultarMensajeDespuesDe(ms: number) {
    setTimeout(() => {
      if (this.estadoEnvio === "exito" || this.estadoEnvio === "error") {
        this.estadoEnvio = "idle";
        this.mensajeEstado = "";
      }
    }, ms);
  }
}
