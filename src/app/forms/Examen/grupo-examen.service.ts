import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GrupoExamenService {
  private api = `${environment.apiUrl}/examenes`;

  constructor(private http: HttpClient) {}


  getGrupos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/grupos`).pipe(
      map((res: any[]) =>
        (res ?? []).map(g => ({
          grupo: g.grupo,
          fecha: g.fecha,
          cantidad: g.cantidad,
          total: g.total,
          paciente: g.paciente,
          referidor: g.referidor ?? g.referidoPor ?? null
        }))
      )
    );
  }

 
  getGrupoDetalle(grupo: string): Observable<any> {
    return this.http.get<any>(`${this.api}/grupos/${grupo}`).pipe(
      map(res => ({
        ...res,
        examenes: (res.examenes ?? []).map((x: any) => ({
          ...x,
          
          referidoPor: x.referidoPor ?? x.referidor ?? '(Sin referidor)'
        }))
      }))
    );
  }
}
