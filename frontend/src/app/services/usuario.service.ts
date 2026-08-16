// frontend/src/app/services/usuario.service.ts
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  email: string;
  rol: string;
  ultimo_acceso?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class UsuarioService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getUsuarios(): Observable<{success: boolean; usuarios: Usuario[]}> {
    return this.http.get<{success: boolean; usuarios: Usuario[]}>(
      `${this.apiUrl}/auth/usuarios`,
    );
  }

  // Crear nuevo usuario
  crearUsuario(datos: {
    usuario: string;
    nombre: string;
    email: string;
    rol: string;
    password: string;
  }): Observable<{success: boolean; message: string; usuario: Usuario}> {
    return this.http.post<{
      success: boolean;
      message: string;
      usuario: Usuario;
    }>(`${this.apiUrl}/auth/usuarios`, datos);
  }

  // Actualizar usuario
  actualizarUsuario(
    id: number,
    datos: {
      nombre: string;
      email: string;
      rol: string;
      password?: string;
    },
  ): Observable<{success: boolean; message: string; usuario: Usuario}> {
    return this.http.put<{success: boolean; message: string; usuario: Usuario}>(
      `${this.apiUrl}/auth/usuarios/${id}`,
      datos,
    );
  }

  // Eliminar usuario
  eliminarUsuario(
    id: number,
  ): Observable<{success: boolean; message: string; usuario: Usuario}> {
    return this.http.delete<{
      success: boolean;
      message: string;
      usuario: Usuario;
    }>(`${this.apiUrl}/auth/usuarios/${id}`);
  }
}
