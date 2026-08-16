import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoService } from '../../services/contenido.service';

@Component({
  selector: 'app-legal-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal-modal.component.html',
  styleUrls: ['./legal-modal.component.scss']
})
export class LegalModalComponent implements OnChanges {
  @Input() key: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  titulo: string = '';
  contenido: string = '';

  constructor(private contenidoService: ContenidoService) {}

  ngOnChanges(): void {
    
    if (this.isOpen && this.key) {
      this.contenidoService.getPaginaLegal(this.key).subscribe(data => {
        this.titulo = data.titulo;
        this.contenido = data.contenido;
      });
    }
  }

  closeModal() {
    this.close.emit(); 
  }
}