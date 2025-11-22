import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(public auth: AuthService, private router: Router) {}

  user = localStorage.getItem('name') ?? 'Bienvenido';

  //  Lista base de módulos
  tiles = [
    { cmd: ['persona'], title: 'Personas', desc: 'ABM de pacientes y personas', icon: 'bi-people', roles: ['Administrador', 'Usuario'] },
    { cmd: ['clinica'], title: 'Clínicas', desc: 'Gestión de clínicas asociadas y precios especiales', icon: 'bi-hospital', roles: ['Administrador', 'Usuario'] },
    { cmd: ['insumolaboratorio'], title: 'Insumos', desc: 'Stock y movimientos', icon: 'bi-box-seam', roles: ['Administrador', 'Usuario'] },
    { cmd: ['cita'], title: 'Citas', desc: 'Agenda y disponibilidad', icon: 'bi-calendar-check', roles: ['Administrador', 'Usuario','Cliente'] },
    { cmd: ['pago'], title: 'Pagos', desc: 'Cobros y facturación', icon: 'bi-cash-stack', roles: ['Administrador', 'Usuario'] },
    { cmd: ['empleado'], title: 'Empleados', desc: 'Legajos y planilla', icon: 'bi-person-badge', roles: ['Administrador'] },
    { cmd: ['reportes'], title: 'Reportes', desc: 'Indicadores y reportes', icon: 'bi-graph-up', roles: ['Administrador', 'Usuario'] },
    { cmd: ['examen'], title: 'Exámenes', desc: 'Gestión y resultados de laboratorio', icon: 'bi-eyedropper', roles: ['Administrador', 'Usuario', 'Médico'] },
    { cmd: ['bono'], title: 'Bonos', desc: 'Bonificaciones y recompensas', icon: 'bi-cash-coin', roles: ['Administrador', 'Usuario'] },
    { cmd: ['tipoexamen'], title: 'Tipos de Examen', desc: 'Configuración de tipos y parámetros', icon: 'bi-bezier', roles: ['Administrador', 'Usuario'] },
    { cmd: ['perfil-examen'], title: 'Perfiles de Exámenes', desc: 'Crear y Modificar Perfiles', icon: 'bi-grid', roles: ['Administrador', 'Usuario'] },
    { cmd: ['categoria-tipoexamen'], title: 'Categorías de Exámenes', desc: 'Configuración de Categorías de Exámenes', icon: 'bi-folder2-open', roles: ['Administrador', 'Usuario',] },
    { cmd: ['cotizacion'], title: 'Cotizaciones', desc: 'Gestión de cotizaciones y presupuestos de exámenes', icon: 'bi-receipt', roles: ['Administrador', 'Usuario','Cliente'] },
    { cmd: ['users'], title: 'Usuarios', desc: 'Gestión de usuarios y roles del sistema', icon: 'bi-person-gear', roles: ['Administrador'] },
    { cmd: ['historial'], title: 'Mi Historial', desc: 'Consulta tus exámenes clínicos', icon: 'bi-journal-medical', roles: ['Cliente'] }

  ];

  // Método para validar acceso
  canView(tile: any): boolean {
  const currentRole = (localStorage.getItem('rol') || '').toLowerCase().trim();
  if (!tile.roles) return true;
  return tile.roles.some((r: string) => r.toLowerCase().trim() === currentRole);
}



  go(cmd: string[] | string) {
  if (Array.isArray(cmd)) {
    this.router.navigate(['/', ...cmd]); //  asegura navegación absoluta
  } else {
    this.router.navigate(['/', cmd]); //  también absoluta
  }
}

}
