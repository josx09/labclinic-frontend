import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../core/env';
import { Examen, TipoExamen, PagedResponse } from './examen.model';

@Injectable({ providedIn: 'root' })
export class ExamenService {
  private api = `${environment.apiUrl}/examenes`;
  private apiTipo = `${environment.apiUrl}/tipos-examen`;

  constructor(private http: HttpClient) {}

  getAll(params: any): Observable<PagedResponse<Examen>> {
    return this.http.get<PagedResponse<Examen>>(this.api, { params });
  }

  getTipos(): Observable<PagedResponse<TipoExamen>> {
    return this.http.get<PagedResponse<TipoExamen>>(this.apiTipo);
  }

  create(data: Examen) {
    return this.http.post(this.api, data);
  }

  update(id: number, data: Examen) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
