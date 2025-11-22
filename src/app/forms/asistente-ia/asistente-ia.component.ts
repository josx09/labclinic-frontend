import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../core/env';

@Component({
  selector: 'app-asistente-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistente-ia.component.html',
  styleUrls: ['./asistente-ia.component.css']
})
export class AsistenteIAComponent {
  prompt = '';
  respuesta = '';
  cargando = false;
  historial: { pregunta: string; respuesta: string }[] = [];
  readonly api = `${environment.apiUrl}/ia/chat`;

  constructor(private http: HttpClient) {}

  enviar() {
    if (!this.prompt.trim()) return;
    this.cargando = true;
    this.respuesta = '';

    const rol = localStorage.getItem('rol') ?? 'general';
    const token = localStorage.getItem('token');
    const sucursalId = localStorage.getItem('sucursalId') || '1';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Sucursal-Id': sucursalId
    });

    const body = { prompt: this.prompt, rol };

    this.http.post<any>(this.api, body, { headers }).subscribe({
      next: (res) => {
        const respuesta = res.respuesta ?? '(sin respuesta del asistente)';
        this.respuesta = respuesta;
        this.historial.unshift({ pregunta: this.prompt, respuesta });
        this.prompt = '';
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error IA:', err);
        this.respuesta = '❌ No se pudo conectar con el asistente.';
        this.cargando = false;
      },
    });
  }
}
