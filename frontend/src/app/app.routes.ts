// frontend/src/app/app.routes.ts
import {Routes} from "@angular/router";
import {HomeComponent} from "./pages/home/home.component";
import {HabitacionesComponent} from "./pages/habitaciones/habitaciones.component";
import {ServiciosComponent} from "./pages/servicios/servicios.component";
import {ReservasComponent} from "./pages/reservas/reservas.component";
import {ContactoComponent} from "./pages/contacto/contacto.component";
import {DetalleReservaComponent} from "./pages/detalle-reserva/detalle-reserva.component";
import {ResumenReservaComponent} from "./pages/resumen-reserva/resumen-reserva.component";
import {PrecheckingComponent} from "./pages/prechecking/prechecking.component";
import {VerReservaComponent} from "./pages/ver-reserva/ver-reserva.component";
import {AuthGuard} from "./guards/auth.guard";
import {AdminDashboardComponent} from "./admin/admin-dashboard/admin-dashboard.component";
import {ConfirmacionReservaComponent} from "./pages/confirmacion-reserva/confirmacion-reserva/confirmacion-reserva.component";

export const routes: Routes = [
  // Rutas públicas
  {path: "", component: HomeComponent},
  {path: "habitaciones", component: HabitacionesComponent},
  {path: "habitaciones/:slug", component: DetalleReservaComponent},
  {path: "servicios", component: ServiciosComponent},
  {path: "reservas", component: ReservasComponent},
  {path: "reservas/resumen", component: ResumenReservaComponent},
  {path: "contacto", component: ContactoComponent},
  {path: "prechecking/:token", component: PrecheckingComponent},
  {path: "reservas/confirmacion", component: ConfirmacionReservaComponent},

  // ✅ Ruta pública para clientes (por hash)
  {path: "reservas/ver/:hash", component: VerReservaComponent},

  // ✅ Ruta para admin - ver reserva por ID
  {path: "ver-reserva/admin/:id", component: VerReservaComponent},

  // Rutas de administración
  {
    path: "admin/login",
    loadComponent: () =>
      import("./admin/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "admin",
    canActivate: [AuthGuard],
    component: AdminDashboardComponent,
  },
  {
    path: "admin/dashboard",
    canActivate: [AuthGuard],
    component: AdminDashboardComponent,
  },

  {path: "**", redirectTo: ""},
];
