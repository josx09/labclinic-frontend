import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment, env } from './env';
import { Endpoints } from './endpoints';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CrudService {
  private sucursalId = localStorage.getItem('id_sucursal') || '1';

  constructor(private http: HttpClient) {
    //  Suscribirse a cambios en la sucursal global (env)
    env.sucursalId.subscribe(id => {
      this.sucursalId = id.toString();
    });
  }

  private url(keyOrPath: string): string {
    const path = (Endpoints as any)[keyOrPath] ?? keyOrPath;
    const base = environment.apiUrl.replace(/\/+$/, '');
    const p = String(path).replace(/^\/+/, '');

    if (p.toLowerCase().startsWith('api/')) {
      return `${base.replace(/\/api$/, '')}/${p}`;
    }
    return `${base}/${p}`;
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    const headers: any = {
      'X-Sucursal-Id': this.sucursalId,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  
  //  LIST - Devuelve siempre un array, aunque venga paginado
 
  list<T>(keyOrPath: string, query: any = {}): Observable<T[]> {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      if (query[k] != null) params = params.set(k, query[k]);
    });

    return this.http.get<any>(this.url(keyOrPath), {
      params,
      headers: this.authHeaders()
    }).pipe(
      map(res => {
        if (res && typeof res === 'object' && 'items' in res) {
          return res.items as T[];
        }
        if (Array.isArray(res)) return res;
        return [];
      })
    );
  }


  // GET / CREATE / UPDATE / DELETE

  get<T>(keyOrPath: string, id?: number): Observable<T> {
    const base = this.url(keyOrPath);
    const fullUrl = id !== undefined ? `${base}/${id}` : base;
    return this.http.get<T>(fullUrl, { headers: this.authHeaders() });
  }

  create<T>(keyOrPath: string, body: any): Observable<T> {
    return this.http.post<T>(this.url(keyOrPath), body, {
      headers: this.authHeaders()
    });
  }

  update<T>(keyOrPath: string, id: number, body: any): Observable<T> {
    console.log('UPDATE URL:', `${this.url(keyOrPath)}/${id}`, 'BODY:', body);
    return this.http.put<T>(`${this.url(keyOrPath)}/${id}`, body, {
      headers: this.authHeaders()
    });
  }

  remove<T>(keyOrPath: string, id: number): Observable<T> {
    console.log('DELETE URL:', `${this.url(keyOrPath)}/${id}`);
    return this.http.delete<T>(`${this.url(keyOrPath)}/${id}`, {
      headers: this.authHeaders()
    });
  }

 
  //  LIST-FULL - Devuelve respuesta completa (paginada o no)
 
  listFull<T>(keyOrPath: string, query: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      if (query[k] != null) params = params.set(k, query[k]);
    });

    return this.http.get<any>(this.url(keyOrPath), {
      params,
      headers: this.authHeaders()
    });
  }
}
