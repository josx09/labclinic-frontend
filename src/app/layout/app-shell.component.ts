import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { FooterComponent } from './footer.component';
import { env } from '../core/env';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FooterComponent],
  template: `
  <div class="layout"
       [class.collapsed]="collapsed"
       [class.mobile-open]="mobileOpen">

    <!-- Botón hamburguesa móvil -->
    <button class="mobile-toggle btn btn-primary d-lg-none"
            (click)="toggleMobile()">
      <i class="bi bi-list"></i>
    </button>

    <!-- Overlay móvil -->
    <div class="overlay"
         *ngIf="mobileOpen"
         (click)="closeMobile()">
    </div>

    <!-- SIDEBAR -->
    <aside class="sidebar bg-dark text-white">
      <div class="brand d-flex align-items-center">

        <!-- Botón menú dentro del sidebar (móvil) -->
        <button class="btn btn-sm btn-light me-2 d-inline-flex d-lg-none"
                (click)="toggleMobile()">
          <i class="bi bi-x-lg"></i>
        </button>

        <button class="btn btn-sm btn-light me-2 d-none d-lg-inline-flex"
                (click)="toggle()">
          <i class="bi" [class.bi-list]="!collapsed" [class.bi-x-lg]="collapsed"></i>
        </button>

        <span class="brand-text">Lab Clínico</span>
      </div>

      <nav class="menu">

        <a class="menu-item" routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <i class="bi bi-house"></i><span>Inicio</span>
        </a>

        <a class="menu-item" routerLink="/persona" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-people"></i><span>Personas</span>
        </a>

        <a class="menu-item" routerLink="/clinica" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-hospital"></i><span>Clínicas</span>
        </a>

        <a class="menu-item" routerLink="/insumolaboratorio" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-box-seam"></i><span>Insumos</span>
        </a>

        <a class="menu-item" routerLink="/cita" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario','Cliente'])">
          <i class="bi bi-calendar-check"></i><span>Citas</span>
        </a>

        <a class="menu-item" routerLink="/pago" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-cash-stack"></i><span>Pagos</span>
        </a>

        <a class="menu-item" routerLink="/cotizacion" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario','Cliente'])">
          <i class="bi bi-receipt"></i><span>Cotizaciones</span>
        </a>

        <a class="menu-item" routerLink="/empleado" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador'])">
          <i class="bi bi-person-badge"></i><span>Empleados</span>
        </a>

        <a class="menu-item" routerLink="/reportes" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-graph-up"></i><span>Reportes</span>
        </a>

        <a class="menu-item" routerLink="/examen" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario','Médico'])">
          <i class="bi bi-eyedropper"></i><span>Exámenes</span>
        </a>

        <a class="menu-item" routerLink="/tipoexamen" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-bezier"></i><span>Tipos de Examen</span>
        </a>

        <a class="menu-item" routerLink="/perfil-examen" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-grid"></i><span>Perfiles de Examen</span>
        </a>

        <a class="menu-item" routerLink="/categoria-tipoexamen" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-folder2-open"></i><span>Categorías de Examen</span>
        </a>

        <a class="menu-item" routerLink="/bono" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-cash-coin"></i><span>Bonos</span>
        </a>

        <a class="menu-item" routerLink="/asistente-ia" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-robot"></i><span>Asistente IA</span>
        </a>

        <a class="menu-item" routerLink="/proveedor" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-truck"></i><span>Proveedores</span>
        </a>

        <a class="menu-item" routerLink="/categoriainsumo" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador','Usuario'])">
          <i class="bi bi-tags"></i><span>Categorías de Insumo</span>
        </a>

        <a class="menu-item" routerLink="/users" routerLinkActive="active"
           *ngIf="auth.canAccess(['Administrador'])">
          <i class="bi bi-person-gear"></i><span>Usuarios</span>
        </a>

        <a class="menu-item"
           [routerLink]="['/historial', auth.currentPersonaId]"
           routerLinkActive="active"
           *ngIf="auth.canAccess(['Cliente'])">
          <i class="bi bi-journal-medical"></i><span>Mi Historial</span>
        </a>

      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-outline-light btn-sm w-100" (click)="logout()">
          <i class="bi bi-box-arrow-right me-1"></i> <span>Salir</span>
        </button>
      </div>
    </aside>

    <!-- CONTENIDO -->
    <main class="content">

      <div class="topbar d-flex justify-content-between align-items-center mb-3">
        <div>
          <label class="me-2 fw-semibold">Sucursal:</label>
          <select class="form-select form-select-sm d-inline-block" style="width:180px"
                  [value]="sucursalActual" (change)="onSucursalChange($event)">
            <option *ngFor="let s of sucursales" [value]="s.id">{{ s.nombre }}</option>
          </select>
        </div>

        <div class="text-end small text-muted">
          {{ nombreUsuario }}
        </div>
      </div>

      <div class="page">
        <router-outlet></router-outlet>
      </div>

      <app-footer></app-footer>
    </main>
  </div>
  `,
  styles: [`
    :host { display:block; height:100%; }
    .layout { display:flex; min-height:100dvh; background:#f7f9fc; }

    /* Sidebar original */
    .sidebar{
      position: sticky; top:0; height:100dvh;
      width:240px; padding:12px;
      display:flex; flex-direction:column;
      transition: width .18s ease, transform .18s ease;
      box-shadow: 0 6px 24px rgba(0,0,0,.12);
      z-index: 2002;
    }

    .brand { padding:8px 10px; border-radius:12px; background:rgba(255,255,255,.06); }
    .brand-text { font-weight:600; white-space:nowrap; transition:opacity .18s; }

    .menu{ display:flex; flex-direction:column; gap:6px; margin-top:10px; }

    .menu-item{
      display:flex; align-items:center; gap:12px;
      padding:10px 12px; border-radius:12px; color:#fff;
      text-decoration:none;
      transition: background .12s, transform .12s;
    }
    .menu-item:hover{ background: rgba(255,255,255,.12); transform: translateX(1px); }
    .menu-item.active{ background: rgba(13,110,253,.35); }

    .menu-item i{ font-size:1.05rem; width:22px; text-align:center; }

    .sidebar-footer{ margin-top:auto; }

    .content{ flex:1; display:flex; flex-direction:column; min-height:100dvh; }
    .page{ flex:1; padding:20px 24px; }

    .topbar{
      background:white;
      border-bottom:1px solid #dee2e6;
      padding:8px 16px;
      border-radius:8px;
      box-shadow:0 1px 4px rgba(0,0,0,.05);
    }

    /* Collapse desktop */
    .layout.collapsed .sidebar{ width:72px; }
    .layout.collapsed .brand-text,
    .layout.collapsed .menu-item span,
    .layout.collapsed .sidebar-footer span{
      opacity:0; width:0; overflow:hidden;
    }

    /* -------------------------
         RESPONSIVE
    --------------------------*/

    /* Botón hamburguesa móvil */
    .mobile-toggle {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 2001;
      border-radius: 8px;
      padding: 6px 10px;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(2px);
      z-index: 2000;
    }

    /* Sidebar modo móvil */
    @media (max-width: 992px) {

      .sidebar {
        position: fixed !important;
        transform: translateX(-100%);
        width: 250px !important;
        top: 0;
        left: 0;
        height: 100%;
        background: #212529;
      }

      .layout.mobile-open .sidebar {
        transform: translateX(0);
        transition: transform .25s ease;
      }

      .layout.mobile-open .content {
        pointer-events: none;
        user-select: none;
      }

      .layout.collapsed .sidebar {
        width: 250px !important;
      }
    }

    @media (min-width: 993px) {
      .mobile-toggle { display:none; }
    }

  `]
})
export class AppShellComponent implements OnInit {

  collapsed = false;
  mobileOpen = false;

  sucursalActual = Number(localStorage.getItem('id_sucursal') || 1);
  nombreUsuario = localStorage.getItem('name') || 'Usuario';

  sucursales = [
    { id: 1, nombre: 'Sucursal Central' },
    { id: 2, nombre: 'Sucursal Norte' },
    { id: 3, nombre: 'Sucursal Sur' },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    env.sucursalId.subscribe(id => this.sucursalActual = id);
  }

  /* Toggle para desktop */
  toggle() {
    if (window.innerWidth < 992) {
      this.toggleMobile();
    } else {
      this.collapsed = !this.collapsed;
    }
  }

  /* Toggle menú móvil */
  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  onSucursalChange(event: any) {
    const id = Number(event.target.value);
    if (!isNaN(id) && id > 0) {
      env.setSucursal(id);

      this.router.navigate([], {
        queryParams: { sucursal: id, reload: Date.now() },
        queryParamsHandling: 'merge'
      });
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
