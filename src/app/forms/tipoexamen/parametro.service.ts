import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../core/env';

@Injectable({ providedIn: 'root' })
export class ParametroService {
  // Usa el environment en lugar de URL fija
  private apiUrl = `${environment.apiUrl}/tipos-examen`;

  constructor(private http: HttpClient) {}

  //  Listar parámetros de un tipo de examen
  listarPorTipo(idTipoExamen: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idTipoExamen}/parametros`);
  }

  //  Crear un nuevo parámetro
  crear(idTipoExamen: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${idTipoExamen}/parametros`, body);
  }

  //  Actualizar parámetro existente
  actualizar(idTipoExamen: number, idParametro: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idTipoExamen}/parametros/${idParametro}`, body);
  }

  //  Eliminar parámetro
  eliminar(idTipoExamen: number, idParametro: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idTipoExamen}/parametros/${idParametro}`);
  }
}
