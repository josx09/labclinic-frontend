import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CrudService } from '../../core/crud.service';
import { environment } from '../../core/env';
import { ParametrosTipoExamenComponent } from './parametro.component';
import { TipoExamenService } from '../tipoexamen/tipoexamen.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-tipoexamen',
  standalone: true,
  imports: [CommonModule, FormsModule, ParametrosTipoExamenComponent],
  templateUrl: './form.html',
  styleUrls: ['./form.css']
})
export class TipoexamenFormComponent implements OnInit {
  @ViewChild('formRef') formRef!: NgForm;

  items: any[] = [];
  pagedItems: any[] = [];
  model: any = {};
  editingId: number | null = null;
  loading = false;
  error = '';
  success = '';
  page = 1;              
  pageSize = 10;         
  totalItems = 0;       
  totalPages = 0;        
  searchTerm = '';       


  //  Datos para precios por clínica
  preciosClinica: any[] = [];
  insumosDisponibles: any[] = []; // Catálogo de insumos existentes
  insumosAsociados: any[] = [];   // Insumos ya vinculados al tipo de examen
  nuevoInsumo = { id_insumo: null, cantidad_usada: 1 }; // Control del formulario
  clinicas: any[] = [];
  precio = {
    id_clinica: null as number | null,
    id_tipo_examen: 0,
    precio_especial: 0,
    vigente_desde: '',
    vigente_hasta: ''
  };

  //  Control de pestañas
  activeTab: 'parametros' | 'precios' | 'insumos' = 'parametros';


  readonly apiClinicas = `${environment.apiUrl}/clinicas`;
  readonly apiPrecios = `${environment.apiUrl}/PreciosClinica`;
  readonly apiCategorias = `${environment.apiUrl}/CategoriasTipoExamen`;
  readonly apiPerfiles = `${environment.apiUrl}/PerfilesExamen`;

  categorias: any[] = [];
  perfiles: any[] = [];

  constructor(private api: CrudService, private http: HttpClient, private tipoExamenSrv: TipoExamenService) {}


  ngOnInit(): void {
    this.load();
    this.loadClinicas();
    this.loadCategorias();
    this.loadPerfiles();
  }

  /**  Normaliza el ID */
  private getTipoId(x: any): number {
    return x?.id_tipo_examen ?? x?.id ?? x?.idTipoExamen ?? 0;
  }

  //  Actualiza el subconjunto visible de registros
updatePagedItems() {
  const start = (this.page - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.pagedItems = this.items.slice(start, end);
}


/**  Cambia de página y recarga desde el backend */
changePage(p: number) {
  if (p < 1 || p > this.totalPages) return;
  this.load(p); //  Llama al backend directamente con el nuevo número de página
}

load(page: number = 1) {
  this.loading = true;
  this.page = page;

  this.api.listFull<any>('tipos-examen', {
    page: this.page,
    pageSize: this.pageSize,
    search: this.searchTerm?.trim() || ''
  }).subscribe({
    next: (res: any) => {
      if (res && res.items) {
        //  Backend devuelve { total, items }
        this.pagedItems = res.items.map((x: any) => ({
          ...x,
          categoria: x.categoria || '(Sin categoría)',
          perfil: x.perfil || '(Sin perfil)',
        }));
        this.totalItems = res.total ?? this.pagedItems.length;
      } else if (Array.isArray(res)) {
        //  En caso de que venga un array plano
        this.pagedItems = res.map((x: any) => ({
          ...x,
          categoria: x.categoria || '(Sin categoría)',
          perfil: x.perfil || '(Sin perfil)',
        }));
        this.totalItems = this.pagedItems.length;
      }

      //  Calcular páginas
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      this.loading = false;
    },
    error: (err: any) => {
      console.error('Error cargando tipos de examen:', err);
      this.error = '❌ Error cargando los tipos de examen.';
      this.loading = false;
    }
  });
}


/**  Ejecuta búsqueda por nombre o descripción */
buscar() {
  this.page = 1; // Reiniciar a la primera página
  this.load(1);
}

/**  Limpia la búsqueda y recarga todos los registros */
limpiarBusqueda() {
  this.searchTerm = '';
  this.page = 1;
  this.load(1);
}


  //  Cargar Catálogo de Categorías y Perfiles
  loadCategorias() {
    this.http.get<any[]>(this.apiCategorias).subscribe({
      next: (res) => (this.categorias = res),
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  loadPerfiles() {
    this.http.get<any[]>(this.apiPerfiles).subscribe({
      next: (res) => (this.perfiles = res),
      error: (err) => console.error('Error cargando perfiles:', err)
    });
  }

  /**  Editar tipo existente */
  edit(row: any) {
    this.model = {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: row.precio,
      id_categoria_tipo_examen: row.idCategoriaTipoExamen ?? null,
      id_perfil_examen: row.idPerfilExamen ?? null
    };
    this.activeTab = 'parametros';
  }

  /**  Limpia el formulario y mensajes */
  resetForm(): void {
  // Guardar pestaña actual (parametros o precios)
  const currentTab = this.activeTab;

  // Reiniciar modelo
  this.model = {
    id: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    id_categoria_tipo_examen: null,
    id_perfil_examen: null
  };

  // Limpieza visual del formulario
  if (this.formRef) {
    this.formRef.resetForm();
  }

  // Limpiar mensajes
  this.error = '';
  this.success = '';
  this.preciosClinica = [];

  // Mantener la pestaña actual
  this.activeTab = currentTab ?? 'parametros';
}


save() {
  this.error = '';
  this.success = '';
  const id = Number(this.model?.id ?? 0);

  // Construir el cuerpo con nombres que el backend reconoce
  const body = {
    id, //  requerido para PUT
    nombre: (this.model?.nombre ?? '').trim(),
    descripcion: (this.model?.descripcion ?? '').trim() || null,
    precio: Number(this.model?.precio ?? 0),
    idCategoriaTipoExamen: this.model?.id_categoria_tipo_examen ?? null,
    idPerfilExamen: this.model?.id_perfil_examen ?? null
  };

  // Determinar si es creación o edición
  const isEdit = id > 0;
  const req$ = isEdit
    ? this.api.update('tipoexamen', id, body)
    : this.api.create('tipoexamen', body);

  this.loading = true;
  req$.subscribe({
    next: (res) => {
      this.loading = false;
      this.success = isEdit
        ? '✅ Registro actualizado correctamente.'
        : '✅ Registro creado correctamente.';
      this.resetForm();
      this.load(); // refrescar tabla
    },
    error: (e) => {
      this.loading = false;
      console.error('Error guardando:', e);
      if (e?.error?.message) {
        this.error = `❌ ${e.error.message}`;
      } else {
        this.error = isEdit
          ? '❌ Error al actualizar el registro.'
          : '❌ Error al crear el registro.';
      }
      this.success = '';
    }
  });
}

/**  Eliminar tipo de examen */
remove(item: any) {
  const id = this.getTipoId(item);
  if (!id) {
    alert('❌ No se encontró el ID del tipo de examen.');
    return;
  }

  if (!confirm(`¿Seguro que deseas eliminar el tipo de examen "${item.nombre}"?`))
    return;

  //  Llamada directa al endpoint correcto del backend
  this.http.delete(`${environment.apiUrl}/tipos-examen/${id}?hard=true`).subscribe({
    next: () => {
      alert('🗑️ Tipo de examen eliminado correctamente.');
      this.load(); // recargar la tabla
    },
    error: (err) => {
      console.error('Error al eliminar tipo de examen:', err);
      alert('❌ No se pudo eliminar el tipo de examen.');
    }
  });
}


  // =============================================
  // SECCIÓN DE PRECIOS POR CLÍNICA
  // =============================================

  loadClinicas() {
    this.http.get<any[]>(this.apiClinicas).subscribe({
      next: (res) => (this.clinicas = res),
      error: (err) => console.error('Error cargando clínicas:', err)
    });
  }

  loadPrecios() {
  //  Asegurar que tome correctamente el ID del examen sin importar el nombre de la propiedad
  const id = this.model.id_tipo_examen || this.model.id || this.model.idTipoExamen;
  if (!id) return;

  this.http
    .get<any[]>(`${this.apiPrecios}/porClinica/${id}`)
    .subscribe({
      next: (res) => {
        console.log('✅ Precios recibidos:', res);
        this.preciosClinica = res.map((p) => ({
          id: p.id ?? p.id_precio_clinica,
          clinica:
            p.clinica ??
            p.nombreClinica ??
            p.clinicaNombre ??
            p.nombre_clinica ??
            '(Sin nombre)',
          precioEspecial: p.precioEspecial ?? p.precio_especial ?? 0,
          vigenteDesde: p.vigenteDesde ?? p.vigente_desde ?? null,
          vigenteHasta: p.vigenteHasta ?? p.vigente_hasta ?? null
        }));
      },
      error: (err) => console.error('❌ Error cargando precios:', err)
    });
}


  guardarPrecio() {
  const idTipo =
    this.model.id_tipo_examen || this.model.id || this.model.idTipoExamen;

  if (!idTipo || !this.precio.id_clinica) {
    alert('Seleccione una clínica y un tipo de examen.');
    return;
  }

  const body = {
    idClinica: this.precio.id_clinica,
    idTipoExamen: idTipo,
    precioEspecial: this.precio.precio_especial,
    vigenteDesde: this.precio.vigente_desde || new Date().toISOString(),
    vigenteHasta: this.precio.vigente_hasta || null
  };

  this.http.post(this.apiPrecios, body).subscribe({
    next: () => {
      alert('💰 Precio guardado correctamente.');
      this.precio = {
        id_clinica: null,
        id_tipo_examen: idTipo,
        precio_especial: 0,
        vigente_desde: '',
        vigente_hasta: ''
      };
      this.loadPrecios();
    },
    error: (err) => console.error('Error guardando precio:', err)
  });
}


  eliminarPrecio(p: any) {
    if (!confirm('¿Eliminar este precio especial?')) return;
    this.http.delete(`${this.apiPrecios}/${p.id}`).subscribe({
      next: () => this.loadPrecios(),
      error: (err) => console.error('Error eliminando precio:', err)
    });
  }

  /**  Cambio de pestaña */
  onTabChange(tab: 'parametros' | 'precios' | 'insumos') {
  this.activeTab = tab;
  if (tab === 'precios') this.loadPrecios();
  if (tab === 'insumos') {
    this.loadInsumosDisponibles();
    this.loadInsumosAsociados();
  }
}


    // =============================================
  // 🔹 INSUMOS ASOCIADOS AL TIPO DE EXAMEN
  // =============================================

  /** Carga los insumos disponibles desde insumolaboratorio */
  loadInsumosDisponibles() {
    this.tipoExamenSrv.getInsumosDisponibles().subscribe({
      next: (res) => {
        this.insumosDisponibles = res;
      },
      error: (err) => {
        console.error('❌ Error cargando insumos disponibles:', err);
      },
    });
  }

  /** Carga los insumos asociados al tipo actual */
  /** Carga los insumos asociados al tipo actual */
loadInsumosAsociados() {
  const id = this.model.id || this.model.id_tipo_examen || this.model.idTipoExamen;
  if (!id) return;

  this.tipoExamenSrv.getInsumosPorTipoExamen(id).subscribe({
    next: (res) => {
      // Normaliza los campos y ordena por nombre
      this.insumosAsociados = res.map((x: any) => ({
        id_insumo: x.id_insumo ?? x.idInsumo ?? 0,
        nombre: x.nombre ?? x.nombreInsumo ?? x.nombre_insumo ?? '(Desconocido)',
        cantidad_usada: Number(x.cantidad_usada ?? 0),
        stock: x.stock ?? '—',
        unidad_medida: x.unidad_medida ?? x.unidadMedida ?? ''
      })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    },
    error: (err) => {
      console.error('❌ Error cargando insumos asociados:', err);
      Swal.fire('Error', 'No se pudieron cargar los insumos asociados.', 'error');
    },
  });
}


 /** Agrega un insumo al tipo de examen */
/** Agrega un insumo al tipo de examen */
agregarInsumo() {
  const idTipo = this.model.id || this.model.id_tipo_examen || this.model.idTipoExamen;
  const idInsumo = this.nuevoInsumo.id_insumo;
  const cantidad = Number(this.nuevoInsumo.cantidad_usada);

  if (!idTipo || !idInsumo) {
    Swal.fire('⚠️ Campos incompletos', 'Debe seleccionar un insumo y especificar la cantidad usada.', 'warning');
    return;
  }

  if (cantidad <= 0) {
    Swal.fire('⚠️ Cantidad inválida', 'La cantidad usada debe ser mayor que cero.', 'warning');
    return;
  }

  // Evitar duplicados
  const duplicado = this.insumosAsociados.some(i => i.id_insumo === idInsumo);
  if (duplicado) {
    Swal.fire('⚠️ Duplicado', 'Este insumo ya está asociado a este tipo de examen.', 'warning');
    return;
  }

  const body = { id_insumo: idInsumo, cantidad_usada: cantidad };

  this.tipoExamenSrv.addInsumoATipoExamen(idTipo, body).subscribe({
    next: () => {
      // ✅ Añade visualmente sin recargar toda la lista
      const insumo = this.insumosDisponibles.find(i => i.id === idInsumo);
      if (insumo) {
        this.insumosAsociados.push({
          id_insumo: idInsumo,
          nombre: insumo.nombre,
          cantidad_usada: cantidad,
          stock: insumo.stock ?? '—',
          unidad_medida: insumo.unidad_medida ?? insumo.unidadMedida ?? ''
        });
      }

      Swal.fire({
        title: '✅ Insumo agregado',
        text: 'El insumo se ha asociado correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      this.nuevoInsumo = { id_insumo: null, cantidad_usada: 1 };
    },
    error: (err) => {
      console.error('❌ Error asociando insumo:', err);
      Swal.fire('❌ Error', 'No se pudo asociar el insumo.', 'error');
    },
  });
}


  /** Elimina un insumo ya asociado */
eliminarInsumo(relacion: any) {
  Swal.fire({
    title: '¿Eliminar este insumo?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      const idTipo = this.model.id || this.model.id_tipo_examen;
      this.tipoExamenSrv
        .deleteInsumoDeTipoExamen(idTipo, relacion.id_insumo)
        .subscribe({
          next: () => {
            Swal.fire('🗑️ Eliminado', 'El insumo fue eliminado correctamente.', 'success');
            this.loadInsumosAsociados();
          },
          error: (err) => {
            console.error('Error eliminando insumo:', err);
            Swal.fire('❌ Error', 'No se pudo eliminar el insumo.', 'error');
          },
        });
    }
  });
}


}
