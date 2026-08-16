import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: "app-contacto",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./contacto.component.html",
  styleUrls: ["./contacto.component.scss"],
})
export class ContactoComponent {
  contact = {
    name: "",
    email: "",
    subject: "",
    message: "",
  };

  onSubmit() {}
}
