import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment, env } from '../../core/env';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private api = `${environment.apiUrl}/pagos`;

  //  Mantiene la sucursal activa actual
  private get sucursalId(): number {
    return env.sucursalId.value;
  }

  constructor(private http: HttpClient) {}

  // ==========================================================
  //  OBTENER PAGOS (solo los que provienen de exámenes)
  // ==========================================================
  getAll(q: { page: number; pageSize: number; search?: string }, personaId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', q.page)
      .set('pageSize', q.pageSize)
      .set('soloConExamenes', true)
      .set('idSucursal', this.sucursalId); // ✅ envío de sucursal activa

    if (q.search) params = params.set('search', q.search);
    if (personaId) params = params.set('personaId', personaId);

    return this.http.get(this.api, { params }).pipe(
      map((res: any) => {
        console.log(`🏥 [PagoService] Pagos obtenidos para sucursal ${this.sucursalId}`, res);
        return res;
      })
    );
  }

  // ==========================================================
  // OBTENER RESUMEN DE EXÁMENES IMPAGOS
  // ==========================================================
  resumen(idPersona: number): Observable<any> {
    const url = `${this.api}/resumen/${idPersona}`;
    return this.http.get(url, { params: { idSucursal: this.sucursalId } }).pipe(
      map((res: any) => {
        console.log(`📋 [PagoService] Resumen de paciente ${idPersona} en sucursal ${this.sucursalId}`);
        return res;
      })
    );
  }

  // ==========================================================
  //  CREAR PAGO TOTAL DESDE EXÁMENES (flujo validado)
  // ==========================================================
  createFromExams(body: {
    idPersona: number;
    idUsuario: number;
    idTipoPago: number;
    montoPagado: number;
    examenIds: number[];
    concepto?: string;
    nota?: string;
    fechaPago?: string;
    idSucursal?: number;
  }): Observable<any> {
    // ✅ Inyectar sucursal activa si no viene en el body
    body.idSucursal = body.idSucursal ?? this.sucursalId;

    console.log('💳 [PagoService] Creando pago desde exámenes:', body);
    return this.http.post(`${this.api}/from-exams`, body);
  }

  // ==========================================================
  //  PAGO TOTAL (flujo anterior, aún soportado)
  // ==========================================================
  pagarPaciente(body: any): Observable<{
  id_pago: number;
  total: number;
  cantidad: number;
  message: string;
}> {
  body.idSucursal = body.idSucursal ?? this.sucursalId;
  console.log('💰 [PagoService] Pago total:', body);
  return this.http.post<{
    id_pago: number;
    total: number;
    cantidad: number;
    message: string;
  }>(`${this.api}/pagar-paciente`, body);
}


  // ==========================================================
  //  PAGO PARCIAL (flujo anterior, aún soportado)
  // ==========================================================
  pagarParcial(body: any): Observable<any> {
    body.idSucursal = body.idSucursal ?? this.sucursalId; // ✅ agregar sucursal
    console.log('💸 [PagoService] Pago parcial:', body);
    return this.http.post(`${this.api}/pagar-parcial`, body);
  }

  // ==========================================================
  //  HISTORIAL DE PAGOS POR PACIENTE
  // ==========================================================
  historial(idPersona: number): Observable<any> {
    const url = `${this.api}/historial/${idPersona}`;
    return this.http.get(url, { params: { idSucursal: this.sucursalId } }).pipe(
      map((res: any) => {
        console.log(`📜 [PagoService] Historial de pagos de persona ${idPersona} (Sucursal ${this.sucursalId})`);
        return res;
      })
    );
  }
}
