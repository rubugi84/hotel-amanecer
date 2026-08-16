import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

@NgModule({
  imports: [
    CommonModule,
    NgxDaterangepickerMd.forRoot()  // <--- FORROOT ES OBLIGATORIO PARA EL SERVICIO
  ],
  exports: [
    NgxDaterangepickerMd
  ]
})
export class DatepickerModule { }