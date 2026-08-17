import {Injectable} from "@angular/core";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class UrlService {
  private baseUrl: string;

  constructor() {
    // ✅ Usar la URL del backend desde environment
    this.baseUrl = environment.apiUrl.replace("/api", "");
  }

  /**
   * Obtiene la URL completa de una imagen
   * @param ruta - Ruta relativa de la imagen
   * @returns URL completa
   */
  getImagenUrl(ruta: string | null | undefined): string {
    if (!ruta) {
      return "";
    }
    if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
      return ruta;
    }
    return `${this.baseUrl}${ruta}`;
  }

  /**
   * Obtiene la URL completa para un endpoint de la API
   * @param endpoint - Endpoint de la API
   * @returns URL completa
   */
  getApiUrl(endpoint: string): string {
    return `${environment.apiUrl}${endpoint}`;
  }

  /**
   * Obtiene la URL para ver un documento (DNI, etc.)
   * @param ruta - Ruta del documento
   * @returns URL completa
   */
  getDocumentUrl(ruta: string | null | undefined): string {
    if (!ruta) {
      return "";
    }
    if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
      return ruta;
    }
    return `${this.baseUrl}${ruta}`;
  }
}
