import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {RouterModule, Router} from "@angular/router";
import {EditorModule} from "@tinymce/tinymce-angular";
import {AuthService} from "../../services/auth.service";
import {Administrador} from "../../models/administrador.models";
import {ContenidoService} from "../../services/contenido.service";
import {HttpClient} from "@angular/common/http";
import {DateOrNeverPipe} from "../../pipes/date-or-never.pipe";
import dayjs from "dayjs";
import {DatepickerModule} from "../../datepicker.module";
import {UsuarioService} from "../../services/usuario.service";
import {AdminService} from "../../services/admin.service";

import {
  ContenidoSeccion,
  Habitacion,
  HabitacionCreacion,
  HabitacionActualizacion,
  Servicio,
  ServicioCreacion,
  ServicioActualizacion,
  ICONOS_DISPONIBLES,
  RedSocial,
  RedSocialCreacion,
  RedSocialActualizacion,
  ICONOS_REDES_DISPONIBLES,
  PaginaLegal,
  PaginaLegalCreacion,
  PaginaLegalActualizacion,
  PaginasLegalesData,
  Reserva,
} from "../../models/contenido.models";
import {Subscription} from "rxjs";

import {
  HabitacionAdmin,
  RedSocialAdmin,
  PrecheckingAdmin,
  EstadisticasAdmin,
  ReservaReciente,
  TinyMCEBlobInfo,
  AboutContentResponse,
} from "../../models/administrador.models";
import {environment} from "../../../environments/environment";

type SeccionAdmin =
  | "dashboard"
  | "about"
  | "habitaciones"
  | "servicios"
  | "redes"
  | "legal"
  | "reservas"
  | "precheckings"
  | "usuarios"
  | "perfil"
  | "configuracion";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EditorModule,
    DateOrNeverPipe,
    DatepickerModule,
  ],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.scss"],
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild("fileInputHero") fileInputHero!: ElementRef<HTMLInputElement>;

  // ============================================
  // ADMIN - DATOS DEL USUARIO LOGUEADO
  // ============================================
  admin: Administrador | null = null;
  seccionActual: SeccionAdmin = "dashboard";
  menuAbierto: boolean = false;
  guardando: boolean = false;

  // ============================================
  // TÍTULOS DE SECCIONES
  // ============================================
  titulosSeccion: Record<SeccionAdmin, string> = {
    dashboard: "📊 Dashboard",
    about: "📝 Sobre Nosotros",
    habitaciones: "🏠 Habitaciones",
    servicios: "🎯 Servicios",
    redes: "🌐 Redes Sociales",
    legal: "📄 Páginas Legales",
    reservas: "📋 Reservas",
    precheckings: "✅ Pre-checkings",
    usuarios: "👥 Usuarios",
    perfil: "👤 Mi Perfil",
    configuracion: "⚙️ Configuración",
  };

  reservasRecientes: ReservaReciente[] = [];
  cargando: boolean = true;
  error: string = "";
  private subscriptions: Subscription[] = [];

  // ============================================
  // CONTENIDO - ABOUT
  // ============================================
  contenidoAbout: string = "";
  habitacionesData: ContenidoSeccion = {};

  // ============================================
  // ESTADÍSTICAS DEL DASHBOARD
  // ============================================
  estadisticas: EstadisticasAdmin = {
    reservasHoy: 0,
    reservasSemana: 0,
    precheckingsPendientes: 0,
    habitacionesDisponibles: 0,
  };

  // ============================================
  // MENSAJES DE NOTIFICACIÓN
  // ============================================
  mensajeGuardado: string = "";
  mensajeExito: boolean = true;
  mensajeNotificacion: string = "";
  notificacionExito: boolean = true;
  private timeoutNotificacion: any = null;

  // ============================================
  // HABITACIONES
  // ============================================
  habitaciones: HabitacionAdmin[] = [];

  // Modal Habitaciones
  habitacionSeleccionada: HabitacionAdmin | null = null;
  modalHabitacionAbierto: boolean = false;
  esEdicion: boolean = false;
  imagenHabitacion: File | null = null;
  previewImagenHabitacion: string | null = null;
  subiendoImagen: boolean = false;
  caracteristicasInput: string = "";

  // ============================================
  // SERVICIOS
  // ============================================
  servicios: Servicio[] = [];
  iconosDisponibles: string[] = ICONOS_DISPONIBLES;

  // Modal Servicios
  servicioSeleccionado: Servicio | null = null;
  modalServicioAbierto: boolean = false;
  esEdicionServicio: boolean = false;

  // ============================================
  // REDES SOCIALES
  // ============================================
  redesSociales: RedSocial[] = [];
  iconosRedesDisponibles: string[] = ICONOS_REDES_DISPONIBLES;

  // Modal Redes Sociales
  redSocialSeleccionada: RedSocial | null = null;
  modalRedSocialAbierto: boolean = false;
  esEdicionRedSocial: boolean = false;

  // ============================================
  // PÁGINAS LEGALES
  // ============================================
  paginasLegales: PaginasLegalesData = {
    aviso_legal: {
      id: 0,
      clave: "aviso-legal",
      titulo: "Aviso Legal",
      contenido: "",
    },
    politica_privacidad: {
      id: 0,
      clave: "politica-privacidad",
      titulo: "Política de Privacidad",
      contenido: "",
    },
    politica_cookies: {
      id: 0,
      clave: "politica-cookies",
      titulo: "Política de Cookies",
      contenido: "",
    },
  };

  // ============================================
  // RESERVAS
  // ============================================
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  cargandoReservas: boolean = false;
  reservasCargadas: boolean = false;

  // Filtros de reservas
  filtroBusqueda: string = "";
  filtroEstado: string = "todos";
  filtroPrechecking: string = "todas";

  // Datepicker
  selectedDateRange = {
    startDate: dayjs().add(0, "day").toDate(),
    endDate: dayjs().add(30, "day").toDate(),
  };
  today: dayjs.Dayjs = dayjs();

  // Modal Reservas
  reservaSeleccionada: Reserva | null = null;
  modalReservaAbierto: boolean = false;
  modalEditarReservaAbierto: boolean = false;

  // Control de eventos (evita colapsos)
  private timeoutId: any = null;
  private primeraCarga: boolean = true;

  // ============================================
  // USUARIOS
  // ============================================
  usuarios: any[] = [];
  cargandoUsuarios: boolean = false;
  guardandoUsuario: boolean = false;

  // Modal Usuario
  usuarioSeleccionado: any = null;
  modalUsuarioAbierto: boolean = false;
  esEdicionUsuario: boolean = false;

  // Contraseña
  nuevaContrasena: string = "";
  confirmarContrasena: string = "";
  fuerzaContrasena: number = 0;
  mensajeErrorUsuario: string = "";

  // ============================================
  // PRECHECKINGS (datos de ejemplo)
  // ============================================
  precheckings: PrecheckingAdmin[] = [];
  redes: RedSocialAdmin[] = [];

  // ============================================
  // CONFIGURACIÓN DEL EDITOR TINYMCE
  // ============================================
  tinymceApiKey: string = "bcw6f234ra2046g9mocwoo5sn5gd613gj2y28vn0nnoiot1r";

  editorConfigLegal = {
    height: 400,
    menubar: true,
    language: "es",
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "help",
      "wordcount",
      "emoticons",
    ],
    toolbar:
      "undo redo | blocks | " +
      "bold italic underline strikethrough | fontfamily fontsize | " +
      "alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | " +
      "link image media | " +
      "table | code | removeformat | help",
    content_style: `
    body { 
      font-family: Helvetica, Arial, sans-serif; 
      font-size: 16px; 
      line-height: 1.6; 
      padding: 10px; 
    }
    h1, h2, h3, h4 { color: #8B7355; }
    img { max-width: 100%; height: auto; }
  `,
    images_upload_url: `${environment.apiUrl}/upload/tinymce`,
    automatic_uploads: true,
    file_picker_types: "image",
    images_upload_handler: (
      blobInfo: TinyMCEBlobInfo,
      _progress: (percent: number) => void,
    ): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", blobInfo.blob(), blobInfo.filename());

        this.http
          .post<{
            location: string;
          }>(`${environment.apiUrl}/upload/tinymce`, formData)
          .subscribe({
            next: (response) => {
              resolve(response.location);
            },
            error: (error) => {
              console.error("❌ Error al subir imagen:", error);
              reject("Error al subir la imagen: " + error.message);
            },
          });
      });
    },
  };

  editorConfig = {
    height: 500,
    menubar: true,
    language: "es",
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "help",
      "wordcount",
      "emoticons",
    ],
    toolbar:
      "undo redo | blocks | " +
      "bold italic underline strikethrough | fontfamily fontsize | " +
      "alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | " +
      "link image media | " +
      "table | code | removeformat | help",
    content_style: `
      body { 
        font-family: Helvetica, Arial, sans-serif; 
        font-size: 16px; 
        line-height: 1.6; 
        padding: 10px; 
      }
      h1, h2, h3, h4 { color: #8B7355; }
      img { max-width: 100%; height: auto; }
      blockquote { 
        border-left: 4px solid #8B7355; 
        padding-left: 15px; 
        margin-left: 0; 
        color: #666; 
      }
    `,
    images_upload_url: `${environment.apiUrl}/upload/tinymce`,
    automatic_uploads: true,
    file_picker_types: "image",

    images_upload_handler: (
      blobInfo: TinyMCEBlobInfo,
      _progress: (percent: number) => void,
    ): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", blobInfo.blob(), blobInfo.filename());

        this.http
          .post<{
            location: string;
          }>(`${environment.apiUrl}/upload/tinymce`, formData)
          .subscribe({
            next: (response) => {
              resolve(response.location);
            },
            error: (error) => {
              console.error("❌ Error al subir imagen:", error);
              reject("Error al subir la imagen: " + error.message);
            },
          });
      });
    },
  };

  seccionesLista: string[] = [];
  seccionConfigActual: string = "";
  seccionConfigData: ContenidoSeccion = {};
  guardandoConfig: boolean = false;
  mensajeConfig: string = "";
  mensajeConfigExito: boolean = true;
  subiendoImagenHero: boolean = false;
  imagenHeroSeleccionada: File | null = null;

  // Mapeo de nombres de sección para mostrar
  nombresSecciones: {[key: string]: string} = {
    home: "🏠 Inicio",
    hero: "🎯 Hero",
    servicios: "🎯 Servicios",
    habitaciones: "🛏️ Habitaciones",
    cta: "📢 Llamada a la acción",
    footer: "📄 Pie de página",
    amenities: "✨ Instalaciones",
  };

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    private authService: AuthService,
    private contenidoService: ContenidoService,
    private usuarioService: UsuarioService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private adminService: AdminService,
  ) {}

  // ============================================
  // ngOnInit - CARGA INICIAL
  // ============================================
  ngOnInit(): void {
    this.authService.admin$.subscribe((admin) => {
      this.admin = admin;
    });

    this.contenidoService
      .getContenidoBySeccion("habitaciones")
      .subscribe((data: ContenidoSeccion) => {
        this.habitacionesData = data;
      });

    // Cargar todos los datos
    this.cargarHabitaciones();
    this.cargarServicios();
    this.cargarRedes();
    this.cargarPrecheckings();
    this.cargarUsuarios();
    this.cargarContenidoAbout();
    this.cargarRedesSociales();
    this.cargarPaginasLegales();
    this.cargarReservas();
    this.cargarSeccionesConfig();
    this.cargarEstadisticas();
    this.cargarReservasRecientes();
  }
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  cambiarSeccion(seccion: SeccionAdmin): void {
    this.seccionActual = seccion;
    window.scrollTo({top: 0, behavior: "smooth"});
    this.menuAbierto = false;

    if (
      seccion === "reservas" &&
      !this.reservasCargadas &&
      !this.cargandoReservas
    ) {
      setTimeout(() => {
        this.cargarReservas();
      }, 100);
    }
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        // ✅ Éxito: Redirige al usuario a la página de login
        this.router.navigate(["/login"]);
      },
      error: (err) => {
        // ❌ Error: Muestra un mensaje si algo falla
        console.error("Error al cerrar sesión:", err);
        alert("Hubo un problema al cerrar la sesión. Inténtalo de nuevo.");
      },
    });
  }
  // ============================================
  // UTILIDADES
  // ============================================
  getNombreCompleto(): string {
    if (!this.admin) return "Administrador";
    return this.admin.nombre || this.admin.usuario;
  }

  getIniciales(): string {
    if (!this.admin) return "A";
    const nombre = this.admin.nombre || this.admin.usuario;
    return nombre.charAt(0).toUpperCase();
  }

  // ============================================
  // MENSAJES Y NOTIFICACIONES
  // ============================================
  mostrarMensaje(mensaje: string, exito: boolean = true): void {
    this.mensajeGuardado = mensaje;
    this.mensajeExito = exito;
    setTimeout(() => {
      this.mensajeGuardado = "";
    }, 5000);
  }

  mostrarNotificacion(mensaje: string, exito: boolean = true): void {
    if (this.timeoutNotificacion) {
      clearTimeout(this.timeoutNotificacion);
      this.timeoutNotificacion = null;
    }

    this.mensajeNotificacion = mensaje;
    this.notificacionExito = exito;

    this.timeoutNotificacion = setTimeout(() => {
      this.cerrarNotificacion();
    }, 5000);
  }

  cerrarNotificacion(): void {
    this.mensajeNotificacion = "";
    if (this.timeoutNotificacion) {
      clearTimeout(this.timeoutNotificacion);
      this.timeoutNotificacion = null;
    }
  }

  // ============================================
  // ABOUT - CONTENIDO
  // ============================================
  cargarContenidoAbout(): void {
    this.contenidoService.getContenidoBySeccion("about").subscribe({
      next: (data: AboutContentResponse) => {
        if (data && data.about_content) {
          this.contenidoAbout = data.about_content;
        } else {
          this.contenidoAbout = this.obtenerContenidoDefault();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al cargar contenido about:", error);
        this.contenidoAbout = this.obtenerContenidoDefault();
      },
    });
  }

  obtenerContenidoDefault(): string {
    return `
      <h2 style="color: #8B7355; text-align: center;">Bienvenido a nuestro paraíso</h2>
      <p style="text-align: center; font-size: 1.2rem; color: #666;">
        Un lugar donde la naturaleza y el confort se encuentran
      </p>
      <p>Ubicado en el corazón del campo, nuestro hotel te ofrece una experiencia única de desconexión y tranquilidad.</p>
      <p>Rodeado de paisajes impresionantes, podrás disfrutar de la paz que solo la naturaleza puede ofrecer.</p>
      <p>Nuestras instalaciones cuentan con:</p>
      <ul>
        <li>🛏️ Habitaciones confortables con vistas al jardín</li>
        <li>🍽️ Restaurante con cocina tradicional</li>
        <li>🌿 Zonas verdes y jardines</li>
        <li>🏊 Piscina climatizada</li>
        <li>🚴 Rutas de senderismo y bicicleta</li>
      </ul>
      <p style="text-align: center;">
        <img src="http://localhost:3000/uploads/imagenes/about_hotel.jpg" alt="Hotel Rural" style="max-width: 100%; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      </p>
    `;
  }

  guardarAbout(): void {
    this.guardando = true;
    this.mensajeGuardado = "";

    const datos = {
      about_content: this.contenidoAbout,
    };

    this.contenidoService.actualizarContenido("about", datos).subscribe({
      next: (_response) => {
        this.guardando = false;
        this.mostrarMensaje("✅ Contenido guardado correctamente", true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al guardar contenido:", error);
        this.guardando = false;
        this.mostrarMensaje(
          error.error?.message || "❌ Error al guardar el contenido",
          false,
        );
      },
    });
  }

  restaurarAbout(): void {
    if (
      confirm("¿Estás seguro de que quieres restaurar el contenido original?")
    ) {
      this.cargarContenidoAbout();
      this.mostrarMensaje("Contenido restaurado correctamente", true);
    }
  }

  abrirVistaPrevia(): void {
    const ventana = window.open("", "_blank");
    if (ventana) {
      ventana.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vista previa - Sobre Nosotros</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #333; }
              h1, h2, h3 { color: #8B7355; }
              img { max-width: 100%; height: auto; border-radius: 8px; }
              .preview-header { border-bottom: 2px solid #8B7355; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
              .preview-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="preview-header"><h1>🔍 Vista previa - Sobre Nosotros</h1></div>
            <div class="content">${this.contenidoAbout}</div>
            <div class="preview-footer"><p>Esta es una vista previa del contenido.</p></div>
          </body>
        </html>
      `);
      ventana.document.close();
    }
  }

  // ============================================
  // HABITACIONES - CRUD
  // ============================================
  cargarHabitaciones(): void {
    this.contenidoService.getHabitaciones().subscribe({
      next: (data: Habitacion[]) => {
        this.habitaciones = data.map((item: Habitacion) => ({
          id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion || "",
          precio:
            typeof item.precio === "string"
              ? parseFloat(item.precio)
              : Number(item.precio) || 0,
          imagen: item.imagen || "",
          caracteristicas: item.caracteristicas || [],
          capacidad_adultos: item.capacidad_adultos || 2,
          capacidad_ninos: item.capacidad_ninos || 1,
          activo: item.activo !== undefined ? item.activo : true,
        }));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al cargar habitaciones:", error);
        this.habitaciones = [];
      },
    });
  }

  abrirModalNuevaHabitacion(): void {
    this.habitacionSeleccionada = {
      id: 0,
      nombre: "",
      descripcion: "",
      precio: 0,
      imagen: "",
      caracteristicas: [],
      capacidad_adultos: 2,
      capacidad_ninos: 1,
      activo: true,
    };
    this.caracteristicasInput = "";
    this.esEdicion = false;
    this.previewImagenHabitacion = null;
    this.imagenHabitacion = null;
    this.modalHabitacionAbierto = true;
  }

  abrirModalEditarHabitacion(habitacion: HabitacionAdmin): void {
    this.habitacionSeleccionada = {...habitacion};
    this.caracteristicasInput = habitacion.caracteristicas?.join(", ") || "";
    this.esEdicion = true;
    this.previewImagenHabitacion = habitacion.imagen
      ? `http://localhost:3000${habitacion.imagen}`
      : null;
    this.imagenHabitacion = null;
    this.modalHabitacionAbierto = true;
  }

  cerrarModalHabitacion(): void {
    this.modalHabitacionAbierto = false;
    this.habitacionSeleccionada = null;
    this.previewImagenHabitacion = null;
    this.imagenHabitacion = null;
  }

  onImagenHabitacionSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.imagenHabitacion = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagenHabitacion = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarHabitacion(): void {
    if (!this.habitacionSeleccionada) return;

    if (
      !this.habitacionSeleccionada.nombre ||
      this.habitacionSeleccionada.nombre.trim() === ""
    ) {
      this.mostrarMensaje(
        "❌ El nombre de la habitación es obligatorio",
        false,
      );
      return;
    }

    if (
      !this.habitacionSeleccionada.precio ||
      this.habitacionSeleccionada.precio <= 0
    ) {
      this.mostrarMensaje("❌ El precio debe ser mayor que 0", false);
      return;
    }

    const caracteristicas = this.caracteristicasInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    this.guardando = true;

    if (this.imagenHabitacion) {
      this.subiendoImagen = true;
      const formData = new FormData();

      formData.append("imagen", this.imagenHabitacion);
      formData.append("seccion", "habitaciones");

      let nombreHabitacion = this.habitacionSeleccionada.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      if (!nombreHabitacion) {
        nombreHabitacion = `habitacion_${Date.now()}`;
      }

      formData.append("nombre", nombreHabitacion);

      this.contenidoService.subirImagenHabitacion(formData).subscribe({
        next: (response) => {
          this.subiendoImagen = false;
          this.habitacionSeleccionada!.imagen = response.ruta;
          this.guardarHabitacionDatos(caracteristicas);
        },
        error: (error) => {
          console.error("❌ Error al subir imagen:", error);
          this.subiendoImagen = false;
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al subir la imagen",
            false,
          );
        },
      });
    } else {
      this.guardarHabitacionDatos(caracteristicas);
    }
  }

  private guardarHabitacionDatos(caracteristicas: string[]): void {
    const datos: HabitacionCreacion = {
      nombre: this.habitacionSeleccionada!.nombre || "",
      descripcion: this.habitacionSeleccionada!.descripcion || "",
      precio: this.habitacionSeleccionada!.precio || 0,
      imagen: this.habitacionSeleccionada!.imagen || "",
      caracteristicas: caracteristicas || [],
      capacidad_adultos: this.habitacionSeleccionada!.capacidad_adultos || 2,
      capacidad_ninos: this.habitacionSeleccionada!.capacidad_ninos || 1,
      activo:
        this.habitacionSeleccionada!.activo !== undefined
          ? this.habitacionSeleccionada!.activo
          : true,
    };

    if (this.esEdicion) {
      const datosActualizacion: HabitacionActualizacion = {
        id: this.habitacionSeleccionada!.id,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precio,
        imagen: datos.imagen,
        caracteristicas: datos.caracteristicas,
        capacidad_adultos: datos.capacidad_adultos,
        capacidad_ninos: datos.capacidad_ninos,
        activo: datos.activo,
      };

      this.contenidoService.actualizarHabitacion(datosActualizacion).subscribe({
        next: (_response) => {
          this.guardando = false;
          this.cerrarModalHabitacion();
          this.cargarHabitaciones();
          this.mostrarMensaje("✅ Habitación actualizada correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al actualizar habitación:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al actualizar la habitación",
            false,
          );
        },
      });
    } else {
      this.contenidoService.crearHabitacion(datos).subscribe({
        next: (_response) => {
          this.guardando = false;
          this.cerrarModalHabitacion();
          this.cargarHabitaciones();
          this.mostrarMensaje("✅ Habitación creada correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al crear habitación:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al crear la habitación",
            false,
          );
        },
      });
    }
  }

  eliminarHabitacion(id: number): void {
    const habitacion = this.habitaciones.find((h) => h.id === id);

    if (!habitacion) {
      this.mostrarMensaje("❌ Habitación no encontrada", false);
      return;
    }

    const mensaje = habitacion.imagen
      ? `¿Estás seguro de eliminar "${habitacion.nombre}"? Se eliminará también la imagen.`
      : `¿Estás seguro de eliminar "${habitacion.nombre}"?`;

    if (confirm(mensaje)) {
      this.guardando = true;

      this.contenidoService
        .eliminarHabitacion(id, habitacion.imagen || "")
        .subscribe({
          next: (_response) => {
            this.guardando = false;
            this.cargarHabitaciones();
            this.mostrarMensaje(
              `✅ "${habitacion.nombre}" eliminada correctamente`,
              true,
            );
          },
          error: (error) => {
            console.error("❌ Error al eliminar habitación:", error);
            this.guardando = false;
            this.mostrarMensaje(
              error.error?.message || "❌ Error al eliminar la habitación",
              false,
            );
          },
        });
    }
  }

  toggleActivo(habitacion: HabitacionAdmin): void {
    const nuevoEstado = !habitacion.activo;
    const mensaje = nuevoEstado ? "activar" : "desactivar";

    if (confirm(`¿Estás seguro de ${mensaje} esta habitación?`)) {
      const datosActualizacion: HabitacionActualizacion = {
        id: habitacion.id,
        nombre: habitacion.nombre || "",
        descripcion: habitacion.descripcion || "",
        precio: habitacion.precio || 0,
        imagen: habitacion.imagen || "",
        caracteristicas: habitacion.caracteristicas || [],
        capacidad_adultos: habitacion.capacidad_adultos || 2,
        capacidad_ninos: habitacion.capacidad_ninos || 1,
        activo: nuevoEstado,
      };

      this.contenidoService.actualizarHabitacion(datosActualizacion).subscribe({
        next: () => {
          this.cargarHabitaciones();
          this.mostrarMensaje(
            `✅ Habitación ${nuevoEstado ? "activada" : "desactivada"} correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al cambiar estado:", error);
          this.mostrarMensaje("❌ Error al cambiar el estado", false);
        },
      });
    }
  }

  // ============================================
  // SERVICIOS - CRUD
  // ============================================
  cargarServicios(): void {
    this.contenidoService.getServiciosAdmin().subscribe({
      next: (data: Servicio[]) => {
        this.servicios = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al cargar servicios:", error);
        this.servicios = [];
      },
    });
  }

  obtenerSiguienteOrden(): number {
    if (!this.servicios || this.servicios.length === 0) {
      return 1;
    }
    const maxOrden = Math.max(...this.servicios.map((s) => s.orden || 0));
    return maxOrden + 1;
  }

  abrirModalNuevoServicio(): void {
    this.servicioSeleccionado = {
      id: 0,
      titulo: "",
      descripcion: "",
      icono: "bi-star",
      orden: this.obtenerSiguienteOrden(),
      activo: true,
    };
    this.esEdicionServicio = false;
    this.modalServicioAbierto = true;
  }

  abrirModalEditarServicio(servicio: Servicio): void {
    this.servicioSeleccionado = {...servicio};
    this.esEdicionServicio = true;
    this.modalServicioAbierto = true;
  }

  cerrarModalServicio(): void {
    this.modalServicioAbierto = false;
    this.servicioSeleccionado = null;
  }

  seleccionarIconoServicio(icono: string): void {
    if (this.servicioSeleccionado) {
      this.servicioSeleccionado.icono = icono;
    }
  }

  guardarServicio(): void {
    if (!this.servicioSeleccionado) return;

    if (
      !this.servicioSeleccionado.titulo ||
      this.servicioSeleccionado.titulo.trim() === ""
    ) {
      this.mostrarMensaje("❌ El título del servicio es obligatorio", false);
      return;
    }

    if (
      !this.servicioSeleccionado.descripcion ||
      this.servicioSeleccionado.descripcion.trim() === ""
    ) {
      this.mostrarMensaje(
        "❌ La descripción del servicio es obligatoria",
        false,
      );
      return;
    }

    if (!this.servicioSeleccionado.icono) {
      this.mostrarMensaje("❌ Debes seleccionar un icono", false);
      return;
    }

    this.guardando = true;

    const datos: ServicioCreacion = {
      titulo: this.servicioSeleccionado.titulo.trim(),
      descripcion: this.servicioSeleccionado.descripcion.trim(),
      icono: this.servicioSeleccionado.icono,
      orden: this.servicioSeleccionado.orden || 0,
      activo:
        this.servicioSeleccionado.activo !== undefined
          ? this.servicioSeleccionado.activo
          : true,
    };

    if (this.esEdicionServicio) {
      const datosActualizacion: ServicioActualizacion = {
        id: this.servicioSeleccionado.id,
        ...datos,
      };

      this.contenidoService.actualizarServicio(datosActualizacion).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModalServicio();
          this.cargarServicios();
          this.mostrarMensaje("✅ Servicio actualizado correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al actualizar servicio:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al actualizar el servicio",
            false,
          );
        },
      });
    } else {
      this.contenidoService.crearServicio(datos).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModalServicio();
          this.cargarServicios();
          this.mostrarMensaje("✅ Servicio creado correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al crear servicio:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al crear el servicio",
            false,
          );
        },
      });
    }
  }

  eliminarServicio(id: number): void {
    const servicio = this.servicios.find((s) => s.id === id);
    if (!servicio) {
      this.mostrarMensaje("❌ Servicio no encontrado", false);
      return;
    }

    if (
      confirm(`¿Estás seguro de eliminar el servicio "${servicio.titulo}"?`)
    ) {
      this.guardando = true;
      this.contenidoService.eliminarServicio(id).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarServicios();
          this.mostrarMensaje(
            `✅ "${servicio.titulo}" eliminado correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al eliminar servicio:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al eliminar el servicio",
            false,
          );
        },
      });
    }
  }

  toggleActivoServicio(servicio: Servicio): void {
    const nuevoEstado = !servicio.activo;
    const mensaje = nuevoEstado ? "activar" : "desactivar";

    if (
      confirm(`¿Estás seguro de ${mensaje} el servicio "${servicio.titulo}"?`)
    ) {
      const datosActualizacion: ServicioActualizacion = {
        id: servicio.id,
        titulo: servicio.titulo,
        descripcion: servicio.descripcion,
        icono: servicio.icono,
        orden: servicio.orden || 0,
        activo: nuevoEstado,
      };

      this.contenidoService.actualizarServicio(datosActualizacion).subscribe({
        next: () => {
          this.cargarServicios();
          this.mostrarMensaje(
            `✅ Servicio ${nuevoEstado ? "activado" : "desactivado"} correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al cambiar estado:", error);
          this.mostrarMensaje("❌ Error al cambiar el estado", false);
        },
      });
    }
  }

  // ============================================
  // REDES SOCIALES - CRUD
  // ============================================
  cargarRedesSociales(): void {
    this.contenidoService.getRedesSocialesAdmin().subscribe({
      next: (data: RedSocial[]) => {
        this.redesSociales = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al cargar redes sociales:", error);
        this.redesSociales = [];
      },
    });
  }

  abrirModalNuevaRedSocial(): void {
    const siguienteOrden =
      this.redesSociales.length > 0
        ? Math.max(...this.redesSociales.map((r) => r.orden || 0)) + 1
        : 1;

    this.redSocialSeleccionada = {
      id: 0,
      nombre: "",
      icono: "bi-facebook",
      url: "",
      activo: true,
      orden: siguienteOrden,
    };
    this.esEdicionRedSocial = false;
    this.modalRedSocialAbierto = true;
  }

  abrirModalEditarRedSocial(red: RedSocial): void {
    this.redSocialSeleccionada = {...red};
    this.esEdicionRedSocial = true;
    this.modalRedSocialAbierto = true;
  }

  cerrarModalRedSocial(): void {
    this.modalRedSocialAbierto = false;
    this.redSocialSeleccionada = null;
  }

  seleccionarIconoRedSocial(icono: string): void {
    if (this.redSocialSeleccionada) {
      this.redSocialSeleccionada.icono = icono;
    }
  }

  guardarRedSocial(): void {
    if (!this.redSocialSeleccionada) return;

    if (
      !this.redSocialSeleccionada.nombre ||
      this.redSocialSeleccionada.nombre.trim() === ""
    ) {
      this.mostrarMensaje("❌ El nombre es obligatorio", false);
      return;
    }

    if (
      !this.redSocialSeleccionada.url ||
      this.redSocialSeleccionada.url.trim() === ""
    ) {
      this.mostrarMensaje("❌ La URL es obligatoria", false);
      return;
    }

    if (!this.redSocialSeleccionada.icono) {
      this.mostrarMensaje("❌ Debes seleccionar un icono", false);
      return;
    }

    this.guardando = true;

    const datos: RedSocialCreacion = {
      nombre: this.redSocialSeleccionada.nombre.trim(),
      icono: this.redSocialSeleccionada.icono,
      url: this.redSocialSeleccionada.url.trim(),
      activo:
        this.redSocialSeleccionada.activo !== undefined
          ? this.redSocialSeleccionada.activo
          : true,
      orden: this.redSocialSeleccionada.orden || 0,
    };

    if (this.esEdicionRedSocial) {
      const datosActualizacion: RedSocialActualizacion = {
        id: this.redSocialSeleccionada.id,
        ...datos,
      };

      this.contenidoService.actualizarRedSocial(datosActualizacion).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModalRedSocial();
          this.cargarRedesSociales();
          this.mostrarMensaje("✅ Red social actualizada correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al actualizar red social:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al actualizar la red social",
            false,
          );
        },
      });
    } else {
      this.contenidoService.crearRedSocial(datos).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModalRedSocial();
          this.cargarRedesSociales();
          this.mostrarMensaje("✅ Red social creada correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al crear red social:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al crear la red social",
            false,
          );
        },
      });
    }
  }

  eliminarRedSocial(id: number): void {
    const red = this.redesSociales.find((r) => r.id === id);
    if (!red) {
      this.mostrarMensaje("❌ Red social no encontrada", false);
      return;
    }

    if (confirm(`¿Estás seguro de eliminar la red social "${red.nombre}"?`)) {
      this.guardando = true;
      this.contenidoService.eliminarRedSocial(id).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarRedesSociales();
          this.mostrarMensaje(
            `✅ "${red.nombre}" eliminada correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al eliminar red social:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al eliminar la red social",
            false,
          );
        },
      });
    }
  }

  toggleActivoRedSocial(red: RedSocial): void {
    const nuevoEstado = !red.activo;
    const mensaje = nuevoEstado ? "activar" : "desactivar";

    if (confirm(`¿Estás seguro de ${mensaje} la red social "${red.nombre}"?`)) {
      const datosActualizacion: RedSocialActualizacion = {
        id: red.id,
        nombre: red.nombre,
        icono: red.icono,
        url: red.url,
        activo: nuevoEstado,
        orden: red.orden || 0,
      };

      this.contenidoService.actualizarRedSocial(datosActualizacion).subscribe({
        next: () => {
          this.cargarRedesSociales();
          this.mostrarMensaje(
            `✅ Red social ${nuevoEstado ? "activada" : "desactivada"} correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al cambiar estado:", error);
          this.mostrarMensaje("❌ Error al cambiar el estado", false);
        },
      });
    }
  }

  // ============================================
  // PÁGINAS LEGALES - CRUD
  // ============================================
  cargarPaginasLegales(): void {
    this.contenidoService.getPaginasLegalesAdmin().subscribe({
      next: (data: PaginaLegal[]) => {
        this.paginasLegales = {
          aviso_legal: {
            id: 0,
            clave: "aviso-legal",
            titulo: "Aviso Legal",
            contenido: "",
          },
          politica_privacidad: {
            id: 0,
            clave: "politica-privacidad",
            titulo: "Política de Privacidad",
            contenido: "",
          },
          politica_cookies: {
            id: 0,
            clave: "politica-cookies",
            titulo: "Política de Cookies",
            contenido: "",
          },
        };

        data.forEach((pagina: PaginaLegal) => {
          if (pagina.clave === "terms") {
            this.paginasLegales.aviso_legal = {
              id: pagina.id,
              clave: "aviso-legal",
              titulo: "Aviso Legal",
              contenido: pagina.contenido,
              fecha_actualizacion: pagina.fecha_actualizacion,
            };
          } else if (pagina.clave === "privacy") {
            this.paginasLegales.politica_privacidad = {
              id: pagina.id,
              clave: "politica-privacidad",
              titulo: "Política de Privacidad",
              contenido: pagina.contenido,
              fecha_actualizacion: pagina.fecha_actualizacion,
            };
          } else if (pagina.clave === "cookies") {
            this.paginasLegales.politica_cookies = {
              id: pagina.id,
              clave: "politica-cookies",
              titulo: "Política de Cookies",
              contenido: pagina.contenido,
              fecha_actualizacion: pagina.fecha_actualizacion,
            };
          }
        });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al cargar páginas legales:", error);
      },
    });
  }

  guardarPaginaLegal(clave: string): void {
    this.guardando = true;
    this.mensajeGuardado = "";

    let pagina: PaginaLegal;
    let tipo: string;
    let claveBD: string;

    switch (clave) {
      case "aviso-legal":
        pagina = this.paginasLegales.aviso_legal;
        tipo = "Aviso Legal";
        claveBD = "terms";
        break;
      case "politica-privacidad":
        pagina = this.paginasLegales.politica_privacidad;
        tipo = "Política de Privacidad";
        claveBD = "privacy";
        break;
      case "politica-cookies":
        pagina = this.paginasLegales.politica_cookies;
        tipo = "Política de Cookies";
        claveBD = "cookies";
        break;
      default:
        this.guardando = false;
        return;
    }

    if (!pagina.contenido || pagina.contenido.trim() === "") {
      this.mostrarMensaje(`❌ El contenido de ${tipo} es obligatorio`, false);
      this.guardando = false;
      return;
    }

    const datos: PaginaLegalCreacion = {
      clave: claveBD,
      titulo: pagina.titulo,
      contenido: pagina.contenido.trim(),
    };

    if (pagina.id > 0) {
      const datosActualizacion: PaginaLegalActualizacion = {
        id: pagina.id,
        ...datos,
      };

      this.contenidoService
        .actualizarPaginaLegal(datosActualizacion)
        .subscribe({
          next: (response) => {
            this.guardando = false;
            this.mostrarMensaje(`✅ ${tipo} guardado correctamente`, true);
            if (response && response.id) {
              pagina.id = response.id;
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error(`❌ Error al guardar ${tipo}:`, error);
            this.guardando = false;
            this.mostrarMensaje(
              error.error?.message || `❌ Error al guardar ${tipo}`,
              false,
            );
          },
        });
    } else {
      this.contenidoService.crearPaginaLegal(datos).subscribe({
        next: (response) => {
          pagina.id = response.id;
          this.guardando = false;
          this.mostrarMensaje(`✅ ${tipo} guardado correctamente`, true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`❌ Error al crear ${tipo}:`, error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || `❌ Error al crear ${tipo}`,
            false,
          );
        },
      });
    }
  }

  guardarTodasPaginasLegales(): void {
    this.guardando = true;
    this.mensajeGuardado = "";

    this.guardarPaginaLegal("aviso-legal");
    this.guardarPaginaLegal("politica-privacidad");
    this.guardarPaginaLegal("politica-cookies");

    setTimeout(() => {
      this.guardando = false;
      this.mostrarMensaje(
        "✅ Todas las páginas legales guardadas correctamente",
        true,
      );
    }, 1000);
  }

  restaurarPaginasLegales(): void {
    if (
      confirm(
        "¿Estás seguro de que quieres restaurar el contenido original de todas las páginas legales?",
      )
    ) {
      this.cargarPaginasLegales();
      this.mostrarMensaje("Contenido restaurado correctamente", true);
    }
  }

  // ============================================
  // RESERVAS - CRUD
  // ============================================
  cargarReservas(): void {
    if (this.cargandoReservas) {
      return;
    }

    this.cargandoReservas = true;
    this.reservas = [];

    this.contenidoService.getReservasSimple().subscribe({
      next: (data: Reserva[]) => {
        this.reservas = data;
        this.reservasFiltradas = data;
        this.reservasCargadas = true;
        this.cargandoReservas = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("❌ Error al cargar reservas:", error);
        this.reservas = [];
        this.reservasFiltradas = [];
        this.cargandoReservas = false;
        this.reservasCargadas = false;
        this.cdr.detectChanges();
      },
    });
  }

  aplicarFiltros(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.timeoutId = setTimeout(() => {
      this.aplicarFiltrosInterno();
      this.timeoutId = null;
    }, 300);
  }

  private aplicarFiltrosInterno(): void {
    let filtradas = [...this.reservas];

    if (this.filtroEstado !== "todos") {
      filtradas = filtradas.filter((r) => r.estado === this.filtroEstado);
    }

    if (this.filtroPrechecking === "si") {
      filtradas = filtradas.filter((r) => r.prechecking_realizado === true);
    } else if (this.filtroPrechecking === "no") {
      filtradas = filtradas.filter((r) => r.prechecking_realizado === false);
    }

    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== "") {
      const busqueda = this.filtroBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter((r) => {
        return (
          (r.dni_cliente && r.dni_cliente.toLowerCase().includes(busqueda)) ||
          (r.apellidos_cliente &&
            r.apellidos_cliente.toLowerCase().includes(busqueda)) ||
          (r.nombre_cliente &&
            r.nombre_cliente.toLowerCase().includes(busqueda)) ||
          (r.codigo_reserva &&
            r.codigo_reserva.toLowerCase().includes(busqueda))
        );
      });
    }

    if (
      this.selectedDateRange &&
      this.selectedDateRange.startDate &&
      this.selectedDateRange.endDate
    ) {
      const start = new Date(this.selectedDateRange.startDate);
      const end = new Date(this.selectedDateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      filtradas = filtradas.filter((r) => {
        const fechaEntrada = new Date(r.fecha_entrada);
        const fechaSalida = new Date(r.fecha_salida);
        return fechaEntrada >= start && fechaSalida <= end;
      });
    }

    this.reservasFiltradas = filtradas;
    this.cdr.detectChanges();
  }

  onDateRangeChange(event: any): void {
    if (this.primeraCarga) {
      this.primeraCarga = false;
      if (event && event.startDate && event.endDate) {
        this.selectedDateRange = {
          startDate: event.startDate,
          endDate: event.endDate,
        };
      }
      return;
    }

    if (event && event.startDate && event.endDate) {
      this.selectedDateRange = {
        startDate: event.startDate,
        endDate: event.endDate,
      };
      this.aplicarFiltros();
    }
  }

  verReserva(reserva: Reserva): void {
    this.router.navigate(["/ver-reserva/admin", reserva.id]);
  }

  cerrarModalReserva(): void {
    this.modalReservaAbierto = false;
    this.reservaSeleccionada = null;
  }

  abrirModalEditarReserva(reserva: Reserva): void {
    this.reservaSeleccionada = {...reserva};
    this.modalEditarReservaAbierto = true;
  }

  cerrarModalEditarReserva(): void {
    this.modalEditarReservaAbierto = false;
    this.reservaSeleccionada = null;
  }

  guardarEdicionReserva(): void {
    if (!this.reservaSeleccionada) return;

    this.guardando = true;
    this.contenidoService
      .actualizarReserva(this.reservaSeleccionada)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModalEditarReserva();
          this.cargarReservas();
          this.mostrarMensaje("✅ Reserva actualizada correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al actualizar reserva:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al actualizar la reserva",
            false,
          );
        },
      });
  }

  eliminarReserva(id: number): void {
    const reserva = this.reservas.find((r) => r.id === id);
    if (!reserva) {
      this.mostrarMensaje("❌ Reserva no encontrada", false);
      return;
    }

    if (
      confirm(
        `¿Estás seguro de eliminar la reserva "${reserva.codigo_reserva}" de ${reserva.nombre_cliente}?`,
      )
    ) {
      this.guardando = true;
      this.contenidoService.eliminarReserva(id).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarReservas();
          this.mostrarMensaje(
            `✅ Reserva "${reserva.codigo_reserva}" eliminada correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al eliminar reserva:", error);
          this.guardando = false;
          this.mostrarMensaje(
            error.error?.message || "❌ Error al eliminar la reserva",
            false,
          );
        },
      });
    }
  }

  reenviarEmailConfirmacion(reserva: Reserva): void {
    if (
      confirm(`¿Reenviar email de confirmación a ${reserva.email_cliente}?`)
    ) {
      this.guardando = true;
      this.mostrarNotificacion("📧 Enviando email...", true);

      this.contenidoService.reenviarEmailConfirmacion(reserva.id).subscribe({
        next: (response) => {
          this.guardando = false;

          this.mostrarNotificacion(
            `✅ Email reenviado a ${reserva.email_cliente} (${response.codigo || reserva.codigo_reserva})`,
            true,
          );
          this.cargarReservas();
        },
        error: (error) => {
          console.error("❌ Error al reenviar email:", error);
          this.guardando = false;
          this.mostrarNotificacion(
            error.error?.message ||
              "❌ Error al reenviar email. Inténtalo de nuevo.",
            false,
          );
        },
      });
    }
  }

  verPrechecking(reserva: Reserva): void {
    if (reserva.prechecking_realizado) {
      this.mostrarNotificacion(
        `✅ Pre-checking ya realizado para ${reserva.codigo_reserva}`,
        true,
      );
      return;
    }

    if (!reserva.token_prechecking) {
      console.error("❌ No hay token de prechecking para esta reserva");
      this.mostrarNotificacion(
        "❌ No hay token de prechecking disponible",
        false,
      );
      return;
    }

    this.router.navigate(["/prechecking", reserva.token_prechecking]);
  }

  // ============================================
  // PRECHECKINGS (datos de ejemplo)
  // ============================================
  cargarRedes(): void {
    this.redes = [
      {
        id: 1,
        nombre: "Facebook",
        url: "https://facebook.com",
        icono: "bi-facebook",
      },
      {
        id: 2,
        nombre: "Instagram",
        url: "https://instagram.com",
        icono: "bi-instagram",
      },
    ];
  }

  cargarPrecheckings(): void {
    this.precheckings = [
      {
        id: 1,
        reserva: "AMS-20260815-801032",
        cliente: "Rubén Burción",
        fecha: "2026-08-15",
        estado: "completado",
      },
      {
        id: 2,
        reserva: "AMS-20260815-8228A2",
        cliente: "Juan Pérez",
        fecha: "2026-08-14",
        estado: "pendiente",
      },
    ];
  }

  // ============================================
  // USUARIOS - CRUD
  // ============================================
  cargarUsuarios(): void {
    this.cargandoUsuarios = true;

    this.usuarioService.getUsuarios().subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = response.usuarios;
        }
        this.cargandoUsuarios = false;
      },
      error: (error) => {
        console.error("❌ Error al cargar usuarios:", error);
        this.cargandoUsuarios = false;
        this.mostrarNotificacion("❌ Error al cargar los usuarios", false);
      },
    });
  }

  abrirModalNuevoUsuario(): void {
    this.usuarioSeleccionado = {
      id: 0,
      usuario: "",
      nombre: "",
      email: "",
      rol: "user",
    };
    this.nuevaContrasena = "";
    this.confirmarContrasena = "";
    this.fuerzaContrasena = 0;
    this.esEdicionUsuario = false;
    this.mensajeErrorUsuario = "";
    this.modalUsuarioAbierto = true;
  }

  abrirModalEditarUsuario(usuario: any): void {
    this.usuarioSeleccionado = {...usuario};
    this.nuevaContrasena = "";
    this.confirmarContrasena = "";
    this.fuerzaContrasena = 0;
    this.esEdicionUsuario = true;
    this.mensajeErrorUsuario = "";
    this.modalUsuarioAbierto = true;
  }

  cerrarModalUsuario(): void {
    this.modalUsuarioAbierto = false;
    this.usuarioSeleccionado = null;
    this.nuevaContrasena = "";
    this.mensajeErrorUsuario = "";
  }

  guardarUsuario(): void {
    this.mensajeErrorUsuario = "";

    if (
      !this.usuarioSeleccionado.usuario ||
      this.usuarioSeleccionado.usuario.length < 3
    ) {
      this.mensajeErrorUsuario =
        "❌ El nombre de usuario debe tener al menos 3 caracteres.";
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(this.usuarioSeleccionado.usuario)) {
      this.mensajeErrorUsuario =
        "❌ El usuario solo puede contener letras y números.";
      return;
    }

    if (
      !this.usuarioSeleccionado.email ||
      this.usuarioSeleccionado.email.trim() === ""
    ) {
      this.mensajeErrorUsuario = "❌ El email es obligatorio.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.usuarioSeleccionado.email)) {
      this.mensajeErrorUsuario = "❌ Introduce un email válido.";
      return;
    }

    if (!this.esEdicionUsuario) {
      if (!this.nuevaContrasena || this.nuevaContrasena.length < 6) {
        this.mensajeErrorUsuario =
          "❌ La contraseña debe tener al menos 6 caracteres.";
        return;
      }
      if (this.nuevaContrasena !== this.confirmarContrasena) {
        this.mensajeErrorUsuario = "❌ Las contraseñas no coinciden.";
        return;
      }
    }

    if (!this.esEdicionUsuario) {
      const existe = this.usuarios.some(
        (u) =>
          u.usuario.toLowerCase() ===
          this.usuarioSeleccionado.usuario.toLowerCase(),
      );
      if (existe) {
        this.mensajeErrorUsuario = "❌ Ya existe un usuario con ese nombre.";
        return;
      }
    }

    this.guardandoUsuario = true;

    const datos = {
      usuario: this.usuarioSeleccionado.usuario,
      nombre: this.usuarioSeleccionado.nombre || "",
      email: this.usuarioSeleccionado.email,
      rol: this.usuarioSeleccionado.rol,
    };

    if (this.esEdicionUsuario) {
      const datosActualizacion: any = {
        nombre: datos.nombre,
        email: datos.email,
        rol: datos.rol,
      };

      if (this.nuevaContrasena) {
        datosActualizacion.password = this.nuevaContrasena;
      }

      this.usuarioService
        .actualizarUsuario(this.usuarioSeleccionado.id, datosActualizacion)
        .subscribe({
          next: (_response) => {
            this.guardandoUsuario = false;
            this.cerrarModalUsuario();
            this.cargarUsuarios();
            this.mostrarNotificacion(
              "✅ Usuario actualizado correctamente",
              true,
            );
          },
          error: (error) => {
            console.error("❌ Error al actualizar usuario:", error);
            this.guardandoUsuario = false;
            this.mensajeErrorUsuario =
              error.error?.message || "❌ Error al actualizar el usuario.";
          },
        });
    } else {
      const datosCreacion = {
        ...datos,
        password: this.nuevaContrasena,
      };

      this.usuarioService.crearUsuario(datosCreacion).subscribe({
        next: (_response) => {
          this.guardandoUsuario = false;
          this.cerrarModalUsuario();
          this.cargarUsuarios();
          this.mostrarNotificacion("✅ Usuario creado correctamente", true);
        },
        error: (error) => {
          console.error("❌ Error al crear usuario:", error);
          this.guardandoUsuario = false;
          this.mensajeErrorUsuario =
            error.error?.message || "❌ Error al crear el usuario.";
        },
      });
    }
  }

  eliminarUsuario(id: number): void {
    const usuario = this.usuarios.find((u) => u.id === id);

    if (!usuario) {
      this.mostrarNotificacion("❌ Usuario no encontrado", false);
      return;
    }

    if (id === this.admin?.id) {
      this.mostrarNotificacion(
        "❌ No puedes eliminar tu propio usuario",
        false,
      );
      return;
    }

    if (confirm(`¿Estás seguro de eliminar al usuario "${usuario.usuario}"?`)) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: (_response) => {
          this.cargarUsuarios();
          this.mostrarNotificacion(
            `✅ Usuario "${usuario.usuario}" eliminado correctamente`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al eliminar usuario:", error);
          this.mostrarNotificacion(
            error.error?.message || "❌ Error al eliminar el usuario",
            false,
          );
        },
      });
    }
  }

  // ============================================
  // USUARIOS - FUERZA DE CONTRASEÑA
  // ============================================
  evaluarFuerzaContrasena(): void {
    const password = this.nuevaContrasena || "";
    let puntuacion = 0;

    if (!password || password.length === 0) {
      this.fuerzaContrasena = 0;
      return;
    }

    if (password.length >= 6) puntuacion++;
    if (password.length >= 8) puntuacion++;

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntuacion++;

    if (/\d/.test(password)) puntuacion++;

    if (/[^a-zA-Z0-9]/.test(password)) puntuacion++;

    this.fuerzaContrasena = Math.min(puntuacion, 4);
  }

  obtenerTextoFuerza(): string {
    if (this.fuerzaContrasena <= 1) return "Débil";
    if (this.fuerzaContrasena === 2) return "Media";
    if (this.fuerzaContrasena >= 3) return "Fuerte";
    return "";
  }

  validarContrasenas(): boolean {
    return this.nuevaContrasena === this.confirmarContrasena;
  }

  formularioUsuarioValido(): boolean {
    if (
      !this.usuarioSeleccionado?.usuario ||
      this.usuarioSeleccionado.usuario.length < 3
    ) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !this.usuarioSeleccionado?.email ||
      !emailRegex.test(this.usuarioSeleccionado.email)
    ) {
      return false;
    }

    if (!this.esEdicionUsuario) {
      if (!this.nuevaContrasena || this.nuevaContrasena.length < 6) {
        return false;
      }
      if (this.nuevaContrasena !== this.confirmarContrasena) {
        return false;
      }
    }

    return true;
  }
  obtenerColorFuerza(): string {
    if (this.fuerzaContrasena <= 1) return "#dc3545"; // Rojo - Débil
    if (this.fuerzaContrasena === 2) return "#ffc107"; // Amarillo - Media
    if (this.fuerzaContrasena >= 3) return "#28a745"; // Verde - Fuerte
    return "#999";
  }
  // ============================================
  // CONFIGURACIÓN - CARGAR SECCIONES
  // ============================================

  cargarSeccionesConfig(): void {
    this.contenidoService.getSeccionesLista().subscribe({
      next: (secciones: string[]) => {
        this.seccionesLista = secciones;
        // Cargar la primera sección por defecto
        if (this.seccionesLista.length > 0) {
          this.cargarSeccionConfig(this.seccionesLista[0]);
        }
      },
      error: (error) => {
        console.error("❌ Error al cargar secciones:", error);
        this.mostrarMensajeConfig(
          "❌ Error al cargar las secciones de configuración",
          false,
        );
      },
    });
  }

  cargarSeccionConfig(seccion: string): void {
    this.seccionConfigActual = seccion;
    this.guardandoConfig = false;
    this.mensajeConfig = "";

    this.contenidoService.getContenidoBySeccion(seccion).subscribe({
      next: (data: ContenidoSeccion) => {
        this.seccionConfigData = {...data};
      },
      error: (error) => {
        console.error(`❌ Error al cargar sección ${seccion}:`, error);
        this.mostrarMensajeConfig(
          `❌ Error al cargar la sección ${seccion}`,
          false,
        );
      },
    });
  }

  recargarSeccionConfig(): void {
    if (this.seccionConfigActual) {
      this.cargarSeccionConfig(this.seccionConfigActual);
      this.mostrarMensajeConfig("🔄 Contenido recargado", true);
    }
  }

  guardarSeccionConfig(): void {
    if (!this.seccionConfigActual || !this.seccionConfigData) {
      return;
    }

    this.guardandoConfig = true;
    this.mensajeConfig = "";

    // ✅ Asegurar que hero_imagen se mantiene si existe
    const datosAGuardar = {...this.seccionConfigData};

    this.contenidoService
      .actualizarSeccion(this.seccionConfigActual, datosAGuardar)
      .subscribe({
        next: (response) => {
          this.guardandoConfig = false;

          this.mostrarMensajeConfig(
            `✅ ${response.message || "Contenido guardado correctamente"}`,
            true,
          );
        },
        error: (error) => {
          console.error("❌ Error al guardar configuración:", error);
          this.guardandoConfig = false;
          this.mostrarMensajeConfig(
            error.error?.message || "❌ Error al guardar la configuración",
            false,
          );
        },
      });
  }

  mostrarMensajeConfig(mensaje: string, exito: boolean = true): void {
    this.mensajeConfig = mensaje;
    this.mensajeConfigExito = exito;

    setTimeout(() => {
      this.mensajeConfig = "";
    }, 5000);
  }

  obtenerNombreSeccion(seccion: string): string {
    return (
      this.nombresSecciones[seccion] ||
      seccion.charAt(0).toUpperCase() + seccion.slice(1)
    );
  }

  formatearClave(clave: string): string {
    // Convertir snake_case a texto legible
    return clave.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  esCampoLargo(valor: any): boolean {
    if (typeof valor !== "string") return false;
    return valor.length > 50 || valor.includes("\n");
  }
  abrirSelectorImagenHero(): void {
    // ✅ Usar ViewChild en lugar de querySelector
    if (this.fileInputHero) {
      this.fileInputHero.nativeElement.click();
    } else {
      // Fallback: buscar por ID
      const input = document.getElementById(
        "fileInputHero",
      ) as HTMLInputElement;
      if (input) {
        input.click();
      }
    }
  }

  onImagenHeroSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarMensajeConfig(
          "❌ La imagen no puede superar los 5MB",
          false,
        );
        return;
      }
      this.imagenHeroSeleccionada = file;
      this.subirImagenHero();
    }
  }
  subirImagenHero(): void {
    if (!this.imagenHeroSeleccionada) {
      return;
    }

    this.subiendoImagenHero = true;
    this.mensajeConfig = "";

    const formData = new FormData();
    formData.append("imagen", this.imagenHeroSeleccionada);

    this.contenidoService.subirImagenHero(formData).subscribe({
      next: (response) => {
        this.subiendoImagenHero = false;

        if (response.ruta) {
          // ✅ Actualizar el valor en los datos de la sección
          this.seccionConfigData["hero_imagen"] = response.ruta;

          // ✅ Guardar la sección
          this.guardarSeccionConfig();
        }
        this.imagenHeroSeleccionada = null;
      },
      error: (error) => {
        console.error("❌ Error al subir imagen del hero:", error);
        this.subiendoImagenHero = false;
        this.mostrarMensajeConfig(
          error.error?.message || "❌ Error al subir la imagen",
          false,
        );
      },
    });
  }

  eliminarImagenHero(): void {
    const ruta = this.seccionConfigData["hero_imagen"] as string;
    if (!ruta || typeof ruta !== "string") {
      this.mostrarMensajeConfig("❌ No hay imagen para eliminar", false);
      return;
    }

    if (!confirm("¿Estás seguro de eliminar la imagen del hero?")) return;

    this.contenidoService.eliminarImagenHero(ruta).subscribe({
      next: () => {
        this.seccionConfigData["hero_imagen"] = "";
        this.mostrarMensajeConfig("✅ Imagen eliminada correctamente", true);
        this.guardarSeccionConfig();
      },
      error: (error) => {
        console.error("❌ Error al eliminar imagen:", error);
        this.mostrarMensajeConfig(
          error.error?.message || "❌ Error al eliminar la imagen",
          false,
        );
      },
    });
  }
  trackByKey(index: number, item: any): string {
    return item.key; // Usa la clave (ej: 'hero_titulo') como identificador único
  }
  cargarEstadisticas() {
    const sub = this.adminService.getEstadisticas().subscribe({
      next: (response) => {
        if (response.success) {
          this.estadisticas = response.data;
          console.log("✅ Estadísticas cargadas:", this.estadisticas);
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error("❌ Error al cargar estadísticas:", error);
        this.error = "Error al cargar las estadísticas";
        this.cargando = false;
      },
    });
    this.subscriptions.push(sub);
  }

  cargarReservasRecientes() {
    const sub = this.adminService.getReservasRecientes(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.reservasRecientes = response.data;
          console.log(
            "✅ Reservas recientes cargadas:",
            this.reservasRecientes,
          );
        }
      },
      error: (error) => {
        console.error("❌ Error al cargar reservas recientes:", error);
      },
    });
    this.subscriptions.push(sub);
  }

  // Método para formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Método para obtener el estado en español
  getEstadoTexto(estado: string): string {
    const estados: Record<string, string> = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      cancelada: "Cancelada",
      completada: "Completada",
    };
    return estados[estado] || estado;
  }

  // Método para obtener la clase del estado
  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: "estado-pendiente",
      confirmada: "estado-confirmada",
      cancelada: "estado-cancelada",
      completada: "estado-completada",
    };
    return clases[estado] || "";
  }
}
