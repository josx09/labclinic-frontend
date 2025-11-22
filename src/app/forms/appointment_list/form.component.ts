import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';

@Component({
  standalone: true,
  selector: 'form-appointment_list',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html'
})
export class AppointmentListFormComponent {
  items: any[] = [];
  model: any = {};
  editingId: number | null = null;
  loading = false;
  error = '';

  constructor(private api: CrudService) { this.load(); }

  load() {
    this.loading = true;
    this.api.list<any>('appointment_list').subscribe({
      next: d => { this.items = d; this.loading = false; },
      error: _ => { this.error = 'Error cargando datos'; this.loading = false; }
    });
  }

  edit(row: any) {
    this.model = { ...row };
    const idGuess = row.id ?? row.id_appointment ?? row.id_appointment_list ?? row.id_persona ?? row.id_cargo ?? row.id_insumo ?? row.id_examen ?? row.id_pago ?? row.id_cita ?? row.id_fecha ?? row.id_registro ?? row.idMunicipio ?? row.idDepartamento ?? row.id_rol;
    this.editingId = idGuess ?? null;
  }

  reset() { this.model = {}; this.editingId = null; this.error=''; }

  save() {
    const id = this.editingId;
    const body = this.model;
    this.loading = true;
    const obs = id ? this.api.update<any>('appointment_list', id, body) : this.api.create<any>('appointment_list', body);
    obs.subscribe({
      next: _ => { this.reset(); this.load(); },
      error: _ => { this.error = 'No se pudo guardar'; this.loading = false; }
    });
  }
}
