import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: "app-reservas",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reservas.component.html",
  styleUrls: ["./reservas.component.scss"],
})
export class ReservasComponent {
  reservation = {
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    roomType: "estandar",
    message: "",
  };

  onSubmit() {}
}
