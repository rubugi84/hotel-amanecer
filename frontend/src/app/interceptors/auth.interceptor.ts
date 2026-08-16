// frontend/src/app/interceptors/auth.interceptor.ts

import {HttpInterceptorFn} from "@angular/common/http";
import {inject} from "@angular/core";
import {AuthService} from "../services/auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ Usar inject() para obtener AuthService
  const authService = inject(AuthService);
  const token = authService.getToken();

  // ✅ No añadir token a la ruta de login
  if (
    token &&
    !req.url.includes("/auth/login") &&
    !req.url.includes("/auth/verify")
  ) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(authReq);
  }

  return next(req);
};
