import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';

@Component({
  standalone: true,
  selector: 'form-proveedor',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html'
})
export class ProveedorFormComponent {
  items: any[] = [];
  model: any = {
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    direccion: '',
    descripcion: '',
    estado: 1
  };
  editingId: number | null = null;
  loading = false;
  error = '';

  // variables para el modal de eliminación
  deleteId: number | null = null;
  showDeleteModal = false;

  constructor(private api: CrudService) {
    this.load();
  }

  // === Cargar lista ===
  load() {
    this.loading = true;
    this.api.list<any>('proveedor').subscribe({
      next: (res: any) => {
        // Normaliza respuesta: puede venir como { items, total } o arreglo
        const raw = Array.isArray(res) ? res : res?.items ?? [];

        // Asegura que todos tengan 'id'
        this.items = raw.map((r: any) => ({
          id: r.id ?? r.id_proveedor ?? r.Id ?? r.IdProveedor,
          nombre: r.nombre,
          empresa: r.empresa,
          email: r.email,
          telefono: r.telefono,
          direccion: r.direccion,
          descripcion: r.descripcion,
          estado: r.estado
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando proveedores:', err);
        this.error = '❌ Error cargando datos.';
        this.loading = false;
        this.items = [];
      }
    });
  }

  // === Editar un registro ===
  edit(row: any) {
    this.model = {
      nombre: row.nombre ?? '',
      empresa: row.empresa ?? '',
      email: row.email ?? '',
      telefono: row.telefono ?? '',
      direccion: row.direccion ?? '',
      descripcion: row.descripcion ?? '',
      estado: row.estado ?? 1
    };
    this.editingId = row.id ?? row.id_proveedor ?? null;
  }

  // === Resetear formulario ===
  reset() {
    this.model = {
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      direccion: '',
      descripcion: '',
      estado: 1
    };
    this.editingId = null;
    this.error = '';
  }

  // === Guardar (crear/editar) ===
  save() {
    const id = this.editingId;
    const body = this.model;
    this.loading = true;

    const obs = id
      ? this.api.update<any>('proveedor', id, body)
      : this.api.create<any>('proveedor', body);

    obs.subscribe({
      next: () => {
        this.reset();
        this.load();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error guardando proveedor:', err);
        this.error = '❌ No se pudo guardar.';
        this.loading = false;
      }
    });
  }

  // === Modal de confirmación para eliminar ===
  confirmRemove(id: number) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  cancelRemove() {
    this.deleteId = null;
    this.showDeleteModal = false;
  }

  // === Eliminar proveedor ===
  remove() {
    if (!this.deleteId) return;
    this.loading = true;

    this.api.remove<any>('proveedor', this.deleteId).subscribe({
      next: () => {
        this.load();
        this.cancelRemove();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error eliminando proveedor:', err);
        this.error = '❌ No se pudo eliminar.';
        this.loading = false;
      }
    });
  }
}
