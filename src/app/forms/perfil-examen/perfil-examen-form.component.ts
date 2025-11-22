import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoExamenService } from '../tipoexamen/tipoexamen.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';
import { CrudService } from '../../core/crud.service';

@Component({
  selector: 'app-perfil-examen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-examen-form.html',
  styleUrls: ['./perfil-examen-form.css']
})
export class PerfilExamenFormComponent implements OnInit {
  perfiles: any[] = [];
  examenes: any[] = [];
  seleccionados: number[] = [];

  // Paginación y búsqueda
  page = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  searchTerm = '';

  model: any = {
    id_perfil_examen: 0,
    nombre: '',
    descripcion: '',
    precio_total: 0,
    precio_paquete: 0
  };

  loading = false;
  error = '';
  success = '';
  modoEdicion = false;

  readonly apiPerfiles = `${environment.apiUrl}/perfilesexamen`;

  constructor(
    private http: HttpClient,
    private api: CrudService,
    private tipoExamenService: TipoExamenService
  ) {}

  ngOnInit() {
    this.loadPerfiles();
    this.loadExamenes();
  }

  /**  Cargar perfiles */
  loadPerfiles() {
  this.loading = true; //  Indicador visual de carga
  this.error = '';
  this.success = '';

  this.http.get<any[]>(this.apiPerfiles).subscribe({
    next: (res) => {
      const data = Array.isArray(res) ? res : (res as any)?.items ?? [];

      this.perfiles = data.map((p: any) => {
        const examenes = p.examenes ?? p.Examenes ?? [];
        const total = Number(
          p.precioTotal ?? p.precio_total ?? this.calcularSubtotal(examenes) ?? 0
        );
        const paquete = Number(
          p.precioPaquete ?? p.precio_paquete ?? total
        );

        return {
          ...p,
          examenes,
          precioTotal: total,
          precioPaquete: paquete
        };
      });

      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Error cargando perfiles:', err);
      this.error = '❌ No se pudieron cargar los perfiles de examen.';
      this.loading = false;
    }
  });
}


  /**  Cargar exámenes desde backend con paginación y búsqueda */
  loadExamenes(page: number = this.page) {
    this.loading = true;
    this.tipoExamenService.buscarTiposExamen({
      page,
      pageSize: this.pageSize,
      search: this.searchTerm.trim()
    }).subscribe({
      next: (res) => {
        const items = res?.items ?? res ?? [];
        this.examenes = items.map((x: any) => ({
          id: x.id ?? x.id_tipo_examen,
          nombre: x.nombre,
          precio: x.precio ?? 0,
          descripcion: x.descripcion ?? ''
        }));
        this.totalItems = res?.total ?? items.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando exámenes:', err);
        this.error = '❌ Error cargando lista de exámenes.';
        this.loading = false;
      }
    });
  }

  /**  Buscar exámenes */
  buscar() {
    this.page = 1;
    this.loadExamenes();
  }

  /**  Limpiar búsqueda */
  limpiarBusqueda() {
    this.searchTerm = '';
    this.page = 1;
    this.loadExamenes();
  }

  /**  Cambiar página */
  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.loadExamenes();
  }

  /**  Seleccionar/deseleccionar examen */
  toggleExamen(id: number, checked: boolean) {
    if (checked) this.seleccionados.push(id);
    else this.seleccionados = this.seleccionados.filter(x => x !== id);
    this.calcularPrecioTotal();
  }

  /**  Calcular total */
  calcularPrecioTotal() {
    const seleccionados = this.examenes.filter(e => this.seleccionados.includes(e.id));
    const total = seleccionados.reduce((s, e) => s + Number(e.precio || 0), 0);
    this.model.precio_total = total;
    if (!this.model.precio_paquete || Number(this.model.precio_paquete) === 0) {
      this.model.precio_paquete = total;
    }
  }

  /**  Guardar o actualizar perfil */
  guardarPerfil() {
    if (!this.model.nombre?.trim()) {
      alert('El nombre del perfil es obligatorio.');
      return;
    }

    const bodyPerfil = {
      nombre: this.model.nombre?.trim(),
      descripcion: this.model.descripcion?.trim() ?? null,
      precioTotal: Number(this.model.precio_total ?? 0),
      precioPaquete: Number(this.model.precio_paquete ?? 0)
    };

    this.loading = true;

    if (this.modoEdicion && this.model.id_perfil_examen) {
      this.http.put(`${this.apiPerfiles}/${this.model.id_perfil_examen}`, bodyPerfil).subscribe({
        next: () => this.asignarExamenes(this.model.id_perfil_examen, true),
        error: (err) => {
          this.loading = false;
          this.error = '❌ Error al actualizar el perfil.';
          console.error(err);
        }
      });
    } else {
      this.http.post<any>(this.apiPerfiles, bodyPerfil).subscribe({
        next: (res) => {
          const id = res?.id_perfil_examen ?? res?.perfil?.id ?? res?.id ?? 0;
          if (id > 0) this.asignarExamenes(id, false);
          else {
            this.loading = false;
            this.error = '❌ No se pudo obtener el ID del perfil.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = '❌ Error al crear el perfil.';
          console.error(err);
        }
      });
    }
  }

  /**  Asignar exámenes al perfil */
  asignarExamenes(idPerfil: number, esEdicion = false): void {
  if (!this.seleccionados.length) {
    this.http.post(`${this.apiPerfiles}/${idPerfil}/asignar`, []).subscribe({
      next: () => {
        this.loading = false;
        this.success = esEdicion
          ? '✅ Perfil actualizado.'
          : '✅ Perfil creado correctamente.';
        this.reset();
        this.loadPerfiles();
      },
      error: (err) => {
        this.loading = false;
        this.error = '❌ Error asignando exámenes (perfil vacío).';
        console.error(err);
      }
    });
    return;
  }

     //  Unificar IDs y evitar duplicados
  const idsUnicos = Array.from(new Set(this.seleccionados));

  // Agregar sin eliminar los anteriores
  this.http.post(`${this.apiPerfiles}/${idPerfil}/asignar?append=true`, idsUnicos).subscribe({
    next: () => {
      this.loading = false;
      this.success = esEdicion
        ? '✅ Perfil actualizado correctamente (sin eliminar exámenes anteriores).'
        : '✅ Perfil creado y exámenes asignados.';
      this.error = '';
      this.reset();
      this.loadPerfiles();
    },
    error: (err) => {
      this.loading = false;
      this.error = '❌ Error asignando exámenes al perfil.';
      console.error(err);
    }
  });

  }

  /**  Editar perfil */
  editarPerfil(p: any) {
    this.modoEdicion = true;
    this.model = {
      id_perfil_examen: p.id_perfil_examen ?? p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio_total: Number(p.precioTotal ?? p.precio_total ?? this.calcularSubtotal(p.examenes)),
      precio_paquete: Number(p.precioPaquete ?? p.precio_paquete ?? 0)
    };
    this.seleccionados = (p.examenes || []).map((e: any) => e.IdTipoExamen ?? e.id_tipo_examen ?? e.id);
    this.success = '';
    this.error = '';
  }

  /**  Eliminar perfil */
  eliminarPerfil(p: any) {
    const id = p.id_perfil_examen ?? p.id;
    if (!confirm(`¿Eliminar el perfil "${p.nombre}"?`)) return;

    this.http.delete(`${this.apiPerfiles}/${id}`).subscribe({
      next: () => {
        this.success = '🗑️ Perfil eliminado correctamente.';
        this.error = '';
        this.loadPerfiles();
      },
      error: (err) => {
        console.error(err);
        this.error = '❌ Error al eliminar el perfil.';
      }
    });
  }

eliminarExamenDePerfil(p: any, e: any) {
  const idPerfil =
    p.id_perfil_examen ?? p.id ?? p.Id ?? p.IdPerfil ?? p.IdPerfilExamen;

  const idExamen = Number(
    e?.IdTipoExamen ??
    e?.idTipoExamen ??
    e?.id_tipo_examen ??
    e?.tipoExamen ??
    e?.id_examen ??
    e?.IdExamen ??
    e?.id
  );

  console.log('🧩 Datos para eliminar:', { idPerfil, idExamen, p, e });

  if (!idPerfil || !idExamen) {
    alert('⚠️ No se pudo determinar el perfil o el examen (revise consola para detalles).');
    return;
  }

  if (!confirm(`¿Deseas quitar el examen "${e.Nombre ?? e.nombre}" del perfil "${p.Nombre ?? p.nombre}"?`)) {
    return;
  }

  this.http.delete(`${this.apiPerfiles}/${idPerfil}/examen/${idExamen}`).subscribe({
    next: () => {
      alert('✅ Examen eliminado correctamente del perfil.');
      this.loadPerfiles();
    },
    error: (err) => {
      console.error('❌ Error al quitar examen del perfil:', err);
      alert('❌ Error al quitar el examen del perfil.');
    }
  });
}

  /**  Limpiar formulario */
  reset() {
    this.model = {
      id_perfil_examen: 0,
      nombre: '',
      descripcion: '',
      precio_total: 0,
      precio_paquete: 0
    };
    this.seleccionados = [];
    this.modoEdicion = false;
    this.error = '';
    this.success = '';
  }

  /** Calcular subtotal */
  calcularSubtotal(examenes: any[]): number {
    if (!Array.isArray(examenes)) return 0;
    return examenes.reduce((sum, e) => sum + Number(e.Precio ?? e.precio ?? 0), 0);
  }

}
