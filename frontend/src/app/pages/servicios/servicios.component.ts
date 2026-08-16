import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {DatepickerModule} from "../../datepicker.module";
import {ContenidoService} from "../../services/contenido.service";

import {ServicioHotel, ContenidoSeccion} from "../../models/contenido.models";

@Component({
  selector: "app-servicios",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatepickerModule],
  templateUrl: "./servicios.component.html",
  styleUrls: ["./servicios.component.scss"],
})
export class ServiciosComponent implements OnInit {
  servicios: ServicioHotel[] = [];

  // 🔥 CORREGIDO: Usar ContenidoSeccion en lugar de Contenido
  serviciosData: ContenidoSeccion = {};

  constructor(private contenidoService: ContenidoService) {}

  ngOnInit() {
    this.contenidoService.getServicios().subscribe({
      next: (data: ServicioHotel[]) => {
        this.servicios = data;
      },
      error: (err) => {
        console.error("❌ Error al recibir servicios:", err);
      },
    });

    // 🔥 CORREGIDO: Usar ContenidoSeccion
    this.contenidoService
      .getContenidoBySeccion("servicios")
      .subscribe((data: ContenidoSeccion) => {
        this.serviciosData = data;
      });
  }
}
