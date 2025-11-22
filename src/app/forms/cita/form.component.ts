import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { env } from '../../core/env';

@Component({
  standalone: true,
  selector: 'form-cita',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html'
})
export class CitaFormComponent implements OnInit, OnDestroy {

  isCliente = false;
  nombreCliente = '';
  idPersonaCliente: number | null = null;

  items: any[] = [];
  pacientes: any[] = [];
  medicos: any[] = [];

  model = {
    id: null as number | null,
    id_paciente: null as number | null,
    id_medico: null as number | null,
    fecha: '',
    estado_cita: 1
  };

  editingId: number | null = null;
  loading = false;
  error = '';
  successMessage = '';

  deleteId: number | null = null;
  showDeleteModal = false;

  private sucursalSub!: Subscription;

  constructor(private api: CrudService, private auth: AuthService) {}


  //  Inicialización

  ngOnInit() {
    // Cargar catálogos base
    this.loadPacientes();
    this.loadMedicos();

    // Detectar si el usuario actual es cliente
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    this.isCliente = rol === 'cliente';

    if (this.isCliente) {
      this.nombreCliente = localStorage.getItem('name') || '';
      this.idPersonaCliente = Number(localStorage.getItem('idPersona')) || null;

      if (this.idPersonaCliente) {
        this.model.id_paciente = this.idPersonaCliente;
      }
    }

    // Escuchar cambios de sucursal (incluye la inicial)
    this.sucursalSub = env.sucursalId.subscribe(id => {
      console.log('🏥 Cambio de sucursal detectado:', id);
      this.load();
    });
  }

  ngOnDestroy() {
    if (this.sucursalSub) this.sucursalSub.unsubscribe();
  }


  //  Normalización y mapeo

  private normalizeCita(c: any) {
    return {
      id: c.id ?? c.id_cita ?? c.Id ?? null,
      id_paciente: c.id_paciente ?? c.IdPaciente ?? c.idPaciente ?? null,
      id_medico: c.id_medico ?? c.IdMedico ?? c.idMedico ?? null,
      fecha: c.fecha ?? c.Fecha ?? '',
      estado_cita:
        c.estado_cita !== undefined && c.estado_cita !== null
          ? Number(c.estado_cita)
          : c.EstadoCita !== undefined && c.EstadoCita !== null
          ? Number(c.EstadoCita)
          : 1
    };
  }

  private mapForView(c: any) {
    const cita = this.normalizeCita(c);

    const backendPac = (c.paciente_nombre ?? '').toString().trim();
    const backendMed = (c.medico_nombre ?? '').toString().trim();

    const paciente = this.pacientes.find(
      p => (p.id_persona ?? p.id ?? p.IdPersona) === cita.id_paciente
    );
    const medico = this.medicos.find(
      m => (m.id ?? m.Id ?? m.IdMedico) === cita.id_medico
    );

    const pacNom = paciente
      ? `${paciente.nombre ?? paciente.Nombre ?? ''} ${paciente.apellido ?? paciente.Apellido ?? ''}`.trim()
      : backendPac;

    const medNom = medico
      ? `${medico.nombre ?? medico.Nombre ?? ''} ${medico.apellido ?? medico.Apellido ?? ''}`.trim()
      : backendMed;

    return { ...cita, PacienteNombre: pacNom, MedicoNombre: medNom };
  }


  //  Cargar datos

  load() {
    this.loading = true;
    if (this.isCliente) {
      //  Si es cliente, obtiene sus propias citas
      this.api.get<any[]>('citas/mias').subscribe({
        next: (res) => {
          this.items = res.map((c: any) => this.mapForView(c));
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando citas del cliente:', err);
          this.items = [];
          this.loading = false;
        }
      });
    } else {
      //  Admin / Usuario general
      this.api.list<any>('citas', { Page: 1, PageSize: 100 }).subscribe({
        next: (d: any) => {
          const arr = Array.isArray(d) ? d : (d?.items ?? []);
          this.items = arr.map((c: any) => this.mapForView(c));
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando citas', err);
          this.items = [];
          this.loading = false;
        }
      });
    }
  }

  loadPacientes() {
    this.api.list<any>('personas').subscribe({
      next: d => {
        this.pacientes = (Array.isArray(d) ? d : []).map((p: any) => ({
          id_persona: p.id_persona ?? p.id ?? p.IdPersona ?? null,
          nombre: p.nombre ?? p.Nombre ?? '',
          apellido: p.apellido ?? p.Apellido ?? ''
        }));
        // Reasigna nombres en items ya cargados
        this.items = this.items.map((r: any) => this.mapForView(r));
      },
      error: _ => (this.error = 'Error cargando pacientes')
    });
  }

  loadMedicos() {
    this.api.list<any>('users/medicos').subscribe({
      next: d => {
        this.medicos = d || [];
        this.items = this.items.map((r: any) => this.mapForView(r));
      },
      error: e => {
        console.error('Error al cargar médicos', e);
        this.error = 'Error cargando médicos';
      }
    });
  }


  //  CRUD Básico

  edit(row: any) {
    const cita = this.normalizeCita(row);
    this.model = {
      id: cita.id,
      id_paciente: cita.id_paciente,
      id_medico: cita.id_medico,
      fecha: cita.fecha ? String(cita.fecha).split('T')[0] : '',
      estado_cita: cita.estado_cita
    };
    this.editingId = cita.id;
  }

  reset() {
    this.model = { id: null, id_paciente: null, id_medico: null, fecha: '', estado_cita: 1 };
    this.editingId = null;
    this.error = '';
    this.successMessage = '';
  }

  save() {
    console.log('DEBUG model antes de guardar:', this.model);
    this.error = '';

    if (this.isCliente && (!this.idPersonaCliente || this.idPersonaCliente <= 0)) {
      this.model.id_paciente = null;
    } else if (this.isCliente && this.idPersonaCliente) {
      this.model.id_paciente = this.idPersonaCliente;
    }

    const fechaValida = this.model.fecha?.trim()?.length >= 8;
    if (!fechaValida) {
      this.error = 'Debe seleccionar una fecha válida';
      return;
    }

    const payload = {
      Id: this.editingId ?? 0,
      IdPaciente: this.model.id_paciente,
      IdMedico: this.model.id_medico ? Number(this.model.id_medico) : null,
      Fecha: this.model.fecha,
      EstadoCita: Number(this.model.estado_cita)
    };

    console.log('Payload final enviado:', payload);

    const obs = this.editingId
      ? this.api.update<any>('citas', this.editingId, payload)
      : this.api.create<any>('citas', payload);

    obs.subscribe({
      next: (resp) => {
        console.log('Respuesta del backend:', resp);
        this.editingId = null;
        this.reset();
        this.load();
        this.successMessage = '✅ Cita guardada correctamente';
        setTimeout(() => (this.successMessage = ''), 2500);
      },
      error: (e) => {
        console.error('No se pudo guardar', e);
        this.error = 'No se pudo guardar';
      }
    });
  }

  confirmRemove(id: number) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  cancelRemove() {
    this.deleteId = null;
    this.showDeleteModal = false;
  }

  remove() {
    if (!this.deleteId) return;
    this.loading = true;

    this.api.remove<any>('citas', this.deleteId).subscribe({
      next: () => {
        console.log(`Cita ${this.deleteId} eliminada`);
        this.deleteId = null;
        this.showDeleteModal = false;
        this.successMessage = '🗑️ Cita eliminada correctamente';
        this.load();
        this.loading = false;
        setTimeout(() => (this.successMessage = ''), 2500);
      },
      error: err => {
        console.error('delete cita', err);
        this.error = 'No se pudo eliminar';
        this.loading = false;
      }
    });
  }
}
