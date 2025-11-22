import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParametroService } from './parametro.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-parametros-tipo-examen',
  templateUrl: './parametro.component.html',
  styleUrls: ['./parametro.component.css'],
  imports: [CommonModule, FormsModule],
})
export class ParametrosTipoExamenComponent implements OnInit, OnChanges {
  @Input() idTipoExamen!: number;

  parametros: any[] = [];
  model: any = {};
  editingId: number | null = null;

  loading = false;
  error = '';

  constructor(private api: ParametroService) {}

  ngOnInit(): void {
    if (this.idTipoExamen) {
      this.load();
    }
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['idTipoExamen']?.currentValue && ch['idTipoExamen'].currentValue !== ch['idTipoExamen'].previousValue) {
      this.idTipoExamen = ch['idTipoExamen'].currentValue;
      this.load();
    }
  }

  load(): void {
    if (!this.idTipoExamen) return;

    this.loading = true;
    this.error = '';
    this.api.listarPorTipo(this.idTipoExamen).subscribe({
      next: (data: any[]) => {
        this.parametros = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar parámetros';
        this.loading = false;
      },
    });
  }

  edit(row: any): void {
    this.model = { ...row };
    this.model.esTitulo = row.esTitulo === 1;
    this.model.orden = row.orden ?? null;
    this.editingId = row.id ?? row.id_parametro_tipo_examen ?? null;
  }

  reset(): void {
    this.model = {};
    this.editingId = null;
  }

  //  Guardar parámetro (nuevo o actualizado)
  save(): void {
    if (!this.idTipoExamen) {
      this.error = 'Debe seleccionar un tipo de examen antes de agregar parámetros.';
      return;
    }

    this.loading = true;
    const body = {
      ...this.model,
      idTipoExamen: this.idTipoExamen,
      esTitulo: this.model.esTitulo ? 1 : 0,
      orden: this.model.orden ?? null,
    };

    const obs = this.editingId
      ? this.api.actualizar(this.idTipoExamen, this.editingId, body) 
      : this.api.crear(this.idTipoExamen, body); 

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.reset();
        this.load();

        Swal.fire({
          title: this.editingId ? 'Actualizado' : 'Guardado',
          text: this.editingId
            ? 'El parámetro fue actualizado correctamente.'
            : 'El parámetro fue guardado correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => { 
        console.error('Error al guardar parámetro:', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudo guardar el parámetro.', 'error');
      },
    });
  }

  //  Eliminar parámetro con confirmación
  remove(row: any): void {
    const id = row.id ?? row.id_parametro_tipo_examen;
    if (!id) {
      this.error = 'No se pudo determinar el ID del parámetro.';
      return;
    }

    Swal.fire({
      title: `¿Eliminar el parámetro "${row.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.eliminar(this.idTipoExamen, id).subscribe({ 
          next: () => {
            Swal.fire({
              title: 'Eliminado',
              text: 'El parámetro fue eliminado correctamente.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });
            this.load();
          },
          error: (err: any) => {
            console.error('Error al eliminar parámetro:', err);
            Swal.fire('Error', 'No se pudo eliminar el parámetro.', 'error');
          },
        });
      }
    });
  }
}
