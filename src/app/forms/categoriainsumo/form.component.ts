import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';

@Component({
  standalone: true,
  selector: 'form-categoriainsumo',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html'
})
export class CategoriainsumoFormComponent {
  items: any[] = [];
  model: any = { id: null, nombre: '', descripcion: '' };
  editingId: number | null = null;
  loading = false;
  error = '';

  // Modal de eliminación
  deleteId: number | null = null;
  showDeleteModal = false;

  constructor(private api: CrudService) {
    this.load();
  }

  // === Cargar lista ===
  load() {
    this.loading = true;
    this.api.list<any>('categoriainsumo').subscribe({
      next: (res: any) => {
        // Soporta tanto { items, total } como un arreglo simple
        const data = Array.isArray(res) ? res : (res?.items ?? []);

        // Normalizar datos según la respuesta del backend
        this.items = data.map((x: any) => ({
          id: x.id ?? x.idCategoriaInsumo ?? x.id_categoria_insumo ?? null,
          nombre: x.nombre ?? x.nombreCategoria ?? x.nombre_categoria ?? '',
          descripcion: x.descripcion ?? x.descripcionCategoria ?? x.descripcion_categoria ?? ''
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando categorías de insumo:', err);
        this.error = 'Error cargando datos';
        this.loading = false;
      }
    });
  }

  // === Editar ===
  edit(row: any) {
    this.model = { ...row };
    this.editingId = row.id ?? null;
  }

  // === Resetear ===
  reset() {
    this.model = { id: null, nombre: '', descripcion: '' };
    this.editingId = null;
    this.error = '';
  }

  // === Guardar ===
  save() {
    const id = this.editingId;
    const body = {
      nombre: this.model.nombre?.trim(),
      descripcion: this.model.descripcion?.trim() ?? ''
    };

    this.loading = true;
    const obs = id
      ? this.api.update<any>('categoriainsumo', id, body)
      : this.api.create<any>('categoriainsumo', body);

    obs.subscribe({
      next: () => {
        this.reset();
        this.load();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error guardando categoría de insumo:', err);
        this.error = 'No se pudo guardar';
        this.loading = false;
      }
    });
  }

  // === Confirmar eliminación ===
  confirmRemove(id: number) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  cancelRemove() {
    this.deleteId = null;
    this.showDeleteModal = false;
  }

  // === Eliminar ===
  remove() {
    if (!this.deleteId) return;
    this.loading = true;

    this.api.remove<any>('categoriainsumo', this.deleteId).subscribe({
      next: () => {
        this.load();
        this.cancelRemove();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error eliminando categoría de insumo:', err);
        this.error = 'No se pudo eliminar';
        this.loading = false;
      }
    });
  }
}
