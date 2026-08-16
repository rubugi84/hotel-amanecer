import {ApplicationConfig, importProvidersFrom} from "@angular/core";
import {provideRouter} from "@angular/router";
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {routes} from "./app.routes";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {NgxDaterangepickerMd} from "ngx-daterangepicker-material";
import {authInterceptor} from "./interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(NgxDaterangepickerMd.forRoot()),
  ],
};
