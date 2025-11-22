// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth/auth.service';
import { env } from './core/env';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  template: `
    <!--  Barra superior: visible solo si el usuario está logueado -->
    

    <!--  Contenido dinámico -->
    <router-outlet></router-outlet>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background-color: #f8f9fa;
    }
  `]
})
export class AppComponent implements OnInit {
  logged$!: Observable<boolean>;
  sucursalId = env.sucursalId.getValue();
  nombreUsuario = localStorage.getItem('name') || '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Suscribirse al estado de sesión
    this.logged$ = this.auth.logged$;

    // Mantener actualizado el nombre visible
    this.auth.logged$.subscribe(isLogged => {
      this.nombreUsuario = isLogged ? (localStorage.getItem('name') || '') : '';
    });
  }

  cambiarSucursal() {
    env.setSucursal(this.sucursalId);
    console.log('Sucursal cambiada a:', this.sucursalId);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
