import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';
import { PagoService } from './pago.service';
import { PagoParcialComponent } from './pago-parcial.component';
import { Subscription } from 'rxjs';
import { env } from '../../core/env';

@Component({
  standalone: true,
  selector: 'form-pago',
  imports: [CommonModule, FormsModule, PagoParcialComponent],
  templateUrl: './form.html'
})
export class PagoFormComponent implements OnInit, OnDestroy {
  items: any[] = [];
  pacientes: any[] = [];
  model: any = {};
  editingId: number | null = null;
  loading = false;
  error = '';

  pacienteSeleccionado: any = null;
  examenesPendientes: any[] = [];
  totalPendiente = 0;

  private sucursalSub!: Subscription;

  constructor(private api: CrudService, private pagoService: PagoService) {}

  // ==========================================================
  //  CICLO DE VIDA
  // ==========================================================
  ngOnInit() {
    this.load();
    this.cargarPacientes();

    //  Recarga automática al cambiar sucursal
    this.sucursalSub = env.sucursalId.subscribe(id => {
      console.log('🏥 Cambio de sucursal detectado:', id);
      this.load();
      this.cargarPacientes();
    });
  }

  ngOnDestroy() {
    if (this.sucursalSub) this.sucursalSub.unsubscribe();
  }

  // ==========================================================
  //  CARGAR PAGOS
  // ==========================================================
  load() {
    this.loading = true;
    this.api.list<any>('pagos').subscribe({
      next: (res: any) => {
        const data: any[] = Array.isArray(res)
          ? res
          : (res.items ?? []);

        this.items = data.map((p: any) => ({
          id_pago: p.id_pago ?? p.id ?? 0,
          paciente: p.paciente ?? p.persona ?? '—',
          telefono: p.telefono ?? '—',
          monto_pagado: p.monto_pagado ?? p.monto ?? 0,
          concepto: p.concepto ?? '',
          id_tipo_pago: p.id_tipo_pago ?? 1,
          tipo_pago_nombre: p.tipo_pago_nombre ?? p.tipo_pago ?? '',
          fecha_generado: p.fecha_generado ?? p.fecha ?? null,
          fecha_pago: p.fecha_pago ?? null,
          nota: p.nota ?? '',
          estado: p.estado ?? ''
        }));

        this.loading = false;
      },
      error: (_) => {
        this.error = 'Error cargando datos';
        this.loading = false;
      }
    });
  }

  // ==========================================================
  //  CARGAR PACIENTES PARA EL SELECT (por sucursal activa)
  // ==========================================================
  cargarPacientes() {
    this.api.list<any>('personas').subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.items ?? []);
        this.pacientes = data.map((p: any) => ({
          id_persona: p.id_persona ?? p.id ?? 0,
          nombre: p.nombre ?? '',
          apellido: p.apellido ?? '',
          telefono: p.telefono ?? 'Sin teléfono',
          nombreCompleto: `${p.nombre ?? ''} ${p.apellido ?? ''} – ${p.telefono ?? 'Sin teléfono'}`.trim()
        }));
      },
      error: err => console.error('Error cargando pacientes:', err)
    });
  }

  // ==========================================================
  //  CRUD
  // ==========================================================
  edit(row: any) {
    this.model = { ...row };
    const idGuess = row.id ?? row.id_pago ?? row.id_persona ?? row.id_examen;
    this.editingId = idGuess ?? null;

    if (row.id_persona) {
      const paciente = this.pacientes.find(p => p.id_persona === row.id_persona);
      if (paciente) {
        this.model.id_persona = paciente.id_persona;
        this.model.paciente_nombre = `${paciente.nombre} ${paciente.apellido}`;
      }
    } else if (row.paciente) {
      const paciente = this.pacientes.find(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase() === row.paciente.toLowerCase()
      );
      if (paciente) {
        this.model.id_persona = paciente.id_persona;
        this.model.paciente_nombre = `${paciente.nombre} ${paciente.apellido}`;
      }
    }

    console.log('🧾 Editando pago:', this.model);
  }

  reset() {
    this.model = {};
    this.editingId = null;
    this.error = '';
  }

  save() {
    const id = this.editingId;
    const body = {
      montoPagado: this.model.monto_pagado,
      idTipoPago: this.model.id_tipo_pago,
      concepto: this.model.concepto,
      nota: this.model.nota,
      fechaPago: this.model.fecha_pago,
      estado: this.model.estado
    };

    if (!id) {
      alert('⚠️ Los pagos se generan automáticamente desde el módulo de Exámenes.\nAquí sólo se pueden editar o eliminar.');
      return;
    }

    this.loading = true;
    this.api.update<any>('pagos', id, body).subscribe({
      next: _ => {
        this.reset();
        this.load();
      },
      error: err => {
        console.error('❌ Error al guardar:', err);
        this.error = 'No se pudo guardar';
        this.loading = false;
      }
    });
  }

  // ==========================================================
  //  FUNCIONES DE PAGO
  // ==========================================================
  private recargarExamenes(idPersona: number) {
    this.api.list<any>(`examen?personaId=${idPersona}`).subscribe({
      next: data => {
        this.examenesPendientes = data.filter((x: any) => !x.id_pago);
        this.totalPendiente = this.examenesPendientes.reduce(
          (s, e) => s + (e.precio_aplicado || 0),
          0
        );
      },
      error: err => console.error('Error recargando exámenes:', err)
    });
  }

  pagarTodo(paciente: any) {
    if (!confirm(`¿Registrar pago total de los exámenes del paciente ${paciente.nombre}?`)) return;

    const body = {
      id_persona: paciente.id_persona,
      concepto: 'Pago total de exámenes',
      nota: 'Caja principal'
    };

    this.pagoService.pagarPaciente(body).subscribe({
      next: res => {
        alert(`✅ Pago total registrado: Q${res.total}`);
        this.load();
        this.recargarExamenes(paciente.id_persona);
      },
      error: err => {
        console.error(err);
        alert('❌ Error al registrar el pago.');
      }
    });
  }

  abrirPagoParcial(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.pagoService.resumen(paciente.id_persona).subscribe({
      next: res => {
        this.examenesPendientes = res.examenes;
        const modal = new (window as any).bootstrap.Modal(
          document.getElementById('pagoParcialModal')
        );
        modal.show();
      },
      error: err => {
        console.error(err);
        alert('❌ Error al cargar exámenes pendientes.');
      }
    });
  }

  delete(row: any) {
  if (!confirm(`¿Eliminar el pago #${row.id_pago}?`)) return;

  this.loading = true;

  this.api.remove<any>('pagos', row.id_pago).subscribe({
    next: () => {
      this.load();
      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Error al eliminar:', err);
      alert('No se pudo eliminar el pago.');
      this.loading = false;
    }
  });
}

}
