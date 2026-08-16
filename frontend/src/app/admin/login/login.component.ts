// frontend/src/app/admin/login/login.component.ts
import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {RouterModule, Router, ActivatedRoute} from "@angular/router";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  usuario: string = "";
  password: string = "";
  loading: boolean = false;
  error: string = "";
  mostrarPassword: boolean = false;
  returnUrl: string = "/admin/dashboard";

  // ✅ AGREGAR ESTA LÍNEA
  currentYear: number = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/admin/dashboard"]);
    }

    this.returnUrl =
      this.route.snapshot.queryParams["returnUrl"] || "/admin/dashboard";
  }

  onSubmit(): void {
    if (!this.usuario || !this.password) {
      this.error = "Por favor, introduce usuario y contraseña";
      return;
    }

    this.loading = true;
    this.error = "";

    this.authService.login(this.usuario, this.password).subscribe({
      next: (_response) => {
        this.loading = false;

        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        console.error("❌ Error en login:", err);
        this.loading = false;
        this.error =
          err.error?.message ||
          "Error al iniciar sesión. Verifica tus credenciales.";
      },
    });
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
