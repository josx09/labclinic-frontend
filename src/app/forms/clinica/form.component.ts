import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment, env } from '../../core/env';
import { Subscription } from 'rxjs';

type Clinica = {
  id: number;
  nombre: string;
  telefono?: string | null;
  contacto?: string | null;
  direccion?: string | null;
  estado: boolean;
};

@Component({
  standalone: true,
  selector: 'app-clinicas',
  templateUrl: './form.component.html',
  imports: [CommonModule, FormsModule],
})
export class ClinicaComponent implements OnInit, OnDestroy {
  clinicas: Clinica[] = [];
  nuevaClinica: Partial<Clinica> = {
    nombre: '',
    telefono: '',
    contacto: '',
    direccion: '',
    estado: true,
  };

  modoEdicion = false;
  clinicaSeleccionada: Clinica | null = null;

  readonly apiUrl = `${environment.apiUrl}/clinicas`;

  private subSucursal!: Subscription; // 👈 suscripción al cambio de sucursal

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarClinicas();

    //  Se activa cada vez que cambias de sucursal desde el selector global
    this.subSucursal = env.sucursalId.subscribe(id => {
      console.log('🌍 Cambio detectado de sucursal:', id);
      this.cargarClinicas(); // recargar automáticamente
    });
  }

  ngOnDestroy(): void {
    if (this.subSucursal) this.subSucursal.unsubscribe();
  }

  //  Cargar todas las clínicas (filtradas por sucursal activa)
  cargarClinicas() {
    this.http.get<Clinica[]>(this.apiUrl).subscribe({
      next: (res) => {
        console.log('✅ Clínicas cargadas:', res);
        this.clinicas = res;
      },
      error: (err) => {
        console.error('❌ Error al cargar clínicas:', err);
        this.clinicas = [];
      },
    });
  }

  //  Crear o actualizar
  guardarClinica() {
    if (!this.nuevaClinica.nombre?.trim()) {
      alert('⚠️ El nombre de la clínica es obligatorio');
      return;
    }

    if (this.modoEdicion && this.clinicaSeleccionada) {
      // Actualizar
      this.http
        .put(`${this.apiUrl}/${this.clinicaSeleccionada.id}`, this.nuevaClinica)
        .subscribe({
          next: () => {
            alert('✏️ Clínica actualizada correctamente');
            this.resetForm();
            this.cargarClinicas();
          },
          error: (err) => console.error('Error al actualizar clínica:', err),
        });
    } else {
      // Crear nueva
      this.http.post(this.apiUrl, this.nuevaClinica).subscribe({
        next: () => {
          alert('✅ Clínica registrada correctamente');
          this.resetForm();
          this.cargarClinicas();
        },
        error: (err) => console.error('Error al registrar clínica:', err),
      });
    }
  }

  //  Editar
  editarClinica(c: Clinica) {
    this.modoEdicion = true;
    this.clinicaSeleccionada = c;
    this.nuevaClinica = { ...c };
  }

  //  Eliminar
  eliminarClinica(c: Clinica) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente la clínica "${c.nombre}"? Esta acción no se puede deshacer.`))
      return;

    this.http.delete(`${this.apiUrl}/${c.id}?hard=true`).subscribe({
      next: () => {
        alert('🗑️ Clínica eliminada permanentemente');
        this.cargarClinicas();
      },
      error: (err) => {
        console.error('Error al eliminar clínica:', err);
        alert('❌ No se pudo eliminar la clínica');
      },
    });
  }

  //  Limpiar formulario
  resetForm() {
    this.nuevaClinica = {
      nombre: '',
      telefono: '',
      contacto: '',
      direccion: '',
      estado: true,
    };
    this.modoEdicion = false;
    this.clinicaSeleccionada = null;
  }
}
