// src/app/services/reportes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
//  Ajusta la ruta si tu env está en otra carpeta
import { environment } from '../core/env';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private base = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  // -------- helpers de descarga ----------
  private filenameFrom(res: HttpResponse<Blob>, fallback: string): string {
    const cd = res.headers.get('content-disposition') ?? '';
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
    const raw = decodeURIComponent((m?.[1] || m?.[2] || fallback).trim());
    return raw.replace(/[/\\?%*:|"<>]/g, '_');
  }

  private downloadBlob(res: HttpResponse<Blob>, fallbackName: string) {
    const blob = res.body!;
    const filename = this.filenameFrom(res, fallbackName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // -------- PDF individuales ----------
  descargarPDFIndividual(tipo: 'pacientes'|'referidos'|'examenes'|'activos') {
    const url = `${this.base}/${tipo}`;
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }

  // -------- PDF general ----------
  reporteGeneralPDF(secciones: string[]) {
    const url = `${this.base}/general`;
    return this.http.post(url, secciones, { responseType: 'blob', observe: 'response' });
  }

  // -------- Excel individuales ----------
  exportarExcelIndividual(tipo: 'pacientes'|'referidos'|'examenes'|'activos') {
    const url = `${this.base}/excel/${tipo}`;
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }

  // -------- Excel general ----------
  reporteGeneralExcel(secciones: string[]) {
    const url = `${this.base}/generalexcel`;
    return this.http.post(url, secciones, { responseType: 'blob', observe: 'response' });
  }

  // -------- PDF clínico por paciente (opcional) ----------
  resultadosPacientePDF(idPaciente: number, desde?: string, hasta?: string) {
    const q = new URLSearchParams();
    if (desde) q.set('desde', desde);
    if (hasta) q.set('hasta', hasta);
    const url = `${this.base}/resultados/${idPaciente}${q.toString() ? `?${q}` : ''}`;
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }

  // Pipas listas para usar en el componente
  pipeDescarga = (fallback: string) => (res: HttpResponse<Blob>) => this.downloadBlob(res, fallback);
}
