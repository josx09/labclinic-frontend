import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';

@Component({
  selector: 'app-categoria-tipoexamen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-tipoexamen.component.html',
})
export class CategoriaTipoExamenComponent implements OnInit {
  categorias: any[] = [];
  model: any = {};
  loading = false;
  error = '';
  success = '';
  editingId: number | null = null;

  private api = `${environment.apiUrl}/categoriastipoexamen`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }


  //  CARGAR TODAS LAS CATEGORÍAS

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.api).subscribe({
      next: (res) => {
        this.categorias = Array.isArray(res) ? res : [];
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        console.error('❌ Error cargando categorías:', err);
        this.error = 'No se pudieron cargar las categorías.';
        this.loading = false;
      },
    });
  }


  //  GUARDAR O ACTUALIZAR

  save(): void {
    this.error = '';
    this.success = '';

    if (!this.model.nombre || !this.model.nombre.trim()) {
      this.error = '⚠️ El nombre de la categoría es obligatorio.';
      return;
    }

    const body = {
      nombre: this.model.nombre.trim(),
      descripcion: this.model.descripcion?.trim() || '',
    };

    const obs = this.editingId
      ? this.http.put(`${this.api}/${this.editingId}`, body)
      : this.http.post(this.api, body);

    this.loading = true;
    obs.subscribe({
      next: () => {
        this.success = this.editingId
          ? '✅ Categoría actualizada correctamente.'
          : '✅ Categoría creada correctamente.';
        this.reset();
        this.load();
      },
      error: (err) => {
        console.error('❌ Error al guardar categoría:', err);
        if (err.status === 409) this.error = '⚠️ Ya existe una categoría con ese nombre.';
        else this.error = '❌ Error al guardar la categoría.';
        this.loading = false;
      },
    });
  }


  //  EDITAR CATEGORÍA

  edit(row: any): void {
    this.model = { ...row };
    this.editingId = row.id ?? row.id_categoria_tipo_examen ?? null;
    this.error = '';
    this.success = '';
    console.log('✏️ Editando categoría:', this.model);
  }


  // ELIMINAR CATEGORÍA

  remove(row: any): void {
    const id = row.id ?? row.id_categoria_tipo_examen;
    if (!id) return;

    if (!confirm(`¿Eliminar la categoría "${row.nombre}"?`)) return;

    this.loading = true;
    this.http.delete(`${this.api}/${id}`).subscribe({
      next: () => {
        this.success = '🗑️ Categoría eliminada correctamente.';
        this.load();
      },
      error: (err) => {
        console.error('❌ Error eliminando categoría:', err);
        if (err.status === 409)
          this.error = '⚠️ No se puede eliminar la categoría porque tiene tipos de examen asociados.';
        else this.error = '❌ No se pudo eliminar la categoría.';
        this.loading = false;
      },
    });
  }


  //  LIMPIAR FORMULARIO

  reset(): void {
    this.model = {};
    this.editingId = null;
    this.error = '';
    this.success = '';
    this.loading = false;
  }
}
