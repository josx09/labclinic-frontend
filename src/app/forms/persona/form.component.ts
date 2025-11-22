import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';
import { Router } from '@angular/router';
import { env } from '../../core/env';
import { Subscription } from 'rxjs';


type Direccion = {
  idMunicipio: number | null;
  calle?: string;
  numero?: string;
  zona?: string;
  referencia?: string;
};

type Persona = {
  id?: number;
  nombre: string;
  apellido: string;
  sexo?: string;
  telefono?: string;
  correo?: string;
  dpi?: string;
  fechaNacimiento?: string;
  observaciones?: string;
  estado?: number;
  tipoCliente?: number; 
  fechaRegistro?: string;
  direccion: Direccion;
  idUsuarioCliente?: number | null; 
};

@Component({
  standalone: true,
  selector: 'app-persona-form',
  templateUrl: './form.html',
  imports: [CommonModule, FormsModule],
})
export class PersonaFormComponent implements OnInit {
  private subSucursal?: Subscription;

  personas: Persona[] = [];
  personasFiltradas: Persona[] = [];
  persona: Persona = this.resetPersona();

  buscador = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';
  edad: { anios: number; meses: number; dias: number } | null = null;

  // 🔹 Paginación
  paginaActual = 1;
  registrosPorPagina = 10;
  totalPaginas = 1;

  readonly apiPersonas = `${environment.apiUrl}/personas`;
  readonly apiDepartamentos = `${environment.apiUrl}/departamentos`;
  readonly apiMunicipios = `${environment.apiUrl}/municipios`;
  readonly apiUsuarios = `${environment.apiUrl}/users/buscar`;


  cargando = false;
  departamentos: any[] = [];
  municipios: any[] = [];
  usuarios: any[] = []; //  nueva propiedad para los usuarios
  depSel: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

//  BÚSQUEDA DE USUARIOS CLIENTE (Autocompletado)

buscarUsuario = '';
usuariosFiltrados: any[] = [];
usuarioSeleccionado: any = null;
buscandoUsuario = false;

//  Buscar usuarios tipo cliente
buscarUsuariosCliente() {
  const term = this.buscarUsuario.trim();
  if (term.length < 2) {
    this.usuariosFiltrados = [];
    return;
  }

  this.buscandoUsuario = true;

  this.http.get<any[]>(`${this.apiUsuarios}?search=${term}`).subscribe({
    next: (res) => {
      this.usuariosFiltrados = res; //  ya vienen solo clientes desde backend
      this.buscandoUsuario = false;
    },
    error: (err) => {
      console.error('Error buscando usuarios cliente:', err);
      this.buscandoUsuario = false;
    },
  });
}


// Al seleccionar un usuario de la lista
seleccionarUsuario(u: any) {
  this.usuarioSeleccionado = u;
  this.persona.idUsuarioCliente = u.id;
  this.buscarUsuario = `${u.username} — ${u.firstname} ${u.lastname}`;
  this.usuariosFiltrados = [];
}

//  Para limpiar la selección
limpiarUsuario() {
  this.usuarioSeleccionado = null;
  this.persona.idUsuarioCliente = null;
  this.buscarUsuario = '';
}


  ngOnInit(): void {
    this.persona = this.resetPersona();
    this.loadDepartamentos();
    this.loadUsuarios();
    this.loadPersonas();

    this.subSucursal = env.sucursalChanged.subscribe(() => {
    this.loadPersonas();
  });
  }

  resetPersona(): Persona {
    return {
      nombre: '',
      apellido: '',
      sexo: '',
      telefono: '',
      correo: '',
      dpi: '',
      fechaNacimiento: '',
      observaciones: '',
      estado: 1,
      tipoCliente: 0,
      idUsuarioCliente: null,
      direccion: {
        idMunicipio: null,
        calle: '',
        numero: '',
        zona: '',
        referencia: '',
      },
    };
  }
loadUsuarios() {
    this.http.get<any[]>(this.apiUsuarios).subscribe({
      next: (res) => {
        // Filtra solo usuarios activos tipo cliente (type=1) o sin persona asignada
        this.usuarios = res.filter(
          (u) =>
            (u.type === 1 || u.type === 0) &&
            (!u.idPersona || u.idPersona === null)
        );
      },
      error: (err) => console.error('Error cargando usuarios:', err),
    });
  }
  //  Cargar personas
  loadPersonas() {
    this.http.get<Persona[]>(this.apiPersonas).subscribe({
      next: (res) => {
        this.personas = res;
        this.aplicarFiltros();
      },
      error: (err) => console.error('Error cargando personas:', err),
    });
  }

  //  Cargar departamentos
  loadDepartamentos() {
    this.http
      .get<{ total: number; items: any[] }>(`${this.apiDepartamentos}?page=1&pageSize=500`)
      .subscribe({
        next: (res) => (this.departamentos = res.items ?? []),
        error: (err) => console.error('Error cargando departamentos:', err),
      });
  }

  //  Cargar municipios al cambiar de departamento
  onDepartamentoChange() {
    if (this.depSel) {
      this.persona.direccion.idMunicipio = null;
      this.http.get<any[]>(`${this.apiMunicipios}/departamento/${this.depSel}`).subscribe({
        next: (res) => (this.municipios = res ?? []),
        error: (err) => console.error('Error cargando municipios:', err),
      });
    } else {
      this.municipios = [];
      this.persona.direccion.idMunicipio = null;
    }
  }

  //  Guardar o actualizar persona
  guardarPersona() {
    if (!this.validarFormulario()) return;
    this.cargando = true;

    const personaEnviar: Persona = { ...this.persona };

    //  Corrige si dirección viene como string
    if (typeof personaEnviar.direccion !== 'object') {
      personaEnviar.direccion = {
        idMunicipio: null,
        calle: '',
        numero: '',
        zona: '',
        referencia: '',
      };
    }

    //  Normaliza formato de fecha (yyyy-MM-dd)
    if (personaEnviar.fechaNacimiento) {
      const fecha = new Date(personaEnviar.fechaNacimiento);
      personaEnviar.fechaNacimiento = fecha.toISOString().split('T')[0];
    }

    const peticion = this.persona.id
      ? this.http.put(`${this.apiPersonas}/${this.persona.id}`, personaEnviar)
      : this.http.post(this.apiPersonas, personaEnviar);

    peticion.subscribe({
      next: () => {
        alert(this.persona.id ? '✏️ Persona actualizada' : '✅ Persona registrada');
        this.persona = this.resetPersona();
        this.edad = null;
        this.loadPersonas();
      },
      error: (err) => {
        console.error('Error al guardar persona:', err);
        alert('❌ Ocurrió un error al guardar la persona');
      },
      complete: () => (this.cargando = false),
    });
  }

  // Editar persona
  editarPersona(p: any) {
    const fechaRaw = p.fechaNacimiento ?? p.FechaNacimiento ?? '';
    const fechaFormateada = fechaRaw ? fechaRaw.split('T')[0] : '';

    this.persona = {
      ...p,
      fechaNacimiento: fechaFormateada,
      direccion:
        typeof p.direccion === 'object'
          ? { ...p.direccion }
          : { idMunicipio: null, calle: '', numero: '', zona: '', referencia: '' },
    };

    const idMun = this.persona.direccion?.idMunicipio;
    if (idMun) {
      this.http.get<any>(`${this.apiMunicipios}/${idMun}`).subscribe({
        next: (mun) => {
          this.depSel = mun.idDepartamento ?? null;
          if (this.depSel) {
            this.http.get<any[]>(`${this.apiMunicipios}/departamento/${this.depSel}`).subscribe({
              next: (res) => (this.municipios = res ?? []),
              error: (err) => console.error('Error cargando municipios:', err),
            });
          }
        },
        error: (err) => console.error('Error obteniendo municipio por id:', err),
      });
    } else {
      this.depSel = null;
      this.municipios = [];
    }

    this.calcularEdad();
  }

  // Validaciones
  esCorreoValido(correo?: string): boolean {
    if (!correo) return true;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo);
  }

  esDpiValido(dpi?: string): boolean {
    if (!dpi) return true;
    return /^\d{13}$/.test(dpi);
  }

  validarFormulario(): boolean {
    if (!this.persona.nombre.trim() || !this.persona.apellido.trim()) {
      alert('⚠️ Nombre y Apellido son obligatorios.');
      return false;
    }

    if (!this.esCorreoValido(this.persona.correo)) {
      alert('⚠️ Ingresa un correo válido.');
      return false;
    }

    if (!this.esDpiValido(this.persona.dpi)) {
      alert('⚠️ El DPI debe contener 13 dígitos.');
      return false;
    }

    return true;
  }

  aplicarFiltros() {
    const term = this.buscador.toLowerCase().trim();
    this.personasFiltradas = this.personas.filter((p) => {
      const coincideTexto =
        !term ||
        p.nombre?.toLowerCase().includes(term) ||
        p.apellido?.toLowerCase().includes(term) ||
        p.correo?.toLowerCase().includes(term) ||
        p.dpi?.toLowerCase().includes(term);
      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'activos' && p.estado === 1) ||
        (this.filtroEstado === 'inactivos' && p.estado === 0);
      return coincideTexto && coincideEstado;
    });
    this.calcularPaginacion();
  }

  calcularPaginacion() {
    this.totalPaginas = Math.ceil(this.personasFiltradas.length / this.registrosPorPagina);
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas || 1;
  }

  cambiarPagina(delta: number) {
    this.paginaActual = Math.min(Math.max(1, this.paginaActual + delta), this.totalPaginas);
  }

  get personasPaginaActual(): Persona[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.personasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  eliminarPersona(id: number) {
    if (!confirm('¿Eliminar esta persona permanentemente?')) return;
    this.http.delete(`${this.apiPersonas}/${id}?hard=true`).subscribe({
      next: () => {
        alert('🗑️ Persona eliminada correctamente');
        this.loadPersonas();
      },
      error: (err) => console.error('Error al eliminar persona:', err),
    });
  }

  calcularEdad(): void {
    if (!this.persona.fechaNacimiento) {
      this.edad = null;
      return;
    }
    const nacimiento = new Date(this.persona.fechaNacimiento);
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();
    if (dias < 0) {
      meses--;
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }
    if (meses < 0) {
      anios--;
      meses += 12;
    }
    this.edad = { anios, meses, dias };
  }

  getEdadTexto(): string {
    if (!this.edad) return '—';
    const { anios, meses, dias } = this.edad;
    return `${anios} años, ${meses} meses y ${dias} días`;
  }

  //  Devuelve el número máximo de registros mostrados en la página actual
  get maximoPaginado(): number {
    return Math.min(this.paginaActual * this.registrosPorPagina, this.personasFiltradas.length);
  }

  // Calcula edad textual para mostrar en tabla
  obtenerEdad(fechaNacimiento?: string): string {
    if (!fechaNacimiento) return '—';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (dias < 0) {
      meses--;
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }
    if (meses < 0) {
      anios--;
      meses += 12;
    }

    return `${anios} años, ${meses} meses, ${dias} días`;
  }
    //  Función usada en *ngFor para mejorar el rendimiento de renderizado
  trackById(index: number, item: any): number {
    return item.id ?? index;
  }

  //  Redirección al historial clínico del paciente
verHistorial(id: number) {
  if (!id) {
    console.warn('⚠️ No se recibió un ID válido para el historial');
    return;
  }

  console.log('🧾 Navegando al historial del paciente con ID:', id);
  this.router.navigate(['/historial', id]);
}

ngOnDestroy(): void {
  this.subSucursal?.unsubscribe();
}

}
