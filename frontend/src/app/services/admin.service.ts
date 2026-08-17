import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {
  EstadisticasAdmin,
  ReservaReciente,
} from "../models/administrador.models";

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private apiUrl = environment.apiUrl + "/admin";

  constructor(private http: HttpClient) {}

  // ✅ Obtener estadísticas del dashboard
  getEstadisticas(): Observable<{success: boolean; data: EstadisticasAdmin}> {
    return this.http.get<{success: boolean; data: EstadisticasAdmin}>(
      `${this.apiUrl}/estadisticas`,
    );
  }

  // ✅ Obtener reservas recientes
  getReservasRecientes(
    limit: number = 10,
  ): Observable<{success: boolean; data: ReservaReciente[]}> {
    return this.http.get<{success: boolean; data: ReservaReciente[]}>(
      `${this.apiUrl}/reservas/recientes?limit=${limit}`,
    );
  }

  // ✅ Obtener ocupación por día
  getOcupacion(dias: number = 7): Observable<{success: boolean; data: any[]}> {
    return this.http.get<{success: boolean; data: any[]}>(
      `${this.apiUrl}/ocupacion?dias=${dias}`,
    );
  }
}
