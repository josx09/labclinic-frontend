import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';

@Component({
  standalone: true,
  selector: 'app-empleado-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html'
})
export class EmpleadoFormComponent {
  items: any[] = [];

  model: any = {
    nombre: '',
    apellido: '',
    sexo: '',
    telefono: '',
    correo: '',
    fecha_nacimiento: null,
    dpi: '',
    formacion_academica: '',
    idMunicipio: null,
    idDepartamento: null,
    estado: 1
  };

  editingId: number | null = null;
  loading = false;
  error = '';

  //  Catálogos
  departamentos: any[] = [];
  municipios: any[] = [];
  readonly apiDepartamentos = `${environment.apiUrl}/departamentos`;
  readonly apiMunicipios = `${environment.apiUrl}/municipios`;

  constructor(private api: CrudService, private http: HttpClient) {
    this.load();
    this.loadDepartamentos();
    this.loadMunicipios();
  }

 
  //  Cargar empleados

  load() {
    this.loading = true;
    this.api.list<any>('empleados').subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.items ?? [];
        this.items = data.map((e: any) => ({
          id: e.id,
          nombre: e.nombre ?? '',
          apellido: e.apellido ?? '',
          sexo: e.sexo ?? '',
          telefono: e.telefono ?? '',
          correo: e.correo ?? '',
          fecha_nacimiento: e.fechaNacimiento ?? null,
          dpi: e.dpi ?? '',
          formacion_academica: e.formacionAcademica ?? '',
          idMunicipio: e.idMunicipio ?? null,
          idDepartamento: e.idDepartamento ?? null,
          estado: e.estado ?? 1
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando empleados:', err);
        this.error = 'Error cargando empleados';
        this.loading = false;
      }
    });
  }


  //  Cargar Departamentos

  loadDepartamentos() {
    this.http
      .get<{ total: number; items: any[] }>(`${this.apiDepartamentos}?page=1&pageSize=500`)
      .subscribe({
        next: (res) => (this.departamentos = res.items ?? []),
        error: (err) => console.error('Error cargando departamentos:', err)
      });
  }



//  Cargar todos los Municipios

loadMunicipios() {
  this.http
    .get<{ total: number; items: any[] }>(`${this.apiMunicipios}?page=1&pageSize=1000`)
    .subscribe({
      next: (res) => (this.municipios = res.items ?? res),
      error: (err) => console.error('Error cargando municipios:', err)
    });
}

  onDepartamentoChange() {
    const depId = this.model.idDepartamento;
    if (!depId) {
      this.municipios = [];
      this.model.idMunicipio = null;
      return;
    }
    

    this.http.get<any[]>(`${this.apiMunicipios}/departamento/${depId}`).subscribe({
      next: (res) => (this.municipios = res ?? []),
      error: (err) => console.error('Error cargando municipios:', err)
    });
  }

 
  //  Obtener nombre del municipio (para mostrar en tabla)

  getMunicipioNombre(id: number | null): string {
    if (!id) return '—';
    const mun = this.municipios?.find((m: any) => m.id === id);
    return mun ? mun.nombre : '—';
  }


  // Crear o actualizar empleado

  save() {
    const id = this.editingId;

    const body = {
      nombre: this.model.nombre?.trim(),
      apellido: this.model.apellido?.trim(),
      sexo: this.model.sexo,
      telefono: this.model.telefono || null,
      correo: this.model.correo || null,
      fechaNacimiento: this.model.fecha_nacimiento || null,
      dpi: this.model.dpi || '',
      formacionAcademica: this.model.formacion_academica || '',
      idMunicipio: Number(this.model.idMunicipio) || null,
      idDepartamento: Number(this.model.idDepartamento) || null,
      estado: Number(this.model.estado ?? 1)
    };

    this.loading = true;
    const obs = id
      ? this.api.update<any>('empleados', id, body)
      : this.api.create<any>('empleados', body);

    obs.subscribe({
      next: () => {
        this.reset();
        this.load();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al guardar empleado:', err);
        this.error = 'No se pudo guardar el registro.';
        this.loading = false;
      }
    });
  }


  //  Editar empleado

  edit(row: any) {
    this.editingId = row.id;
    this.model = {
      nombre: row.nombre,
      apellido: row.apellido,
      sexo: row.sexo,
      telefono: row.telefono,
      correo: row.correo,
      fecha_nacimiento: row.fecha_nacimiento ? row.fecha_nacimiento.substring(0, 10) : null,
      dpi: row.dpi,
      formacion_academica: row.formacion_academica,
      idMunicipio: row.idMunicipio,
      idDepartamento: row.idDepartamento,
      estado: row.estado
    };

    if (this.model.idDepartamento) {
      this.onDepartamentoChange();
    }

    this.error = '';
  }

  
  //  Limpiar formulario
 
  reset() {
    this.model = {
      nombre: '',
      apellido: '',
      sexo: '',
      telefono: '',
      correo: '',
      fecha_nacimiento: null,
      dpi: '',
      formacion_academica: '',
      idMunicipio: null,
      idDepartamento: null,
      estado: 1
    };
    this.municipios = [];
    this.editingId = null;
    this.error = '';
  }

  
  //  Eliminar empleado
  
  remove(id: number) {
    if (!confirm('¿Eliminar este empleado?')) return;
    this.loading = true;

    this.api.remove<any>('empleados', id).subscribe({
      next: () => {
        this.load();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error eliminando empleado:', err);
        this.error = 'No se pudo eliminar.';
        this.loading = false;
      }
    });
  }
}
