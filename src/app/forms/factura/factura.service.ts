import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private api = `${environment.apiUrl}/facturas`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, pageSize: number = 20): Observable<any> {
    return this.http.get(`${this.api}?page=${page}&pageSize=${pageSize}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.api}/${id}`);
  }
}
