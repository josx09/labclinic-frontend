import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';  

type Rol = {
  id: number;          // mapea a rol.id_rol
  nombre: string;      // mapea a rol.nombre_rol
  descripcion?: string;
};


type User = {
  id?: number;
  username: string;
  firstname: string;
  lastname: string;
  idRol: number;
  status: number;
  password?: string | null;
  rol?: string; 
};

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.component.html'   
})
export class UsersFormComponent {
  items: User[] = [];
  roles: Rol[] = [];

  model: User = {
    username: '',
    firstname: '',
    lastname: '',
    idRol: 2,       // por defecto "Usuario"
    status: 1,
    password: null
  };

  editingId: number | null = null;
  loading = false;
  error = '';

  constructor(private api: CrudService) {
    this.load();
    this.loadRoles();
  }

  // Usuarios
  load() {
    this.loading = true;
    this.api.list<User>('users').subscribe({
      next: (d) => { this.items = d; this.loading = false; },
      error: () => { this.error = 'Error cargando usuarios'; this.loading = false; }
    });
  }

  // Roles para el select (endpoint /api/roles)
  loadRoles() {
    this.api.list<Rol>('roles').subscribe({
      next: d => this.roles = d,
      error: () => this.error = 'Error cargando roles'
    });
  }

  edit(u: User) {
    this.model = {
      username: u.username,
      firstname: u.firstname,
      lastname: u.lastname,
      idRol: u.idRol,
      status: u.status,
      password: null
    };
    this.editingId = u.id ?? null;
  }

  reset() {
    this.model = {
      username: '',
      firstname: '',
      lastname: '',
      idRol: 2,
      status: 1,
      password: null
    };
    this.editingId = null;
    this.error = '';
  }

  save() {
    this.loading = true;

    // DTO que espera el UsersController (SaveUserDto)
    const dto = {
      id: this.editingId,
      username: this.model.username,
      firstname: this.model.firstname,
      lastname: this.model.lastname,
      idRol: this.model.idRol,
      status: this.model.status,
      password: this.model.password && this.model.password.trim() !== '' ? this.model.password : null
    };

    const obs = this.editingId
      ? this.api.update<User>('users', this.editingId, dto)
      : this.api.create<User>('users', dto);

    obs.subscribe({
      next: () => { this.reset(); this.load(); this.loading = false; },
      error: () => { this.error = 'No se pudo guardar'; this.loading = false; }
    });
  }

  remove(u: User) {
    if (!u.id) return;
    if (!confirm(`¿Eliminar usuario “${u.username}”?`)) return;
    this.api.remove('users', u.id).subscribe({
      next: () => this.load(),
      error: () => alert('No se pudo eliminar')
    });
  }
}
