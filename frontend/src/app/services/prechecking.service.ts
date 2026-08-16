// frontend/src/app/services/prechecking.service.ts
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {
  PrecheckingData,
  TokenVerificationResponse,
  PrecheckingResponse,
  DniUploadResponse,
  DniOcrResponse,
} from "../models/contenido.models";

@Injectable({
  providedIn: "root",
})
export class PrecheckingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Verificar token de prechecking
  verificarToken(token: string): Observable<TokenVerificationResponse> {
    return this.http.get<TokenVerificationResponse>(
      `${this.apiUrl}/prechecking/verificar/${token}`,
    );
  }

  // Realizar prechecking
  realizarPrechecking(data: {
    token: string;
    datos: PrecheckingData;
  }): Observable<PrecheckingResponse> {
    return this.http.post<PrecheckingResponse>(
      `${this.apiUrl}/prechecking/realizar`,
      data,
    );
  }

  // Subir imagen del DNI
  subirDni(
    token: string,
    archivo: File,
    tipo: "frontal" | "trasero",
  ): Observable<DniUploadResponse> {
    const formData = new FormData();
    formData.append("token", token);
    formData.append("tipo", tipo);
    formData.append("dni", archivo);

    return this.http.post<DniUploadResponse>(
      `${this.apiUrl}/prechecking/subir-dni`,
      formData,
    );
  }

  // Leer datos del DNI con OCR
  leerDni(
    archivo: File,
    tipo: "frontal" | "trasero" = "frontal",
  ): Observable<DniOcrResponse> {
    const formData = new FormData();
    formData.append("dni", archivo);
    formData.append("tipo", tipo);

    return this.http.post<DniOcrResponse>(
      `${this.apiUrl}/prechecking/leer-dni`,
      formData,
    );
  }
}
