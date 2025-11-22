import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';

type Municipio = {
  id?: number;              
  nombre: string;           
  idDepartamento: number;   
};

@Component({
  standalone: true,
  selector: 'form-municipio',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html'
})
export class MunicipioFormComponent {
  items: Municipio[] = [];
  model: Partial<Municipio> = { nombre: '', idDepartamento: undefined as any };
  editingId: number | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(private api: CrudService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.list<Municipio>('municipios').subscribe({
      next: d => { this.items = d; this.loading = false; },
      error: _ => { this.error = 'Error cargando datos'; this.loading = false; }
    });
  }

  edit(row: Municipio) {
    this.model = { ...row };
    this.editingId = row.id ?? null;
    this.success = '';
    this.error = '';
  }

  reset() {
    this.model = { nombre: '', idDepartamento: undefined as any };
    this.editingId = null;
    this.error = '';
    this.success = '';
  }

  save() {
    if (!this.model.nombre?.trim() || !this.model.idDepartamento) {
      this.error = 'Por favor completa todos los campos.';
      return;
    }

    this.loading = true;

    const body: Municipio = {
      id: this.editingId ?? undefined,
      nombre: this.model.nombre.trim(),
      idDepartamento: Number(this.model.idDepartamento)
    };

    const obs = this.editingId
      ? this.api.update<Municipio>('municipios', this.editingId!, body)
      : this.api.create<Municipio>('municipios', body);

    obs.subscribe({
      next: _ => {
        this.success = this.editingId 
          ? 'Municipio actualizado con éxito ✅'
          : 'Municipio creado con éxito ✅';
        this.reset();
        this.load();
      },
      error: _ => {
        this.error = this.editingId
          ? 'Error al actualizar el municipio ❌'
          : 'Error al crear el municipio ❌';
        this.loading = false;
      }
    });
  }
}
