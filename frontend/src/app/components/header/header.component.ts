// frontend/src/app/components/header/header.component.ts
import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule, Router} from "@angular/router"; // ✅ Importar Router
import {AuthService} from "../../services/auth.service";
import {Observable} from "rxjs";
import {Administrador} from "../../models/administrador.models";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  menuOpen: boolean = false;
  isLoggedIn$: Observable<boolean>;
  admin$: Observable<Administrador | null>;

  constructor(
    public authService: AuthService,
    private router: Router, // ✅ Inyectar Router
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.admin$ = this.authService.admin$;
  }

  ngOnInit(): void {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    // ✅ Opción 1: Usar el servicio
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(["/"]);
      },
      error: (err) => {
        console.error("❌ Error al cerrar sesión:", err);
        // Forzar cierre local
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_data");
        window.location.href = "/";
      },
    });
  }
}
