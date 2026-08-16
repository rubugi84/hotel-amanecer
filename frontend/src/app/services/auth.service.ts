// frontend/src/app/services/auth.service.ts

import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable, throwError} from "rxjs";
import {tap, catchError} from "rxjs/operators";
import {environment} from "../../environments/environment";
import {Router} from "@angular/router";
import {Administrador} from "../models/administrador.models";
import {
  LoginResponse,
  VerifyTokenResponse,
  LogoutResponse,
  LoginRequest,
} from "../models/auth.models";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = "admin_token";
  private adminKey = "admin_data";
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  private adminSubject = new BehaviorSubject<Administrador | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  admin$ = this.adminSubject.asObservable();
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // ✅ Esperar a que la app esté lista antes de verificar sesión
    setTimeout(() => {
      this.verificarSesion();
    }, 100);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  login(usuario: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = {usuario, password};

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, body)
      .pipe(
        tap((response: LoginResponse) => {
          if (response.success && response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem(this.adminKey, JSON.stringify(response.admin));

            this.adminSubject.next(response.admin);
            this.isLoggedInSubject.next(true);
          }
        }),
        catchError((error) => {
          console.error("❌ Error en login:", error);
          return throwError(() => error);
        }),
      );
  }

  // ✅ Método simplificado para verificar token
  verificarToken(): Observable<VerifyTokenResponse> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error("No token"));
    }

    return this.http
      .get<VerifyTokenResponse>(`${this.apiUrl}/auth/verify`, {
        headers: {Authorization: `Bearer ${token}`},
      })
      .pipe(
        tap({
          next: (response: VerifyTokenResponse) => {
            if (response.success) {
              this.adminSubject.next(response.admin);
              this.isLoggedInSubject.next(true);
            }
          },
          error: (error) => {
            if (error.status === 401) {
              this.cerrarSesion();
            }
          },
        }),
        catchError((error) => {
          if (error.status === 401) {
            this.cerrarSesion();
          }
          return throwError(() => error);
        }),
      );
  }

  guardarSesion(token: string, admin: Administrador): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.adminKey, JSON.stringify(admin));
    this.adminSubject.next(admin);
    this.isLoggedInSubject.next(true);
    this.iniciarTemporizador();
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  obtenerAdmin(): Administrador | null {
    const data = localStorage.getItem(this.adminKey);
    if (!data) return null;
    try {
      return JSON.parse(data) as Administrador;
    } catch {
      return null;
    }
  }

  verificarSesion(): void {
    const token = this.obtenerToken();
    const admin = this.obtenerAdmin();

    if (token && admin) {
      this.adminSubject.next(admin);
      this.isLoggedInSubject.next(true);
      this.iniciarTemporizador();

      // ✅ Verificar token en segundo plano sin bloquear
      this.verificarToken().subscribe({
        error: (error) => {
          if (error.status === 401) {
            this.cerrarSesion();
          }
        },
      });
    } else {
      this.cerrarSesion();
    }
  }

  iniciarTemporizador(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    const tiempoSesion = 24 * 60 * 60 * 1000;

    this.sessionTimer = setTimeout(() => {
      this.cerrarSesion();
    }, tiempoSesion);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
    this.adminSubject.next(null);
    this.isLoggedInSubject.next(false);

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    if (
      window.location.pathname.includes("/admin") &&
      !window.location.pathname.includes("/admin/login")
    ) {
      this.router.navigate(["/admin/login"]);
    }
  }

  logout(): Observable<LogoutResponse> {
    return this.http
      .post<LogoutResponse>(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          this.cerrarSesion();
          this.router.navigate(["/"]);
        }),
        catchError((error) => {
          this.cerrarSesion();
          this.router.navigate(["/"]);
          return throwError(() => error);
        }),
      );
  }

  isAuthenticated(): boolean {
    return !!this.obtenerToken() && !!this.obtenerAdmin();
  }
}
