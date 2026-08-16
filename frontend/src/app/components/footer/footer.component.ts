import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ContenidoService} from "../../services/contenido.service";
import {LegalModalComponent} from "../legal-modal/legal-modal.component";
import {ContenidoSeccion, RedSocial} from "../../models/contenido.models";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, LegalModalComponent],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();

  // 🔥 CORREGIDO: Usar ContenidoSeccion en lugar de Contenido
  footerData: ContenidoSeccion = {};
  redesSociales: RedSocial[] = [];

  modalOpen = false;
  modalKey = "";

  constructor(private contenidoService: ContenidoService) {}

  ngOnInit(): void {
    // Cargar todos los datos del footer desde la BD
    this.contenidoService
      .getContenidoBySeccion("footer")
      .subscribe((data: ContenidoSeccion) => {
        this.footerData = data;
      });

    // Cargar redes sociales
    this.contenidoService.getRedesSociales().subscribe((data: RedSocial[]) => {
      this.redesSociales = data;
    });
  }

  openModal(key: string) {
    this.modalKey = key;
    this.modalOpen = true;
  }
}
