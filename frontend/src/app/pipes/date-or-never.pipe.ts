// frontend/src/app/pipes/date-or-never.pipe.ts

import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
  name: "dateOrNever",
  standalone: true,
})
export class DateOrNeverPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) {
      return "Nunca";
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return "Nunca";
      }
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Nunca";
    }
  }
}
