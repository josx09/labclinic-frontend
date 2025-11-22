import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../core/env';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  id?: number;
  name?: string;
  type?: string | number;
  rol?: string;
  idPersona?: number;
  idSucursal?: number;
  sucursal?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl.replace(/\/+$/, '');

  private _logged = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  logged$ = this._logged.asObservable();

  private readRole(): number | null {
    const v = localStorage.getItem('type');
    return v == null ? null : Number(v);
  }

  private _role = new BehaviorSubject<number | null>(this.readRole());
  role$ = this._role.asObservable();
  isAdmin$ = this.role$.pipe(map(v => v === 1));

  constructor(private http: HttpClient, private router: Router) {}

  // LOGIN
  
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { username, password }).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem('token', res.token);

          if (res.type != null) {
            localStorage.setItem('type', String(res.type));
            this._role.next(Number(res.type));
          }

          if (res.name) localStorage.setItem('name', res.name);
          if (res.rol) localStorage.setItem('rol', res.rol);
          if (res.idPersona) localStorage.setItem('idPersona', String(res.idPersona));

          // ✅ NUEVO: Guardar información de sucursal
          if (res.idSucursal) localStorage.setItem('idSucursal', String(res.idSucursal));
          if (res.sucursal) localStorage.setItem('sucursal', res.sucursal);

          this._logged.next(true);
          this.router.navigate(['/home']);
        }
      })
    );
  }

 
  // LOGOUT
  
  logout() {
    ['token', 'type', 'name', 'rol', 'idPersona', 'idSucursal', 'sucursal'].forEach(k => localStorage.removeItem(k));
    this._role.next(null);
    this._logged.next(false);
    this.router.navigate(['/login']);
  }

 
  // HELPERS
  
  get isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  get currentRole(): number | null {
    return this.readRole();
  }

  get currentSucursalId(): number {
    return Number(localStorage.getItem('idSucursal') ?? 0);
  }

  get currentSucursalNombre(): string {
    return localStorage.getItem('sucursal') ?? '';
  }

  isAdmin(): boolean {
    return this.readRole() === 1;
  }

  get currentPersonaId(): number | null {
    const v = localStorage.getItem('idPersona');
    return v ? Number(v) : null;
  }

  hasRole(roles: string[]): boolean {
    const currentRole = localStorage.getItem('rol') || '';
    return roles.includes(currentRole);
  }

  canAccess(roles: string[]): boolean {
    const currentRole = (localStorage.getItem('rol') || '').toLowerCase().trim();
    return roles.some(r => r.toLowerCase().trim() === currentRole);
  }

  get currentRoleName(): string {
    return localStorage.getItem('rol') || '';
  }
}
