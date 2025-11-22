import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const idSucursal = Number(localStorage.getItem('idSucursal') || 1);

  let headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['X-Sucursal-Id'] = idSucursal.toString();

  return next(req.clone({ setHeaders: headers }));
};
