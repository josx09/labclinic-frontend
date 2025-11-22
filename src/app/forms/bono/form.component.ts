import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../core/env';

type Bono = {
  idBono?: number;
  idMedico?: number;
  idPersona?: number;
  nombreBono: string;
  porcentaje: number;
  montoBono: number;
  estado?: number;
  medicoNombre?: string;
  personaNombre?: string;
  pagado?: boolean;
  fechaRegistro?: string;
};

@Component({
  standalone: true,
  selector: 'app-bono-form',
  templateUrl: './form.html',
  imports: [CommonModule, FormsModule],
})
export class BonoFormComponent implements OnInit, OnDestroy {
  bonos: Bono[] = [];
  medicos: any[] = [];
  personas: any[] = [];

  bono: Bono = { nombreBono: '', porcentaje: 0, montoBono: 0 };

  fechaInicio = '';
  fechaFin = '';

  readonly apiBonos = `${environment.apiUrl}/bonos`;
  readonly apiUsers = `${environment.apiUrl}/users`;
  readonly apiPersonas = `${environment.apiUrl}/personas`;

  private storageListener = (e: StorageEvent) => {
    if (e.key === 'sucursalId') {
      // cuando otra parte de la app cambie la sucursal
      this.loadAll();
    }
  };

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  // -------------------- Ciclo de vida --------------------
  ngOnInit(): void {
    // 1) Tomar sucursal de la URL si viene (?sucursal=2) y sincronizarla
    this.route.queryParamMap.subscribe((qp) => {
      const qSuc = qp.get('sucursal');
      if (qSuc && qSuc !== localStorage.getItem('sucursalId')) {
        localStorage.setItem('sucursalId', qSuc);
      }
      // cargar todo con la sucursal efectiva
      this.loadAll();
    });

    // 2) Si no vino por URL y no existe, fija Central por defecto
    if (!localStorage.getItem('sucursalId')) {
      localStorage.setItem('sucursalId', '1');
    }

    // 3) Escuchar cambios de sucursal hechos en otros componentes
    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  // -------------------- Helpers --------------------
  private getSucursalHeaders(): HttpHeaders {
    const sucursalId = localStorage.getItem('sucursalId') || '1';
    return new HttpHeaders({
      'X-Sucursal-Id': sucursalId,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });
  }

  private loadAll(): void {
    this.loadBonos();
    this.loadMedicos();
    this.loadPersonas();
  }

  // -------------------- Data --------------------
  loadBonos(): void {
    const headers = this.getSucursalHeaders();
    const sucursal = headers.get('X-Sucursal-Id') || '1';
    console.log('🔎 Bonos -> sucursalId:', sucursal);

    let params = '';
    if (this.fechaInicio && this.fechaFin) {
      params = `?desde=${this.fechaInicio}&hasta=${this.fechaFin}`;
    }

    this.http.get<any[]>(`${this.apiBonos}${params}`, { headers }).subscribe({
      next: (res) => {
        this.bonos = (res || []).map((b) => ({
          idBono: b.idBono ?? b.IdBono,
          idMedico: b.idMedico ?? b.IdMedico,
          idPersona: b.idPersona ?? b.IdPersona,
          nombreBono: b.nombreBono ?? b.NombreBono,
          porcentaje: b.porcentaje ?? b.Porcentaje,
          montoBono: b.montoBono ?? b.MontoBono,
          estado: b.estado ?? b.Estado,
          medicoNombre: b.medicoNombre ?? b.MedicoNombre ?? '(Sin médico)',
          personaNombre: b.personaNombre ?? b.PersonaNombre ?? '(Sin paciente)',
          fechaRegistro: b.fechaRegistro ?? b.FechaRegistro,
          pagado: b.pagado ?? b.Pagado,
        }));
      },
      error: (err) => {
        console.error('❌ Error cargando bonos:', err);
        this.bonos = [];
      },
    });
  }

  filtrarPorFechas(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('⚠️ Debes seleccionar una fecha de inicio y fin.');
      return;
    }
    this.loadBonos();
  }

  loadMedicos(): void {
    this.http
      .get<any[]>(`${this.apiUsers}/medicos`, { headers: this.getSucursalHeaders() })
      .subscribe({
        next: (res) => {
          this.medicos = (res || []).map((m) => ({
            id: m.id,
            nombre: `${m.nombre ?? m.firstname ?? ''} ${m.apellido ?? m.lastname ?? ''}`.trim(),
          }));
        },
        error: (err) => console.error('❌ Error cargando médicos:', err),
      });
  }

  loadPersonas(): void {
    this.http.get<any[]>(this.apiPersonas, { headers: this.getSucursalHeaders() }).subscribe({
      next: (res) => {
        this.personas = (res || []).map((p) => ({
          id: p.id,
          nombre: `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim(),
        }));
      },
      error: (err) => console.error('❌ Error cargando personas:', err),
    });
  }

  // -------------------- Acciones --------------------
  calcularMontoBono(): void {
    const totalExamenes = 350; // temporal
    this.bono.montoBono = parseFloat(((this.bono.porcentaje / 100) * totalExamenes).toFixed(2));
  }

  guardarBono(): void {
    if (!this.bono.idMedico || !this.bono.idPersona) {
      alert('⚠️ Debes seleccionar un médico y un paciente.');
      return;
    }

    const headers = this.getSucursalHeaders();
    this.bono.nombreBono = `Bono ${this.bono.porcentaje}% Médico ${this.bono.idMedico}`;

    const payload = {
      idBono: this.bono.idBono ?? 0,
      idMedico: this.bono.idMedico,
      idPersona: this.bono.idPersona,
      nombreBono: this.bono.nombreBono,
      montoBono: this.bono.montoBono,
      porcentaje: this.bono.porcentaje,
      estado: this.bono.estado ?? 1,
      pagado: this.bono.pagado ?? false,
    };

    const req$ = this.bono.idBono
      ? this.http.put(`${this.apiBonos}/${this.bono.idBono}`, payload, { headers })
      : this.http.post(this.apiBonos, payload, { headers });

    req$.subscribe({
      next: () => {
        alert(this.bono.idBono ? '✏️ Bono actualizado' : '✅ Bono registrado correctamente');
        this.resetForm();
        this.loadBonos();
      },
      error: (err) => {
        console.error('❌ Error al guardar bono:', err);
        alert('❌ Ocurrió un error al guardar el bono.');
      },
    });
  }

  marcarComoPagado(bono: Bono): void {
    const headers = this.getSucursalHeaders();
    this.http.put(`${this.apiBonos}/${bono.idBono}/pagado`, {}, { headers }).subscribe({
      next: () => {
        alert('💰 Bono marcado como pagado.');
        this.loadBonos();
      },
      error: (err) => console.error('❌ Error al marcar como pagado:', err),
    });
  }

  editarBono(b: Bono): void {
    this.bono = { ...b };
  }

  eliminarBono(id: number): void {
    if (!confirm('¿Eliminar este bono permanentemente?')) return;
    this.http.delete(`${this.apiBonos}/${id}`, { headers: this.getSucursalHeaders() }).subscribe({
      next: () => {
        alert('🗑️ Bono eliminado correctamente');
        this.loadBonos();
      },
      error: (err) => console.error('❌ Error al eliminar bono:', err),
    });
  }

  resetForm(): void {
    this.bono = { nombreBono: '', porcentaje: 0, montoBono: 0 };
  }
}
