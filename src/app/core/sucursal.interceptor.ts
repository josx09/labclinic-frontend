import { HttpInterceptorFn } from '@angular/common/http';
import { env, environment } from './env';

export const sucursalInterceptor: HttpInterceptorFn = (req, next) => {
  // solo peticiones a tu API
  if (req.url.startsWith(environment.apiUrl)) {
    const id = env.sucursalId.getValue();
    if (id && id > 0) {
      req = req.clone({
        setHeaders: {
          'X-Sucursal-Id': String(id)   // debe coincidir con el backend
        }
      });
    }
  }
  return next(req);
};
