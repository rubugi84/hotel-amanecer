// frontend/src/app/models/auth.models.ts

import {Administrador} from "./administrador.models";

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  admin: Administrador;
}

export interface VerifyTokenResponse {
  success: boolean;
  admin: Administrador;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  usuario: string;
  password: string;
}
