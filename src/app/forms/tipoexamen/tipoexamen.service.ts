import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../core/env';
import { TipoExamen, CategoriaTipoExamen, PerfilExamen } from '../tipoexamen/tipoexamen.model';

@Injectable({ providedIn: 'root' })
export class TipoExamenService {
  private api = `${environment.apiUrl}/tipos-examen`;
  private apiCategorias = `${environment.apiUrl}/categorias-tipo-examen`;
  private apiPerfiles = `${environment.apiUrl}/perfiles-examen`;
  private apiPrecios = `${environment.apiUrl}/PreciosClinica`;

  constructor(private http: HttpClient) {}

  // ===============================================================
  //  TIPOS DE EXAMEN
  // ===============================================================

  /**  Obtener todos los tipos de examen (con paginación y búsqueda opcional) */
  getAll(params?: { page?: number; pageSize?: number; search?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('❌ Error al obtener tipos de examen:', error);
        return throwError(() => new Error('No se pudieron cargar los tipos de examen'));
      })
    );
  }

  /**  Buscar tipos de examen desde el backend (para buscadores y formularios) */
  buscarTiposExamen(params: { page?: number; pageSize?: number; search?: string }): Observable<any> {
    const httpParams = new HttpParams({ fromObject: { ...params } });
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('❌ Error en búsqueda de tipos de examen:', error);
        return throwError(() => new Error('Error al buscar exámenes'));
      })
    );
  }

  /** Obtener un tipo de examen por su ID */
  getById(id: number): Observable<TipoExamen> {
    return this.http.get<TipoExamen>(`${this.api}/${id}`).pipe(
      catchError((error) => {
        console.error(`❌ Error al obtener tipo de examen ID ${id}:`, error);
        return throwError(() => new Error('No se encontró el tipo de examen solicitado'));
      })
    );
  }

  /**  Crear un nuevo tipo de examen */
  save(data: Partial<TipoExamen>): Observable<TipoExamen> {
    return this.http.post<TipoExamen>(this.api, data).pipe(
      catchError((error) => {
        console.error('❌ Error al crear tipo de examen:', error);
        return throwError(() => new Error('No se pudo crear el tipo de examen'));
      })
    );
  }

  /**  Actualizar un tipo de examen existente */
  update(id: number, data: Partial<TipoExamen>): Observable<TipoExamen> {
    return this.http.put<TipoExamen>(`${this.api}/${id}`, data).pipe(
      catchError((error) => {
        console.error(`❌ Error al actualizar tipo de examen ID ${id}:`, error);
        return throwError(() => new Error('No se pudo actualizar el tipo de examen'));
      })
    );
  }

  /**  Eliminar tipo de examen */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`).pipe(
      catchError((error) => {
        console.error(`❌ Error al eliminar tipo de examen ID ${id}:`, error);
        return throwError(() => new Error('No se pudo eliminar el tipo de examen'));
      })
    );
  }

  // ===============================================================
  //  CATEGORÍAS DE EXAMEN
  // ===============================================================

  getCategorias(): Observable<CategoriaTipoExamen[]> {
    return this.http.get<CategoriaTipoExamen[]>(this.apiCategorias).pipe(
      catchError((error) => {
        console.error('❌ Error al obtener categorías:', error);
        return throwError(() => new Error('No se pudieron cargar las categorías'));
      })
    );
  }

  getCategoriaById(id: number): Observable<CategoriaTipoExamen> {
    return this.http.get<CategoriaTipoExamen>(`${this.apiCategorias}/${id}`).pipe(
      catchError((error) => {
        console.error(`❌ Error al obtener categoría ID ${id}:`, error);
        return throwError(() => new Error('No se encontró la categoría solicitada'));
      })
    );
  }

  saveCategoria(data: Partial<CategoriaTipoExamen>): Observable<CategoriaTipoExamen> {
    return this.http.post<CategoriaTipoExamen>(this.apiCategorias, data).pipe(
      catchError((error) => {
        console.error('❌ Error al crear categoría:', error);
        return throwError(() => new Error('No se pudo crear la categoría'));
      })
    );
  }

  updateCategoria(id: number, data: Partial<CategoriaTipoExamen>): Observable<CategoriaTipoExamen> {
    return this.http.put<CategoriaTipoExamen>(`${this.apiCategorias}/${id}`, data).pipe(
      catchError((error) => {
        console.error(`❌ Error al actualizar categoría ID ${id}:`, error);
        return throwError(() => new Error('No se pudo actualizar la categoría'));
      })
    );
  }

  deleteCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiCategorias}/${id}`).pipe(
      catchError((error) => {
        console.error(`❌ Error al eliminar categoría ID ${id}:`, error);
        return throwError(() => new Error('No se pudo eliminar la categoría'));
      })
    );
  }

  // ===============================================================
  //  PERFILES DE EXAMEN
  // ===============================================================

  getPerfiles(): Observable<PerfilExamen[]> {
    return this.http.get<PerfilExamen[]>(this.apiPerfiles).pipe(
      catchError((error) => {
        console.error('❌ Error al obtener perfiles de examen:', error);
        return throwError(() => new Error('No se pudieron cargar los perfiles'));
      })
    );
  }

  getPerfilById(id: number): Observable<PerfilExamen> {
    return this.http.get<PerfilExamen>(`${this.apiPerfiles}/${id}`).pipe(
      catchError((error) => {
        console.error(`❌ Error al obtener perfil ID ${id}:`, error);
        return throwError(() => new Error('No se encontró el perfil solicitado'));
      })
    );
  }

  savePerfil(data: Partial<PerfilExamen>): Observable<PerfilExamen> {
    return this.http.post<PerfilExamen>(this.apiPerfiles, data).pipe(
      catchError((error) => {
        console.error('❌ Error al crear perfil de examen:', error);
        return throwError(() => new Error('No se pudo crear el perfil'));
      })
    );
  }

  updatePerfil(id: number, data: Partial<PerfilExamen>): Observable<PerfilExamen> {
    return this.http.put<PerfilExamen>(`${this.apiPerfiles}/${id}`, data).pipe(
      catchError((error) => {
        console.error(`❌ Error al actualizar perfil ID ${id}:`, error);
        return throwError(() => new Error('No se pudo actualizar el perfil'));
      })
    );
  }

  deletePerfil(id: number): Observable<any> {
    return this.http.delete(`${this.apiPerfiles}/${id}`).pipe(
      catchError((error) => {
        console.error(`❌ Error al eliminar perfil ID ${id}:`, error);
        return throwError(() => new Error('No se pudo eliminar el perfil'));
      })
    );
  }

  // ===============================================================
  //  PRECIOS POR CLÍNICA
  // ===============================================================

  // ✅ CORREGIDO: endpoint real del backend es /tipos-examen/{id}/precios-clinica
  getPreciosPorClinica(idTipoExamen: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${idTipoExamen}/precios-clinica`).pipe(
      catchError((error) => {
        console.error(`❌ Error al obtener precios del examen ${idTipoExamen}:`, error);
        return throwError(() => new Error('No se pudieron cargar los precios por clínica'));
      })
    );
  }

  // ===============================================================
  //  INSUMOS ASOCIADOS A TIPO DE EXAMEN
  // ===============================================================

  /** 🔹 Obtener insumos disponibles (para mostrar en el combo) */
  // ✅ CORREGIDO: ruta correcta es /insumolaboratorio/disponibles
  getInsumosDisponibles(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/insumolaboratorio`).pipe(
    catchError((error) => {
      console.error('❌ Error al obtener insumos disponibles:', error);
      return throwError(() => new Error('No se pudieron cargar los insumos'));
    })
  );
}


  /** 🔹 Obtener insumos asociados a un tipo de examen */
  getInsumosPorTipoExamen(idTipoExamen: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${idTipoExamen}/insumos`).pipe(
      catchError((error) => {
        console.error(`❌ Error al obtener insumos del examen ${idTipoExamen}:`, error);
        return throwError(() => new Error('No se pudieron cargar los insumos asociados'));
      })
    );
  }

  /** 🔹 Agregar un insumo a un tipo de examen */
  // ✅ CORREGIDO: backend usa /insumos/agregar
  addInsumoATipoExamen(
  idTipoExamen: number,
  data: { id_insumo: number; cantidad_usada: number }
): Observable<any> {
  const url = `${this.api}/${idTipoExamen}/insumos/agregar`;
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
    'X-Sucursal-Id': localStorage.getItem('id_sucursal') || '1',
    'Content-Type': 'application/json'
  });

  return this.http.post(url, data, { headers, responseType: 'json' }).pipe(
    catchError((error) => {
      console.error('❌ Error al agregar insumo:', error);
      return throwError(() => new Error('No se pudo agregar el insumo'));
    })
  );
}



  /** 🔹 Eliminar un insumo asociado de un tipo de examen */
  deleteInsumoDeTipoExamen(idTipoExamen: number, idInsumo: number): Observable<any> {
    return this.http.delete(`${this.api}/${idTipoExamen}/insumos/${idInsumo}`).pipe(
      catchError((error) => {
        console.error('❌ Error al eliminar insumo:', error);
        return throwError(() => new Error('No se pudo eliminar el insumo'));
      })
    );
  }
}
