import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';
import { CrudService } from '../../core/crud.service';
import { PagoService } from '../pago/pago.service';  
import { PagoParcialComponent } from '../pago/pago-parcial.component'; 
import Swal from 'sweetalert2';
import { GrupoExamenService } from './grupo-examen.service';
import { HttpHeaders } from '@angular/common/http';
import { env } from '../../core/env';


type Persona = {
  id: number;
  nombre: string;
  apellido: string;
  sexo?: string;
  telefono?: string;
  correo?: string;
  estado?: number;
  dpi?: string;
  fechaRegistro?: string;
};

type TipoExamen = { id: number; nombre: string };
type PerfilExamen = { id: number; nombre: string; precioPaquete?: number };


type ExamenRow = {
  id: number;
  id_pago?: number | null;
  resultado?: string | null;
  estado: number;
  tipoExamen?: { id: number; nombre: string } | null;
  hasParametros: boolean;
  fechaRegistro?: string;
  precio?: number;
  grupo_examen?: string | null; 
  _showParametros?: boolean;
  _parametros?: ParametroEx[];
  _selected?: boolean;
};

type ParametroEx = {
  id: number;
  nombre: string;
  unidad?: string | null;
  rangoReferencia?: string | null;
  resultado?: string | null;
  observaciones?: string | null;
};


type GrupoResumen = {
  grupo: string;            
  fecha: string;              
  total?: number;              
  cantidad?: number;           
  paciente?: string;          
};



@Component({
  standalone: true,
  templateUrl: './examen.component.html',
  imports: [CommonModule, FormsModule, PagoParcialComponent],
})
export class ExamenComponent implements OnInit {


  //  Control de permisos según rol
esMedico: boolean = false;
  personas: Persona[] = [];
  tipos: TipoExamen[] = [];
  perfiles: PerfilExamen[] = [];
  clinicas: Array<{ id: number; nombre: string }> = [];
    medicos: Array<{ id: number; nombre: string }> = []; //  lista de médicos referidores
    //  Referidor (buscador en la vista)
  busquedaReferidor: string = '';
  resultadosReferidores: any[] = [];
  selectedReferidor: any = null;
  busquedaReferidorTimer: any = null;
  mostrarListaMedicos: boolean = false; // 



  //  selección del panel
  selectedPersona: Persona | null = null;
  examenesPorPersona: { [idPersona: number]: ExamenRow[] } = {};

  //  Grupo/Visita (NUEVO)
  ultimoGrupo: string | null = null; 
  gruposPrevios: GrupoResumen[] = []; 
  autoAgruparActivo: boolean = true;  
  etiquetaGrupoActual: string = '';   
  fechaGrupoActual: string = '';      
  contadorExamenesGrupoActual: number = 0; 

  //  Control del colapsado por grupo
expandedGroups: Record<string, boolean> = {};
gruposCache: Array<{ 
  grupo: string; 
  fecha: string; 
  nombreGrupo?: string; //  agregado
  cantidad: number; 
  total: number; 
  totalPendiente: number;  
  examenes: ExamenRow[];
}> = [];




  //  creación/edición de examen
    //  creación/edición de examen
  nuevo = {
    id_tipo_examen: 0,
    id_perfil_examen: 0,
    id_clinica: null as number | null,
    id_referidor: null as number | null,  //  médico que refiere al paciente
    usar_precio_clinica: false,
    resultado: ''
  };


  //  Parámetros plantilla por tipo
  plantillaParametros: Array<{
    id: number;
    nombre: string;
    unidad?: string;
    rangoReferencia?: string;
  }> = [];

  //  Filtro (pestañas) de personas
  filtroEstado: 'activos' | 'inactivos' = 'activos';

  //  API endpoints
  readonly apiExamenes = `${environment.apiUrl}/examenes`;
  readonly apiPersonas = `${environment.apiUrl}/personas`;
  readonly apiTipos = `${environment.apiUrl}/tipos-examen`;
  readonly apiPerfiles = `${environment.apiUrl}/perfilesexamen/list`;
  readonly apiPlantilla = `${environment.apiUrl}/parametros-tipo-examen`;
  readonly apiClinicas = `${environment.apiUrl}/clinicas`;

  //  Pagos
  pacienteSeleccionado: any = null;
  examenesPendientes: any[] = [];
  historialPagos: any[] = [];

  //  Búsqueda rápida de tipos de examen
  busquedaExamen: string = '';
  resultadosExamenes: any[] = [];
  busquedaTimer: any = null;

  
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private api: CrudService,
    private pagoService: PagoService,
    private grupoService: GrupoExamenService
  ) {}

  
  ngOnInit(): void {
  this.loadTipos();
  this.loadPerfiles();
  this.loadClinicas();
  //this.loadMedicos();

  // Escucha evento global al confirmar pago parcial
  window.addEventListener('pagoParcialConfirmado', (e: any) => {
    const idPersona = e.detail;
    if (this.selectedPersona && this.selectedPersona.id === idPersona) {
      this.verExamenes(this.selectedPersona);
    }
  });

  // Inicializa dropdowns Bootstrap
  setTimeout(() => {
    try {
      const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
      dropdownElements.forEach((el: any) => {
        new (window as any).bootstrap.Dropdown(el);
      });
    } catch (e) {
      console.warn('⚠️ No se pudieron inicializar los dropdowns de Bootstrap:', e);
    }
  }, 800);

  // Cierra dropdowns externos
  document.addEventListener('click', (event: any) => {
    const dropdown = document.querySelector('.position-relative');
    if (dropdown && !dropdown.contains(event.target)) {
      this.mostrarGrupos = false;
      this.cdr.detectChanges();
    }
  });

  //  Detectar rol desde localStorage
  const rol = (localStorage.getItem('rol') || '').toLowerCase();
  const idPersona = Number(localStorage.getItem('idPersona')) || 0;

  console.log('🧩 Rol detectado:', rol, '| ID Persona:', idPersona);

  this.esMedico = rol.includes('médico') || rol.includes('medico');

  if (this.esMedico) {
    console.log('👨‍⚕️ Usuario médico: cargando solo pacientes referidos');
    this.loadPacientesReferidos();
  } else {
    console.log('👤 Usuario no médico: cargando todos los pacientes');
    this.loadPersonas();
  }

  //  Escuchar cambios de sucursal (actualización automática)

env.sucursalChanged.subscribe((idSucursal: number) => {
  console.log('🏥 Cambio de sucursal detectado →', idSucursal);

  // Limpia cachés y selecciones previas
  this.selectedPersona = null;
  this.examenesPorPersona = {};
  this.gruposCache = [];
  this.personas = [];
  this.personasFiltradas = [];
  this.cdr.detectChanges();

  //  Activa el indicador visual
  this.cargandoSucursal = true;

  // Recarga catálogos base (siempre cambian por sucursal)
  this.loadTipos();
  this.loadPerfiles();
  this.loadClinicas();

  // Recarga pacientes según el rol
  if (this.esMedico) {
    this.loadPacientesReferidos();
  } else {
    this.loadPersonas();
  }

  //  5️ Apaga el indicador de carga
  setTimeout(() => {
    this.cargandoSucursal = false;
    this.cdr.detectChanges();
  }, 1200);
});

// 🔹 Cerrar dropdown de médicos al hacer clic fuera
document.addEventListener('click', (e: any) => {
  const target = e.target as HTMLElement;
  const contenedor = document.querySelector('.campo-medico-ref');
  if (contenedor && !contenedor.contains(target)) {
    this.mostrarListaMedicos = false;
    this.cdr.detectChanges();
  }
});


}

  private normalizarEstadoPersona(p: any): number {
    if (typeof p.estado === 'number') return p.estado;
    if (typeof p.estado === 'boolean') return p.estado ? 1 : 0;
    if (typeof p.activo === 'number') return p.activo;
    if (typeof p.activo === 'boolean') return p.activo ? 1 : 0;
    return 1; // por defecto activo
  }

 
  private fmtFecha(iso?: string | null): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return String(iso);
    }
  }

  private actualizarEtiquetaGrupoActual() {
    if (!this.ultimoGrupo) {
      this.etiquetaGrupoActual = '';
      this.fechaGrupoActual = '';
      this.contadorExamenesGrupoActual = 0;
      return;
    }
    const fecha = this.fechaGrupoActual ? this.fmtFecha(this.fechaGrupoActual) : '';
    this.etiquetaGrupoActual = `Visita (${this.ultimoGrupo.slice(0, 8)}) ${fecha ? '— ' + fecha : ''}`;
    // contador calculado desde exámenes
    if (this.selectedPersona) {
      const exs = this.examenesPorPersona[this.selectedPersona.id] ?? [];
      this.contadorExamenesGrupoActual = exs.filter(x => x.grupo_examen === this.ultimoGrupo).length;
    } else {
      this.contadorExamenesGrupoActual = 0;
    }
  }


  private syncFechaDeGrupoActual() {
    if (!this.ultimoGrupo) return;
    const g = this.gruposPrevios.find(x => x.grupo === this.ultimoGrupo);
    if (g) this.fechaGrupoActual = g.fecha;
    this.actualizarEtiquetaGrupoActual();
  }


  private sumaPrecios(rows: ExamenRow[]): number {
    return rows.reduce((acc, e) => acc + (Number(e.precio ?? 0) || 0), 0);
  }

  private esUuidPosible(s: string | null | undefined): boolean {
    if (!s) return false;
    return /^[0-9a-fA-F-]{8,}$/.test(s);
  }

  
  loadPersonas() {

  this.api.list<any>('personas').subscribe({
    next: (res) => {
      const persons: any[] = Array.isArray(res)
        ? res
        : ((res as any)?.items ?? []);

      const normalizadas: Persona[] = persons.map((p: any) => ({
        id: p.id ?? p.id_persona ?? p.personaId ?? 0,
        nombre: p.nombre ?? '',
        apellido: p.apellido ?? '',
        sexo: p.sexo,
        telefono: p.telefono,
        correo: p.correo ?? p.email,
        estado: this.normalizarEstadoPersona(p),
        fechaRegistro: p.fechaRegistro ?? p.createdAt ?? p.fecha_registro,
        //  Intentamos detectar si viene del backend una fecha de última visita
        fechaUltimaVisita: p.fecha_ultima_visita ?? p.fechaUltimaVisita ?? null,
      }));

      //  Filtramos según el estado actual
      this.personas =
        this.filtroEstado === 'activos'
          ? normalizadas.filter((p) => (p.estado ?? 1) === 1)
          : normalizadas.filter((p) => (p.estado ?? 1) === 0);

      //  Ordenamos: más recientes primero
      this.personas.sort((a: any, b: any) => {
        const fechaA = new Date(a.fechaUltimaVisita || a.fechaRegistro || 0).getTime();
        const fechaB = new Date(b.fechaUltimaVisita || b.fechaRegistro || 0).getTime();
        return fechaB - fechaA;
      });

      this.personasFiltradas = [...this.personas]; // inicializa la lista mostrada

      console.log('📋 Personas cargadas para sucursal:',
        localStorage.getItem('id_sucursal'), '=>', this.personas.length);
    },
    error: (err) => console.error('❌ Error cargando personas:', err),
  });
}



  cambiarFiltro(estado: 'activos' | 'inactivos') {
    this.filtroEstado = estado;
    this.selectedPersona = null;
    this.loadPersonas();
  }


  loadClinicas() {

  this.api.list<any>('clinicas').subscribe({
    next: (res) => {
 
      const lista = Array.isArray(res)
        ? res
        : ((res as any)?.items ?? []);

      this.clinicas = lista.filter(
        (c: any) => c.estado === true || c.activo === 1 || c.estado === 1
      );

      console.log('🏥 Clínicas cargadas para sucursal:',
        localStorage.getItem('id_sucursal'),
        '→', this.clinicas.length);
    },
    error: (err) => console.error('❌ Error cargando clínicas:', err),
  });
}

loadMedicos(term: string = '') {
  this.http.get<any[]>(`${environment.apiUrl}/users/medicos`)
    .subscribe({
      next: (res: any[]) => {
        // Filtramos localmente por el término buscado (si el backend devuelve todos los médicos)
        const arr = term
          ? res.filter(m =>
              (`${m.nombre} ${m.apellido}`.toLowerCase().includes(term.toLowerCase()))
            )
          : res;

        this.resultadosReferidores = arr.map((m: any) => ({
          id: m.id ?? 0,
          nombre: m.nombre ?? '',
          apellido: m.apellido ?? '',
          username: m.username ?? ''
        }));
      },
      error: (err) => {
        console.error('❌ Error al cargar médicos:', err);
        this.resultadosReferidores = [];
      }
    });
}

loadPacientesReferidos() {
  // Recupera token (algunos logins lo guardan como 'authToken')
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (!token) {
    console.warn('⚠️ No se encontró token de autenticación, abortando carga de pacientes.');
    Swal.fire('Error', 'No se encontró sesión válida. Vuelve a iniciar sesión.', 'error');
    return;
  }

  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.get<any[]>(`${environment.apiUrl}/examenes/por-paciente`, { headers }).subscribe({
    next: (res) => {
      console.log('✅ Pacientes referidos obtenidos del backend:', res);

      this.personas = (res ?? []).map((p: any) => ({
        id: p.idPersona ?? p.id ?? 0,
        nombre: p.paciente?.split(' ')[0] ?? '',
        apellido: p.paciente?.split(' ').slice(1).join(' ') ?? '',
        correo: p.correo ?? '',
        telefono: p.telefono ?? '',
        estado: 1,
        fechaRegistro: p.fechaRegistro ?? ''
      }));

      this.personasFiltradas = [...this.personas];

      //  Si no hay pacientes, muestra aviso visual
      if (!this.personas.length) {
        Swal.fire({
          icon: 'info',
          title: 'Sin pacientes referidos',
          text: 'Actualmente no tienes pacientes asignados con exámenes referidos.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    },
    error: (err) => {
      console.error('❌ Error cargando pacientes referidos:', err);
      Swal.fire('Error', 'No se pudieron cargar los pacientes referidos.', 'error');
    }
  });
}

loadTipos() {
  this.api.list<any>('tipos-examen').subscribe({
    next: (res) => {
      this.tipos = Array.isArray(res)
        ? res
        : ((res as any)?.items ?? []);
      console.log(
        '🧬 Tipos de examen cargados para sucursal:',
        localStorage.getItem('id_sucursal'),
        '→', this.tipos.length
      );
    },
    error: (err) => console.error('❌ Error cargando tipos de examen:', err),
  });
}

loadPerfiles() {
  this.api.list<any>('perfilesexamen/list').subscribe({
    next: (res) => {
      this.perfiles = Array.isArray(res)
        ? res
        : ((res as any)?.items ?? []);
      console.log(
        '🧩 Perfiles de examen cargados para sucursal:',
        localStorage.getItem('id_sucursal'),
        '→', this.perfiles.length
      );
    },
    error: (err) => console.error('❌ Error cargando perfiles de examen:', err),
  });
}

  verExamenes(p: Persona) {
  this.selectedPersona = p;
  this.nuevo = {
  id_tipo_examen: 0,
  id_perfil_examen: 0,
  id_clinica: null,
  usar_precio_clinica: false,
  resultado: '',
  id_referidor: this.selectedReferidor?.id ?? this.selectedReferidor?.id_persona ?? null
};

  this.plantillaParametros = [];

  //  Cargar primero los grupos previos
  this.cargarGruposPaciente();

  //  Cargar exámenes
  this.http.get<any>(`${this.apiExamenes}/paciente/${p.id}`).subscribe({
    next: (res) => {
      const rows: ExamenRow[] = Array.isArray(res) ? res : (res?.items ?? []);

      rows.forEach((x) => {
        x.precio = Number(x.precio ?? 0);
        x._selected = false;
        x._showParametros = false;
        x.grupo_examen = (x.grupo_examen ?? '').toLowerCase();
      });

      this.examenesPorPersona[p.id] = rows;

      //  Generar grupos locales
      const grupos = new Map<string, ExamenRow[]>();
      for (const e of rows) {
        const grupo = e.grupo_examen || 'sin-grupo';
        if (!grupos.has(grupo)) grupos.set(grupo, []);
        grupos.get(grupo)!.push(e);
      }

      this.gruposCache = Array.from(grupos.entries()).map(([grupo, examenes]) => {
        const total = examenes.reduce((acc, x) => acc + (x.precio ?? 0), 0);
        const totalPendiente = examenes
          .filter(x => !x.id_pago || x.id_pago === null)
          .reduce((acc, x) => acc + (x.precio ?? 0), 0);
        const fecha = examenes[0]?.fechaRegistro ?? new Date().toISOString();

        const fechaObj = new Date(fecha);
        const fechaFmt = fechaObj.toLocaleDateString('es-GT', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        const horaFmt = fechaObj.toLocaleTimeString('es-GT', {
          hour: '2-digit', minute: '2-digit'
        });

        return {
          grupo,
          fecha,
          nombreGrupo: `Visita del ${fechaFmt} – ${horaFmt}`,
          examenes,
          cantidad: examenes.length,
          total,
          totalPendiente
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      //  Inicializar colapsado
      this.expandedGroups = {};
      this.gruposCache.forEach(g => this.expandedGroups[g.grupo] = false);

      //  Restaurar grupo activo de localStorage (si pertenece a este paciente)
      const ultimoGuardado = localStorage.getItem('ultimoGrupo');
      const personaGuardada = localStorage.getItem('ultimoGrupoPersona');

      if (ultimoGuardado && personaGuardada === p.id.toString()) {
        this.ultimoGrupo = ultimoGuardado;
        this.expandedGroups[this.ultimoGrupo] = true;
        this.syncFechaDeGrupoActual();
        console.log('♻️ Grupo restaurado desde localStorage:', this.ultimoGrupo);
      } else {
        this.ultimoGrupo = null; // Limpia si es otro paciente
      }

      //  Refresca UI
      this.cdr.detectChanges();
      console.log(`✅ ${rows.length} exámenes cargados para ${p.nombre}`);
    },
    error: (err) => {
      console.error('❌ Error cargando exámenes:', err);
      this.gruposCache = [];
      this.cdr.detectChanges();
    },
  });
}



//  Alternar colapsado del grupo
toggleGrupo(id: string) {
  this.expandedGroups[id] = !this.expandedGroups[id];
}

//  Optimización de *ngFor
trackGrupo(index: number, item: any) {
  return item.grupo;
}

trackExamen(index: number, item: any) {
  return item.id;
}


  obtenerTotalPendiente(idPersona: number): number {
    const examenes = this.examenesPorPersona[idPersona] ?? [];
    if (!examenes.length) return 0;
    return examenes
      .filter(e => e.estado === 1 && (!e.id_pago || e.id_pago === null))
      .reduce((sum, e) => sum + (e.precio || 0), 0);
  }


 buscarExamen() {
  const term = this.busquedaExamen.trim();
  if (term.length < 2) {
    this.resultadosExamenes = [];
    return;
  }

  

  clearTimeout(this.busquedaTimer);
  this.busquedaTimer = setTimeout(() => {
    //  CrudService.list devuelve un ARRAY plano en tu backend
    this.api.list<any>('tipos-examen', { search: term, pageSize: 10 })
      .subscribe({
        next: (res) => { this.resultadosExamenes = Array.isArray(res) ? res : []; },
        error: () => { this.resultadosExamenes = []; }
      });
  }, 300);
}

//  Buscar médico referidor (autosuggest)
buscarReferidor() {
  const term = this.busquedaReferidor?.trim().toLowerCase() ?? '';
  if (term.length < 2) {
    this.resultadosReferidores = [];
    return;
  }

  //  Consumimos directamente el endpoint del backend que devuelve médicos
  this.http.get<any[]>(`${environment.apiUrl}/users/medicos`).subscribe({
    next: (res: any[]) => {
      // 🔍 Si el backend devuelve todos los médicos, filtramos localmente por coincidencia
      this.resultadosReferidores = res.filter((m) =>
        (`${m.nombre} ${m.apellido}`.toLowerCase().includes(term))
      );
    },
    error: (err) => {
      console.error('❌ Error al buscar médicos referidores:', err);
      this.resultadosReferidores = [];
    }
  });
}


seleccionarReferidor(m: any) {
  this.selectedReferidor = m;
  this.nuevo.id_referidor = m?.id ?? m?.id_persona ?? null; // ✅ Guardar el ID del médico
  this.busquedaReferidor = `${m?.nombre ?? ''} ${m?.apellido ?? ''}`.trim();
  this.resultadosReferidores = [];
}



//  Limpiar selección
limpiarReferidor() {
  this.selectedReferidor = null;
  this.nuevo.id_referidor = null;
  this.busquedaReferidor = '';
  this.resultadosReferidores = [];
}
// 🔹 Alternar lista de médicos (dropdown manual)
toggleListaMedicos(event: MouseEvent) {
  event.stopPropagation();
  this.mostrarListaMedicos = !this.mostrarListaMedicos;

  // Si se abre el menú y la lista está vacía, carga los médicos
  if (this.mostrarListaMedicos && this.resultadosReferidores.length === 0) {
    this.loadMedicos();
  }
}



aplicarReferidorAGrupo() {
  if (!this.ultimoGrupo) {
    Swal.fire('Aviso', 'No hay una visita/grupo activo.', 'info'); return;
  }
  if (!this.selectedReferidor) {
    Swal.fire('Aviso', 'Selecciona un médico referidor primero.', 'info'); return;
  }

  const idRef = this.selectedReferidor?.id ?? this.selectedReferidor?.id_persona ?? null;
  if (!idRef) { Swal.fire('Aviso', 'Referidor inválido.', 'warning'); return; }

  
  this.http.put(`${this.apiExamenes}/grupo/${this.ultimoGrupo}/referidor`, { id_referidor: idRef })
    .subscribe({
      next: () => Swal.fire('Listo', 'Referidor aplicado a la visita.', 'success'),
      error: () => {
       
        Swal.fire('Aviso', 'No se pudo aplicar en el servidor. (Endpoint no implementado)', 'info');
      }
    });
}


  seleccionarExamen(e: any) {
    this.nuevo.id_tipo_examen = e?.id ?? 0;
    this.busquedaExamen = e?.nombre ?? '';
    this.resultadosExamenes = [];
    this.onTipoChange();
  }

  
  onTipoChange() {
  const idTipo = this.nuevo.id_tipo_examen;
  this.plantillaParametros = [];
  if (!idTipo) return;

  this.http.get<any[]>(`${this.apiPlantilla}?idTipoExamen=${idTipo}`).subscribe({
    next: (items) => {
      const arr = Array.isArray(items) ? items : [];
      this.plantillaParametros = arr.map(p => ({
        id: p.id_parametro_tipo_examen ?? p.id ?? 0,
        nombre: p.nombre,
        unidad: p.unidad,
        rangoReferencia: p.rango_referencia ?? p.rangoReferencia,
      }));
    },
    error: (err) => console.error('Error cargando plantilla:', err),
  });
}

  agregarExamen() {
  if (!this.selectedPersona) {
    Swal.fire('Aviso', 'Selecciona primero un paciente.', 'info');
    return;
  }

  if (!this.nuevo.id_tipo_examen && !this.nuevo.id_perfil_examen) {
    Swal.fire('Aviso', 'Selecciona un tipo o perfil de examen.', 'info');
    return;
  }

  const body: any = {
    id_persona: this.selectedPersona.id,
    id_tipo_examen: this.nuevo.id_tipo_examen || 0,
    id_perfil_examen: this.nuevo.id_perfil_examen || null,
    id_clinica: this.nuevo.id_clinica,
    usar_precio_clinica: this.nuevo.usar_precio_clinica ? 1 : 0,
    resultado: this.nuevo.resultado ?? '',
    id_referidor: this.nuevo.id_referidor ?? null   // 🆕
    
  };

   body.id_sucursal = Number(localStorage.getItem('id_sucursal') || 1);

  //  Nueva lógica con grupo activo
  if (this.ultimoGrupo && this.ultimoGrupo !== 'pending-group') {
    body.grupo_examen = this.ultimoGrupo;
    body.grupoExamen = this.ultimoGrupo;
  } else if (this.ultimoGrupo === 'pending-group' || this.autoAgruparActivo) {
    body.agrupar = true;
  } else {
    Swal.fire({
      icon: 'info',
      title: 'Sin visita activa',
      text: 'Debes crear una nueva visita o seleccionar una existente antes de agregar exámenes.'
    });
    return;
  }

  console.group('🧪 DEBUG agregarExamen()');
  console.log('📦 Payload enviado al backend:', body);
  console.groupEnd();

  this.http.post(`${this.apiExamenes}`, body).subscribe({
    next: (res: any) => {
      console.group('✅ Respuesta del backend');
      console.log('🧩 Respuesta completa:', res);
      console.groupEnd();

      if (res?.tipo === 'perfil') {
        Swal.fire('Aviso', res.message, 'info');
        return;
      }

      const gid = (res?.grupo_examen ?? res?.grupoExamen ?? '').toLowerCase();


      //  Si el backend devolvió un nuevo grupo (se creó automáticamente)
if (this.ultimoGrupo === 'pending-group' && this.esUuidPosible(gid)) {
  this.ultimoGrupo = gid || null;
  this.fechaGrupoActual = res?.fechaRegistro ?? new Date().toISOString();

  //  Guarda persistencia por paciente (solo si hay grupo real)
  if (this.ultimoGrupo && this.selectedPersona) {
    localStorage.setItem('ultimoGrupo', this.ultimoGrupo);
    localStorage.setItem('ultimoGrupoPersona', this.selectedPersona.id.toString());
    localStorage.setItem('fechaGrupoActual', this.fechaGrupoActual);
  }

  //  Crear grupo visual en cache (solo si hay grupo real)
  if (this.ultimoGrupo) {
    const nuevoGrupo = {
      grupo: this.ultimoGrupo,
      fecha: this.fechaGrupoActual,
      nombreGrupo: `Visita del ${new Date(this.fechaGrupoActual).toLocaleDateString('es-GT', {
        day: '2-digit', month: 'short', year: 'numeric'
      })} – ${new Date(this.fechaGrupoActual).toLocaleTimeString('es-GT', {
        hour: '2-digit', minute: '2-digit'
      })}`,
      examenes: [],
      cantidad: 0,
      total: 0,
      totalPendiente: 0
    };

    this.gruposCache.unshift(nuevoGrupo as any);
    this.expandedGroups[this.ultimoGrupo!] = true; //  operador ! asegura que no es null

    console.log('🆕 Grupo real asignado y persistido:', this.ultimoGrupo);
  }
}



      const grupoActual = this.ultimoGrupo ?? gid ?? null;
      if (grupoActual) {
        localStorage.setItem('ultimoGrupo', grupoActual);
      }

      let grupoEnCache = this.gruposCache.find(g => g.grupo === grupoActual);

      const nuevoExamen: ExamenRow = {
        id: res.id,
        resultado: res.resultado,
        estado: res.estado,
        tipoExamen: res.tipoExamen,
        hasParametros: false,
        fechaRegistro: res.fechaRegistro ?? new Date().toISOString(),
        precio: res.precio ?? 0,
        grupo_examen: grupoActual,
        _selected: false
      };

      // Agregar el examen al grupo correspondiente
      if (grupoEnCache) {
        grupoEnCache.examenes.push(nuevoExamen);
        grupoEnCache.cantidad = grupoEnCache.examenes.length;
        grupoEnCache.total = grupoEnCache.examenes.reduce((sum, e) => sum + (e.precio ?? 0), 0);
        grupoEnCache.totalPendiente = grupoEnCache.examenes
          .filter(e => !e.id_pago)
          .reduce((sum, e) => sum + (e.precio ?? 0), 0);
      } else {
        const fecha = res.fechaRegistro ?? new Date().toISOString();
        const fechaObj = new Date(fecha);
        const nombreGrupo = `Visita del ${fechaObj.toLocaleDateString('es-GT', {
          day: '2-digit', month: 'short', year: 'numeric'
        })} – ${fechaObj.toLocaleTimeString('es-GT', {
          hour: '2-digit', minute: '2-digit'
        })}`;
        grupoEnCache = {
          grupo: grupoActual ?? '(sin grupo)',
          fecha,
          nombreGrupo,
          examenes: [nuevoExamen],
          cantidad: 1,
          total: res.precio ?? 0,
          totalPendiente: res.precio ?? 0
        };
        this.gruposCache.unshift(grupoEnCache as any);
      }

      //  Evita null en el índice aquí también
      if (grupoActual) {
        this.expandedGroups[grupoActual] = true;
      }


      this.actualizarEtiquetaGrupoActual();
      this.cdr.detectChanges();

      setTimeout(() => {
        const el = document.querySelector(`[data-grupo="${grupoActual}"]`) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-new');
          setTimeout(() => el.classList.remove('highlight-new'), 1500);
        }
      }, 300);

      Swal.fire({
        icon: 'success',
        title: 'Examen agregado',
        text: `Precio Q${res?.precio ?? 0}`,
        timer: 2000,
        showConfirmButton: false
      });

      this.nuevo = {
        id_tipo_examen: 0,
        id_perfil_examen: 0,
        id_clinica: null,
        usar_precio_clinica: false,
        resultado: '',
        id_referidor: null as number | null 
      };
    },
    error: (err) => {
      console.group('❌ Error al agregar examen');
      console.error('Detalles del error:', err);
      console.groupEnd();
      Swal.fire('Error', '❌ No se pudo agregar el examen. Revisa la consola.', 'error');
    }
  });
}


  editarExamen(e: ExamenRow) {
    const body = {
      resultado: e.resultado,
      estado: e.estado,
      idTipoExamen: e.tipoExamen?.id ?? 0,
    };
    this.http.put(`${this.apiExamenes}/${e.id}`, body).subscribe({
      next: () => alert('✏️ Examen actualizado'),
      error: (err) => console.error('Error al editar examen:', err),
    });
  }

  eliminarExamen(e: ExamenRow) {
    if (!confirm('¿Eliminar este examen?')) return;
    this.http.delete(`${this.apiExamenes}/${e.id}`).subscribe({
      next: () => {
        alert('🗑️ Examen eliminado');
        if (this.selectedPersona) this.verExamenes(this.selectedPersona);
      },
      error: (err) => console.error('Error al eliminar examen:', err),
    });
  }

  imprimirResultado(e: ExamenRow) {
    const url = `${this.apiExamenes}/${e.id}/reporte`
      + (this.ultimoGrupo ? `?grupo=${encodeURIComponent(this.ultimoGrupo)}` : '');
    window.open(url, '_blank');
  }

  imprimirSeleccionados() {
    if (!this.selectedPersona) return;
    const lista = this.examenesPorPersona[this.selectedPersona.id]?.filter(e => e._selected);
    if (!lista?.length) {
      alert('Selecciona al menos un examen para imprimir.');
      return;
    }

    const ids = lista.map(e => e.id);
    const w = window.open('', '_blank');

    this.http.post(`${this.apiExamenes}/reporte-multiple`, ids, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          if (w) w.location.href = url; else window.open(url, '_blank');
        },
        error: (err) => {
          console.error('Error al generar PDF múltiple:', err);
          alert('❌ No se pudo generar el PDF de los exámenes seleccionados.');
        }
      });
  }

  imprimirTodos() {
    if (!this.selectedPersona) return;

    const lista = this.examenesPorPersona[this.selectedPersona.id] ?? [];
    if (!lista.length) {
      alert('Este paciente no tiene exámenes para imprimir.');
      return;
    }

    const ids = lista.map(e => e.id);
    const w = window.open('', '_blank');

    this.http.post(`${this.apiExamenes}/reporte-multiple`, ids, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          if (w) w.location.href = url; else window.open(url, '_blank');
        },
        error: (err) => {
          console.error('Error al generar PDF múltiple:', err);
          alert('❌ No se pudo generar el PDF de todos los exámenes.');
        }
      });
  }

  tieneSeleccionados(): boolean {
    if (!this.selectedPersona) return false;
    const lista = this.examenesPorPersona[this.selectedPersona.id] ?? [];
    return lista.some(e => e._selected);
  }

  eliminarPersona(p: Persona) {
    if (!confirm(`⚠️ ¿Eliminar definitivamente a ${p.nombre} ${p.apellido} y todos sus exámenes?`)) return;

    this.http.delete(`${environment.apiUrl}/personas/${p.id}?hard=true`).subscribe({
      next: () => {
        alert('💣 Persona y exámenes eliminados permanentemente.');
        this.loadPersonas();
        delete this.examenesPorPersona[p.id];
        if (this.selectedPersona?.id === p.id) this.selectedPersona = null;
      },
      error: (err) => {
        console.error('Error al eliminar persona:', err);
        alert('❌ Error al eliminar persona. Revisa la consola.');
      },
    });
  }

  desactivarPersona(p: Persona) {
    if (!confirm(`¿Desactivar a ${p.nombre} ${p.apellido}? Esta acción se puede revertir.`)) return;

    this.http.delete(`${environment.apiUrl}/personas/${p.id}?hard=false`).subscribe({
      next: () => {
        alert('🚫 Persona desactivada correctamente.');
        this.loadPersonas();
        delete this.examenesPorPersona[p.id];
        if (this.selectedPersona?.id === p.id) this.selectedPersona = null;
      },
      error: (err) => {
        console.error('Error al desactivar persona:', err);
        alert('❌ Error al desactivar persona. Revisa la consola.');
      },
    });
  }

  reactivarPersona(p: Persona) {
    if (!confirm(`¿Reactivar a ${p.nombre} ${p.apellido}?`)) return;

    this.http.put(`${environment.apiUrl}/personas/${p.id}/reactivar`, {}).subscribe({
      next: () => {
        alert('✅ Persona reactivada correctamente.');
        this.loadPersonas();
      },
      error: (err) => {
        console.error('Error al reactivar persona:', err);
        alert('❌ Error al reactivar persona. Revisa la consola.');
      },
    });
  }


  toggleParametros(e: ExamenRow) {
    e._showParametros = !e._showParametros;
    if (!e._showParametros) return;

    if (!e._parametros) {
      this.http.get<ParametroEx[]>(`${this.apiExamenes}/${e.id}/parametros`).subscribe({
        next: (rows) => (e._parametros = rows),
        error: (err) => console.error('Error cargando parámetros:', err),
      });
    }
  }

  guardarTodosParametros(e: ExamenRow) {
    if (!e._parametros || e._parametros.length === 0) {
      alert('No hay parámetros para guardar.');
      return;
    }

    const payload = e._parametros.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      resultado: p.resultado,
      observaciones: p.observaciones,
    }));

    this.http.put(`${this.apiExamenes}/${e.id}/parametros`, payload).subscribe({
      next: () => alert('✅ Todos los parámetros guardados correctamente'),
      error: (err) => console.error('Error guardando todos los parámetros:', err),
    });
  }

  cargarPlantillaSiNoTiene(e: ExamenRow) {
    if (!e.tipoExamen?.id) return;
    this.http.post(`${this.apiExamenes}/from-template/${e.id}`, {}).subscribe({
      next: () => {
        alert('✅ Parámetros cargados');
        this.toggleParametros(e);
        this.toggleParametros(e);
      },
      error: (err) => console.error('Error cargando plantilla:', err),
    });
  }

  // Evaluación de resultados (mantiene tu lógica original)
  getResultadoClass(p: ParametroEx): string {
    const valor = (p.resultado ?? '').toString().trim().toLowerCase();
    const ref = (p.rangoReferencia ?? '').toString().trim().toLowerCase();
    if (!valor || !ref) return '';

    // Texto
    if (['positivo', 'negativo', 'normal', 'anormal'].some(k => ref.includes(k))) {
      if (valor.includes('positivo') && ref.includes('negativo')) return 'text-danger fw-bold';
      if (valor.includes('negativo') && ref.includes('positivo')) return 'text-danger fw-bold';
      if (valor.includes('normal') && ref.includes('anormal')) return 'text-danger fw-bold';
      if (valor.includes('anormal') && ref.includes('normal')) return 'text-danger fw-bold';
      if (valor.includes('positivo')) return 'text-primary fw-bold';
      if (valor.includes('negativo')) return 'text-success fw-bold';
      return '';
    }

    // Rango "min - max"
    const rango = ref.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (rango) {
      const min = parseFloat(rango[1]);
      const max = parseFloat(rango[2]);
      const num = parseFloat(valor.replace(',', '.'));
      if (isNaN(num)) return '';
      if (num < min || num > max) return 'text-danger fw-bold';
      return '';
    }

    // Condiciones >, <, ≥, ≤
    const mayor = ref.match(/^>\s*(\d+(?:\.\d+)?)/);
    const menor = ref.match(/^<\s*(\d+(?:\.\d+)?)/);
    const mayorIgual = ref.match(/^≥\s*(\d+(?:\.\d+)?)/);
    const menorIgual = ref.match(/^≤\s*(\d+(?:\.\d+)?)/);
    const num = parseFloat(valor.replace(',', '.'));
    if (!isNaN(num)) {
      if (mayor && num > parseFloat(mayor[1])) return 'text-danger fw-bold';
      if (menor && num < parseFloat(menor[1])) return 'text-danger fw-bold';
      if (mayorIgual && num >= parseFloat(mayorIgual[1])) return 'text-danger fw-bold';
      if (menorIgual && num <= parseFloat(menorIgual[1])) return 'text-danger fw-bold';
    }

    return '';
  }

  tienePendientes(idPersona: number): boolean {
    const lista = this.examenesPorPersona[idPersona] ?? [];
    return lista.some(e => e.estado === 1 && (e as any).id_pago == null);
  }

  abrirPagoParcialDesdePaciente(p: Persona) {
    this.selectedPersona = p;
    this.pagoService?.resumen(p.id).subscribe({
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

  abrirPagoParcialDesdeExamenes() {
    if (!this.selectedPersona) {
      alert('⚠️ Debes seleccionar un paciente.');
      return;
    }

    const persona = this.selectedPersona;
    this.pacienteSeleccionado = persona;

    this.pagoService.resumen(persona.id).subscribe({
      next: (res) => {
        this.examenesPendientes = res.examenes ?? [];

        if (!this.examenesPendientes.length) {
          alert('✅ No hay exámenes pendientes para este paciente.');
          return;
        }

        const modal = new (window as any).bootstrap.Modal(
          document.getElementById('pagoParcialModal')
        );
        modal.show();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al cargar exámenes pendientes.');
      },
    });
  }

  pagarTodoDesdePaciente(p: Persona) {
    if (!confirm(`¿Registrar pago total de los exámenes del paciente ${p.nombre}?`))
      return;

    const body = {
      id_persona: p.id,
      id_tipo_pago: 1,
      concepto: 'Pago total de exámenes',
      nota: 'Caja principal'
    };

    this.pagoService.pagarPaciente(body).subscribe({
      next: res => {
        alert(`✅ Pago total registrado: Q${res.total}`);
        this.http.get<any[]>(`${this.apiExamenes}/paciente/${p.id}`).subscribe({
          next: examenes => {
            this.examenesPorPersona[p.id] = examenes;
            this.cdr.detectChanges();
          },
          error: err => console.error('Error al refrescar exámenes:', err)
        });
      },
      error: err => {
        console.error('Error al registrar el pago total:', err);
        alert(err.error?.message || '❌ Error al registrar el pago.');
      }
    });
  }

  pagarTodoDesdeExamenes() {
  if (!this.selectedPersona) {
    alert('⚠️ Debes seleccionar un paciente.');
    return;
  }

  if (!confirm(`¿Registrar pago total de los exámenes del paciente ${this.selectedPersona.nombre}?`))
    return;

  //  Estructura exacta para coincidir con el backend
  const body = {
    id_persona: this.selectedPersona.id,   //  minúsculas y guion bajo
    id_tipo_pago: 1,
    concepto: 'Pago total de exámenes',
    nota: 'Caja principal',
    examenes: [] // opcional, pero lo incluimos vacío
  };

  this.pagoService.pagarPaciente(body).subscribe({
    next: (res) => {
      alert(`✅ Pago total registrado correctamente. Total: Q${res.total}`);
      this.verExamenes(this.selectedPersona!);

      if (res.id_pago) {
        setTimeout(() => {
          const url = `${environment.apiUrl}/pagos/${res.id_pago}/comprobante`;
          window.open(url, '_blank');
        }, 800);
      }
    },
    error: (err) => {
      console.error('❌ Error al registrar el pago total:', err);
      alert(err.error || 'Error al registrar el pago total.');
    },
  });
}



  contarExamenesSinPago(idPersona: number): number {
    const lista = this.examenesPorPersona[idPersona] ?? [];
    return lista.filter(e => !e.id_pago || e.id_pago === null).length;
  }

  verHistorialPagos() {
    if (!this.selectedPersona) return;

    this.pagoService.historial(this.selectedPersona.id).subscribe({
      next: (res) => {
        this.historialPagos = res;
        const modal = new (window as any).bootstrap.Modal(
          document.getElementById('historialPagosModal')
        );
        modal.show();
      },
      error: (err) => {
        console.error('❌ Error al cargar historial de pagos:', err);
        alert('No se pudo obtener el historial de pagos.');
      },
    });
  }

 
  cargarGruposPaciente(done?: () => void) {
  if (!this.selectedPersona) { if (done) done(); return; }

  this.http.get<any[]>(`${this.apiExamenes}/grupos`).subscribe({
    next: (res) => {
      const lista = Array.isArray(res) ? res : [];

      // 🔹 Prepara nombre completo del paciente (sin tildes, en minúsculas)
      const normalize = (str: string) =>
        (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      const nombrePaciente = normalize(
        `${this.selectedPersona!.nombre} ${this.selectedPersona!.apellido}`
      );

      //  Filtra grupos del paciente actual
      this.gruposPrevios = lista
        .filter((g: any) => {
          const nombreGrupo = normalize(g?.paciente ?? '');
          return (
            nombreGrupo.includes(nombrePaciente) ||
            nombrePaciente.includes(nombreGrupo)
          );
        })
        .map((g: any) => ({
          grupo: g.grupo,
          fecha: g.fecha,
          total: g.total,
          totalPendiente: g.total, // el backend no devuelve detalle de pagos
          cantidad: g.cantidad,
          paciente: g.paciente,
          examenes: g.examenes ?? []
        }));

      //  Sincroniza grupo actual
      this.syncFechaDeGrupoActual();

      //  Forzar actualización visual
      this.cdr.detectChanges();
      console.log('✅ Grupos cargados:', this.gruposPrevios);

      if (done) done();
    },
    error: (err) => {
      console.error('❌ Error cargando grupos:', err);
      if (done) done();
    },
  });
}


  crearGrupoNuevo() {
  if (!this.selectedPersona) {
    Swal.fire('Aviso', 'Selecciona un paciente primero.', 'info');
    return;
  }

  //  Limpia el grupo anterior y prepara uno nuevo
  this.ultimoGrupo = 'pending-group'; // grupo temporal hasta que el backend devuelva el real
  this.fechaGrupoActual = new Date().toISOString();
  this.autoAgruparActivo = true;
  this.nuevo.id_referidor = null; // 🆕 limpia selección de médico


  //  Guarda el estado actual en localStorage (para persistencia al recargar)
  localStorage.setItem('ultimoGrupo', this.ultimoGrupo);
  localStorage.setItem('ultimoGrupoPersona', this.selectedPersona.id.toString());
  localStorage.setItem('fechaGrupoActual', this.fechaGrupoActual);

  //  Muestra mensaje informativo al usuario
  Swal.fire({
    title: '🧪 Nueva visita preparada',
    html: `
      <div class="text-start">
        <p class="mb-2">Se preparó una nueva visita. El siguiente examen que agregues creará automáticamente un <b>grupo</b> en el sistema.</p>
        <ul class="small text-muted">
          <li>Se enviará <code>agrupar=true</code> al backend en el primer examen.</li>
          <li>Cuando el backend devuelva el <code>grupoExamen</code>, se fijará como <i>visita actual</i>.</li>
        </ul>
      </div>
    `,
    icon: 'success'
  });

  //  Actualiza etiqueta visual y fuerza refresco
  this.etiquetaGrupoActual = 'Nueva visita (en preparación)';
  this.cdr.detectChanges();
}


  mostrarGrupos = false;

  onReusarGrupoClick(g: any, ev?: MouseEvent) {
  try {
    // Evita que Bootstrap cierre/intercepte antes de que Angular maneje el click
    ev?.preventDefault();
    ev?.stopPropagation();
  } catch {}


  this.seleccionarGrupoPrevio(g?.grupo ?? g);

 
  try {
    const target = (ev?.target as HTMLElement) || document.activeElement as HTMLElement | null;
    const ddRoot = target?.closest('.dropdown');
    const toggle = ddRoot?.querySelector('[data-bs-toggle="dropdown"]') as HTMLElement | null;

    const bs = (window as any).bootstrap;
    if (bs?.Dropdown && toggle) {
      bs.Dropdown.getOrCreateInstance(toggle).hide();
    } else {
      // fallback: oculta el menú si quedó abierto
      const openMenu = ddRoot?.querySelector('.dropdown-menu.show') as HTMLElement | null;
      openMenu?.classList.remove('show');
    }
  } catch (e) {
    console.warn('No se pudo cerrar el dropdown:', e);
  }
}



seleccionarGrupoPrevio(idGrupo: string) {
  if (!idGrupo || !this.esUuidPosible(idGrupo)) {
    Swal.fire('Aviso', 'Id de grupo inválido.', 'warning');
    return;
  }

  
  this.ultimoGrupo = idGrupo;
  this.autoAgruparActivo = true;


  this.syncFechaDeGrupoActual();

  
  if (this.expandedGroups) {
    Object.keys(this.expandedGroups).forEach(k => (this.expandedGroups[k] = false));
    this.expandedGroups[idGrupo] = true; // si no existe, no rompe
  }

 
  this.actualizarEtiquetaGrupoActual();


  this.cdr.detectChanges();
}

  limpiarGrupoActual() {
  this.ultimoGrupo = null;
  this.etiquetaGrupoActual = '';
  this.fechaGrupoActual = '';
  this.contadorExamenesGrupoActual = 0;
  localStorage.removeItem('ultimoGrupo');
  localStorage.removeItem('ultimoGrupoPersona');
  localStorage.removeItem('fechaGrupoActual');
}
  toggleAutoAgrupar() {
    this.autoAgruparActivo = !this.autoAgruparActivo;
    const estado = this.autoAgruparActivo ? 'activado' : 'desactivado';
    Swal.fire('Auto agrupar', `Auto agrupar ha sido ${estado}.`, 'info');
  }

 
  verGrupo(grupo: string) {
  if (!grupo) {
    Swal.fire('Aviso', 'Este examen no pertenece a ningún grupo.', 'info');
    return;
  }

  this.grupoService.getGrupoDetalle(grupo).subscribe({
    next: (res: any) => {
      const referidor = res.referidor ?? res.referidoPor ?? '(Sin referidor)';

      // Cabecera del modal con detalles generales
      let html = `
        <div style="text-align:left">
          <div class="mb-2">
            <strong>🧪 Grupo:</strong> ${res.grupo}<br>
            <strong>📅 Fecha:</strong> ${this.fmtFecha(res.fecha ?? '')}<br>
            <strong>👨‍⚕️ Referido por:</strong> ${referidor}<br>
            <strong>💰 Total:</strong> Q${(res.total ?? 0).toFixed(2)}
          </div>

          <hr class="my-2"/>

          <table class="table table-sm table-bordered align-middle">
            <thead class="table-light">
              <tr class="text-center">
                <th>Examen</th>
                <th>Paciente</th>
                <th>Precio (Q)</th>
                <th>Resultado</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const x of res.examenes) {
        html += `
          <tr>
            <td>${x.tipoExamen}</td>
            <td>${x.paciente}</td>
            <td class="text-end">Q${(x.precioAplicado ?? 0).toFixed(2)}</td>
            <td>${x.resultado ?? ''}</td>
            <td>${x.estado ?? ''}</td>
            <td>${this.fmtFecha(x.fechaRegistro)}</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;

      Swal.fire({
        title: '📋 Detalle del Grupo / Visita',
        html,
        width: '65%',
        confirmButtonText: 'Cerrar',
        customClass: { htmlContainer: 'text-start' }
      });
    },
    error: () => {
      Swal.fire('Error', 'No se pudieron cargar los exámenes del grupo.', 'error');
    }
  });
}

  get totalGrupoActual(): number {
    if (!this.selectedPersona || !this.ultimoGrupo) return 0;
    const exs = this.examenesPorPersona[this.selectedPersona.id] ?? [];
    return this.sumaPrecios(exs.filter(x => x.grupo_examen === this.ultimoGrupo));
  }

  get cantidadGrupoActual(): number {
    if (!this.selectedPersona || !this.ultimoGrupo) return 0;
    const exs = this.examenesPorPersona[this.selectedPersona.id] ?? [];
    return exs.filter(x => x.grupo_examen === this.ultimoGrupo).length;
  }

  
  get gruposDelPacienteActual(): Array<{ id: string, fecha: string, total: number, cantidad: number }> {
    if (!this.selectedPersona) return [];
    const exs = this.examenesPorPersona[this.selectedPersona.id] ?? [];
    const map: Record<string, { fecha: string, total: number, cantidad: number }> = {};
    for (const e of exs) {
      const gid = e.grupo_examen ?? '(sin-grupo)';
      if (!map[gid]) {
        map[gid] = { fecha: e.fechaRegistro ?? '', total: 0, cantidad: 0 };
      }
      map[gid].total += Number(e.precio ?? 0) || 0;
      map[gid].cantidad += 1;
      // Si viene una fecha posterior, actualiza
      if (!map[gid].fecha && e.fechaRegistro) map[gid].fecha = e.fechaRegistro;
    }
    return Object.entries(map).map(([id, x]) => ({
      id, fecha: x.fecha, total: x.total, cantidad: x.cantidad
    }));
  }

  //  Agrupa exámenes por grupo_examen
getExamenesAgrupados(idPersona: number) {
  const examenes = this.examenesPorPersona[idPersona] ?? [];
  const grupos = new Map<string, ExamenRow[]>();

  for (const ex of examenes) {
    const grupo = (ex as any).grupo_examen || 'Sin grupo';
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo)!.push(ex);
  }

  // Convertimos el mapa en un array ordenado
  return Array.from(grupos.entries()).map(([grupo, lista]) => ({
    grupo,
    examenes: lista.sort(
      (a, b) =>
        new Date(b.fechaRegistro ?? '').getTime() -
        new Date(a.fechaRegistro ?? '').getTime()
    ),
  }));
}
//  Calcula el total de precios de un grupo de exámenes
getTotalGrupo(grupo: { examenes: ExamenRow[] }): number {
  if (!grupo || !grupo.examenes?.length) return 0;
  return grupo.examenes.reduce((acc, e) => acc + (e.precio || 0), 0);
}
mostrarTodosGrupos = false;

toggleTodosGrupos() {
  this.mostrarTodosGrupos = !this.mostrarTodosGrupos;
  Object.keys(this.expandedGroups).forEach(k => this.expandedGroups[k] = this.mostrarTodosGrupos);
}
pagarVisita(grupo: any) {
  if (!this.selectedPersona) return;

  const ids = grupo.examenes.map((e: any) => e.id);

  if (!ids.length) {
    alert('⚠️ No hay exámenes para procesar en esta visita.');
    return;
  }

  if (!confirm(`¿Registrar pago total de la visita (${ids.length} exámenes)?`)) return;

  const body = {
    id_persona: this.selectedPersona.id,
    concepto: `Pago total visita ${grupo.grupo}`,
    nota: 'Caja principal',
    examenes: ids,
    id_tipo_pago: 1
  };

  this.pagoService.pagarPaciente(body).subscribe({
    next: (res) => {
      alert(`✅ Pago registrado para visita ${grupo.grupo}. Total: Q${res.total}`);

      grupo.totalPendiente = 0;
      grupo.examenes.forEach((e: any) => (e.id_pago = res.id_pago ?? 1));

      this.cdr.detectChanges();
      this.verExamenes(this.selectedPersona!);

      // ⭐ Abrir comprobante PDF automáticamente
      if (res.id_pago) {
        setTimeout(() => {
          window.open(`${environment.apiUrl}/pagos/${res.id_pago}/comprobante`, "_blank");
        }, 500);
      }
    },
    error: (err) => {
      console.error('❌ Error al pagar visita:', err);
      alert(err.error || 'Error al registrar el pago de la visita.');
    }
  });
}


pagoParcialVisita(grupo: any) {
  if (!this.selectedPersona) return;
  this.examenesPendientes = grupo.examenes.filter((e: any) => !e.id_pago);
  if (!this.examenesPendientes.length) {
    alert('✅ No hay exámenes pendientes en esta visita.');
    return;
  }

  const modal = new (window as any).bootstrap.Modal(document.getElementById('pagoParcialModal'));
  modal.show();

  //  Al confirmar un pago parcial (cuando se emita el evento global)
  const listener = (e: any) => {
    if (this.selectedPersona?.id === e.detail) {
      // recalcula total pendiente
      grupo.totalPendiente = grupo.examenes
        .filter((ex: any) => !ex.id_pago || ex.id_pago === null)
        .reduce((sum: number, ex: any) => sum + (ex.precio || 0), 0);
      this.cdr.detectChanges();
    }
  };

  window.addEventListener('pagoParcialConfirmado', listener, { once: true });
}


imprimirVisita(grupo: any) {
  const ids = grupo.examenes.map((e: any) => e.id);
  const w = window.open('', '_blank');
  this.http.post(`${this.apiExamenes}/reporte-multiple`, ids, { responseType: 'blob' })
    .subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (w) w.location.href = url; else window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Error al imprimir visita:', err);
        alert('❌ No se pudo generar el PDF de la visita.');
      }
    });
}

// ✅ Imprimir todos los exámenes de un grupo/visita específica
imprimirTodosDelGrupo(grupo: any) {
  if (!grupo || !grupo.examenes?.length) {
    Swal.fire('Sin exámenes', 'No hay exámenes registrados en esta visita.', 'info');
    return;
  }

  const ids = grupo.examenes.map((e: any) => e.id);
  if (!ids.length) {
    Swal.fire('Aviso', 'No se encontraron exámenes válidos en esta visita.', 'warning');
    return;
  }

  const w = window.open('', '_blank');
  this.http.post(`${this.apiExamenes}/reporte-multiple`, ids, { responseType: 'blob' })
    .subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (w) w.location.href = url; else window.open(url, '_blank');
      },
      error: (err) => {
        console.error('❌ Error al imprimir todos los exámenes del grupo:', err);
        Swal.fire('Error', 'No se pudo generar el PDF de la visita seleccionada.', 'error');
      }
    });
}


//  Variables de búsqueda
searchTerm: string = '';
personasFiltradas: any[] = [];
//  Indicador de carga cuando cambia la sucursal
cargandoSucursal: boolean = false;


//  Método para filtrar en tiempo real
filtrarPersonas() {
  const term = this.searchTerm.trim().toLowerCase();

  if (!term) {
    this.personasFiltradas = this.personas; // si no hay texto, muestra todo
    return;
  }

  this.personasFiltradas = this.personas.filter(p =>
    (p.nombre + ' ' + p.apellido).toLowerCase().includes(term) ||
    (p.correo ?? '').toLowerCase().includes(term) ||
    (p.dpi ?? '').toLowerCase().includes(term)
  );
}



} 
