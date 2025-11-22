import { Routes } from '@angular/router';
import { guestGuard } from './core/guest.guard';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  //  redirección base
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // login (solo invitados)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent)
  },

  // registro (solo invitados)
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent)
  },

  {
  path: 'historial',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./forms/historial/historial.component').then(m => m.HistorialComponent),
  data: { roles: ['Cliente'] } //  Solo clientes pueden acceder sin ID
},
{
  path: 'historial/:id',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./forms/historial/historial.component').then(m => m.HistorialComponent)
},



  //  layout principal (protegido)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { 
        path: 'home', 
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
        data: { roles: ['Administrador', 'Usuario', 'Médico', 'Cliente'] } 
      },

      //  accesible solo para usuarios internos
      {
        path: 'persona',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./forms/persona/form.component').then(m => m.PersonaFormComponent)
      },
      {
        path: 'insumolaboratorio',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./insumos/insumos.component').then(m => m.InsumosComponent)
      },
      {
        path: 'cita',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario','Cliente'] },
        loadComponent: () => import('./forms/cita/form.component').then(m => m.CitaFormComponent)
      },
      {
        path: 'pago',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./forms/pago/form.component').then(m => m.PagoFormComponent)
      },
      {
        path: 'empleado',
        canActivate: [authGuard],
        data: { roles: ['Administrador'] },
        loadComponent: () => import('./forms/empleado/form.component').then(m => m.EmpleadoFormComponent)
      },
      {
        path: 'reportes',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./forms/reportes/reporte-general.component').then(m => m.ReporteGeneralComponent)
      },
      {
        path: 'proveedor',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./forms/proveedor/form.component').then(m => m.ProveedorFormComponent)
      },
      {
        path: 'categoriainsumo',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./forms/categoriainsumo/form.component').then(m => m.CategoriainsumoFormComponent)
      },

      //  solo médicos
      {
        path: 'examen',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario', 'Médico'] },
        loadComponent: () => import('./forms/Examen/examen.component').then(m => m.ExamenComponent)
      },

      {
        path: 'tipoexamen',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () =>
          import('./forms/tipoexamen/form.component').then(m => m.TipoexamenFormComponent)
      },

      {
        path: 'perfil-examen',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () =>
          import('./forms/perfil-examen/perfil-examen-form.component')
            .then(m => m.PerfilExamenFormComponent)
      },

      {
        path: 'categoria-tipoexamen',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () =>
          import('./forms/categoria-tipoexamen/categoria-tipoexamen.component')
            .then(m => m.CategoriaTipoExamenComponent)
      },

      {
        path: 'bono',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () =>
          import('./forms/bono/form.component').then(m => m.BonoFormComponent)
      },
      {
        path: 'clinica',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario'] },
        loadComponent: () => import('./forms/clinica/form.component').then(m => m.ClinicaComponent)
      },

      {
        path: 'asistente-ia',
        loadComponent: () =>
          import('./forms/asistente-ia/asistente-ia.component').then(m => m.AsistenteIAComponent),
      },


      {
        path: 'cotizacion',
        canActivate: [authGuard],
        data: { roles: ['Administrador', 'Usuario','Cliente'] },
        loadComponent: () => import('./forms/cotizacion/form.component').then(m => m.CotizacionesComponent)
      },

      //  solo administradores
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./forms/users/form.component').then(m => m.UsersFormComponent)
      },
      

      // default interno
      { path: '', pathMatch: 'full', redirectTo: 'home' }
    ]
  },

  //  ruta no encontrada
  { path: '**', redirectTo: 'login' }
];
