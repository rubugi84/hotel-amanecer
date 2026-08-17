// frontend/src/app/pages/home/home.component.ts

import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {DatepickerModule} from "../../datepicker.module";
import dayjs from "dayjs";
import {ContenidoService} from "../../services/contenido.service";
import {ContenidoSeccion, ServicioHotel} from "../../models/contenido.models";
import {Router} from "@angular/router";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {environment} from "../../../environments/environment";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatepickerModule],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  // ============================================
  // FORMULARIO DE RESERVA
  // ============================================
  selectedDateRange = {
    startDate: dayjs().add(1, "day").toDate(),
    endDate: dayjs().add(2, "day").toDate(),
  };
  today = dayjs();
  adultos: number = 2;
  ninos: number = 0;

  // ============================================
  // DATOS DINÁMICOS DESDE LA BD
  // ============================================
  heroData: ContenidoSeccion = {};
  homeData: ContenidoSeccion = {};
  aboutData: ContenidoSeccion = {};
  serviciosData: ContenidoSeccion = {};
  ctaData: ContenidoSeccion = {};
  servicios: ServicioHotel[] = [];

  // ============================================
  // CONTENIDO ABOUT SANITIZADO
  // ============================================
  aboutContentSanitizado: SafeHtml = "";

  // ✅ Base URL para imágenes (desde environment)
  private baseUrl = environment.apiUrl.replace("/api", "");

  // ✅ IMAGEN POR DEFECTO DEL HERO
  private readonly heroDefaultImage = `${this.baseUrl}/uploads/hero/hero.jpg`;

  // ✅ CONTENIDO ABOUT DEFAULT (con URL dinámica)
  contenidoAboutDefault: string = "";

  constructor(
    private contenidoService: ContenidoService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {
    // ✅ Inicializar contenidoAboutDefault con la URL dinámica
    this.contenidoAboutDefault = `
      <div class="about-simple">
        <div class="about-header">
          <h2>Bienvenido a nuestro paraíso</h2>
          <p class="subtitle">Un lugar donde la naturaleza y el confort se encuentran</p>
        </div>
        <div class="about-grid">
          <div class="about-text">
            <p>Ubicado en el corazón del campo, nuestro hotel te ofrece una experiencia única de desconexión y tranquilidad.</p>
            <p>Rodeado de paisajes impresionantes, podrás disfrutar de la paz que solo la naturaleza puede ofrecer.</p>
            <ul class="features-list">
              <li>🛏️ Habitaciones confortables con vistas al jardín</li>
              <li>🍽️ Restaurante con cocina tradicional</li>
              <li>🌿 Zonas verdes y jardines</li>
              <li>🏊 Piscina climatizada</li>
              <li>🚴 Rutas de senderismo y bicicleta</li>
            </ul>
            <div class="about-actions">
              <a href="/habitaciones" class="btn-about">Ver habitaciones</a>
            </div>
          </div>
          <div class="about-image">
            <img src="${this.baseUrl}/uploads/tinymce/about_hotel.jpg" alt="Hotel Rural">
          </div>
        </div>
      </div>
    `;
  }

  ngOnInit(): void {
    // ✅ 1. Cargar sección HERO
    this.contenidoService
      .getContenidoBySeccion("hero")
      .subscribe((data: ContenidoSeccion) => {
        this.heroData = data;
      });

    // ✅ 2. Cargar sección HOME
    this.contenidoService
      .getContenidoBySeccion("home")
      .subscribe((data: ContenidoSeccion) => {
        this.homeData = data;
      });

    // ✅ 3. Cargar sección ABOUT
    this.contenidoService
      .getContenidoBySeccion("about")
      .subscribe((data: ContenidoSeccion) => {
        this.aboutData = data;
        const contenido = data["about_content"];
        const contenidoStr = contenido
          ? String(contenido)
          : this.contenidoAboutDefault;
        this.aboutContentSanitizado =
          this.sanitizer.bypassSecurityTrustHtml(contenidoStr);
      });

    // ✅ 4. Cargar sección SERVICIOS
    this.contenidoService
      .getContenidoBySeccion("servicios")
      .subscribe((data: ContenidoSeccion) => {
        this.serviciosData = data;
      });

    // ✅ 5. Cargar sección CTA
    this.contenidoService
      .getContenidoBySeccion("cta")
      .subscribe((data: ContenidoSeccion) => {
        this.ctaData = data;
      });

    // ✅ 6. Cargar el ARRAY DE SERVICIOS
    this.contenidoService.getServicios().subscribe({
      next: (data: ServicioHotel[]) => {
        this.servicios = data;
      },
      error: (err) => {
        console.error("❌ Error al recibir servicios:", err);
      },
    });
  }

  onSubmit(): void {
    if (!this.selectedDateRange.startDate || !this.selectedDateRange.endDate) {
      alert("❌ Por favor, selecciona las fechas de entrada y salida.");
      return;
    }

    const fechaEntrada = dayjs(this.selectedDateRange.startDate);
    const fechaSalida = dayjs(this.selectedDateRange.endDate);
    const noches = fechaSalida.diff(fechaEntrada, "day");

    if (noches <= 0) {
      alert("❌ La fecha de salida debe ser posterior a la fecha de entrada.");
      return;
    }

    const datosBusqueda = {
      fecha_entrada: fechaEntrada.format("YYYY-MM-DD"),
      fecha_salida: fechaSalida.format("YYYY-MM-DD"),
      adultos: this.adultos,
      ninos: this.ninos,
    };

    try {
      localStorage.setItem(
        "busquedaDisponibilidad",
        JSON.stringify(datosBusqueda),
      );
      this.router.navigate(["/habitaciones"]);
    } catch (error) {
      console.error("❌ Error al guardar búsqueda:", error);
      alert("Error al procesar la búsqueda. Inténtalo de nuevo.");
    }
  }

  /**
   * Obtiene la URL completa de una imagen
   * @param ruta - Ruta de la imagen (puede ser cualquier tipo)
   * @returns URL completa de la imagen o imagen por defecto
   */
  getImagenUrl(ruta: any): string {
    if (!ruta) {
      return this.heroDefaultImage;
    }
    const rutaStr = String(ruta);
    if (rutaStr.startsWith("http://") || rutaStr.startsWith("https://")) {
      return rutaStr;
    }
    // ✅ Usar la URL base del backend desde environment
    return this.baseUrl + rutaStr;
  }
}
