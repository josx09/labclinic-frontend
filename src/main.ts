// Importa Bootstrap JS para componentes dinámicos (acordeones, modales, etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'zone.js';

// Importaciones Angular
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/auth/auth.interceptor';

//  Importación para soporte de idioma español
import { LOCALE_ID } from '@angular/core';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { sucursalInterceptor } from './app/core/sucursal.interceptor';

//  Registrar idioma español (es-GT)
registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
    authInterceptor,
    sucursalInterceptor, 
  ])),

    //  Define el idioma por defecto para todo Angular
    { provide: LOCALE_ID, useValue: 'es-GT' },
  ],
}).catch(console.error);
