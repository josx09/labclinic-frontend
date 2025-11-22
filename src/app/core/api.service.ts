import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './env';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl.replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<{ token: string; type: number; name: string }>(
      `${this.base}/auth/login`,
      { username, password }
    );
  }
}
