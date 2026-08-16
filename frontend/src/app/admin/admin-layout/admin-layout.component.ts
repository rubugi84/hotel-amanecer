// frontend/src/app/admin/admin-layout/admin-layout.component.ts
import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {Administrador} from "../../models/administrador.models";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-layout.component.html",
  styleUrls: ["./admin-layout.component.scss"],
})
export class AdminLayoutComponent implements OnInit {
  admin: Administrador | null = null;
  menuOpen: boolean = false;
  dropdownOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.admin$.subscribe((admin) => {
      this.admin = admin;
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
