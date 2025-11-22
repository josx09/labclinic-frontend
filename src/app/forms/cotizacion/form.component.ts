import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../core/crud.service';
import { AuthService } from '../../auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html',
})
export class CotizacionesComponent implements OnInit {
  // --- búsqueda / resultados de exámenes ---
  searchTerm = '';
  resultadosBusqueda: any[] = [];
  private busquedaTimer: any = null;

  // --- cotización en memoria ---
  cotizacionActual: Array<{ id_examen: number; nombre: string; precio: number }> = [];

  // --- cache catálogos ---
  private clinicasMap = new Map<number, string>(); // id -> nombre

  // --- total cotización ---
  total: number = 0; //  propiedad que faltaba

  // --- modal selector de precio ---
  pricePicker = {
    open: false,
    examen: { id: 0, nombre: '', precioBase: 0, tipo: 'Examen' },
    rows: [] as Array<{ id_clinica: number; nombre: string; precio: number }>,
    filter: '',
    loading: false,
  };

  constructor(private api: CrudService, private auth: AuthService) {}

  ngOnInit(): void {
    this.cargarClinicas();
  }


  //  Buscar exámenes / perfiles
  
  buscarExamenes(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      this.resultadosBusqueda = [];
      return;
    }

    clearTimeout(this.busquedaTimer);
    this.busquedaTimer = setTimeout(() => {
      Promise.all([
        this.api.list<any>('tipos-examen', { search: term, pageSize: 15 }).toPromise() as Promise<any>,
        this.api.list<any>('perfilesexamen/list').toPromise() as Promise<any>,
      ])
        .then(([resExamenes, resPerfiles]: [any, any]) => {
          const examenes = Array.isArray(resExamenes)
            ? resExamenes
            : resExamenes?.items ?? [];
          const perfiles = Array.isArray(resPerfiles)
            ? resPerfiles
            : resPerfiles?.items ?? [];

          const perfilesFiltrados = perfiles.filter((p: any) =>
            p.nombre?.toLowerCase().includes(term)
          );

          this.resultadosBusqueda = [
            ...examenes.map((e: any) => ({
              ...e,
              tipo: 'Examen',
              precio: e.precio ?? 0,
            })),
            ...perfilesFiltrados.map((p: any) => ({
              id: p.id_perfil_examen ?? p.id,
              nombre: p.nombre,
              tipo: 'Perfil',
              precio: p.precioPaquete ?? p.precioTotal ?? 0,
            })),
          ];
        })
        .catch(() => (this.resultadosBusqueda = []));
    }, 300);
  }

  
  //  Catálogo de clínicas

  private cargarClinicas(): void {
    this.api.list<any>('clinicas').subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res?.items ?? [];
        for (const c of data) {
          const id = c.id_clinica ?? c.id ?? c.Id ?? c.ID;
          const nombre = c.nombre ?? c.Nombre ?? `Clínica #${id}`;
          if (id != null) this.clinicasMap.set(Number(id), String(nombre));
        }
      },
      error: () => {},
    });
  }

  
  //  Seleccionar examen / perfil

  seleccionarExamen(e: any): void {
    const user = {
      rol: localStorage.getItem('rol') || '',
      nombre: localStorage.getItem('name') || '',
      idPersona: Number(localStorage.getItem('idPersona')) || 0
    };

    const esCliente = user?.rol?.toLowerCase() === 'cliente';

    //  Si el examen es un perfil
    if (e.tipo === 'Perfil') {
      if (this.cotizacionActual.some((x) => x.id_examen === e.id)) {
        alert('Este perfil ya está en la cotización.');
        return;
      }

      this.cotizacionActual.push({
        id_examen: e.id,
        nombre: `Perfil: ${e.nombre}`,
        precio: e.precio ?? 0,
      });
      this.limpiarBusqueda();
      this.calcularTotal();
      return;
    }

    // Si el usuario es cliente → usa precio base directamente
    if (esCliente) {
      if (this.cotizacionActual.some((x) => x.id_examen === e.id)) {
        alert('Este examen ya está en la cotización.');
        return;
      }

      this.cotizacionActual.push({
        id_examen: e.id,
        nombre: e.nombre ?? 'Examen',
        precio: e.precio ?? e.precio_base ?? 0,
      });

      Swal.fire({
        icon: 'info',
        title: 'Cotización básica',
        text: 'Como cliente, solo se usa el precio base del examen.',
        timer: 2200,
        showConfirmButton: false,
      });

      this.limpiarBusqueda();
      this.calcularTotal();
      return;
    }

    // Caso normal (usuarios internos)
    this.pricePicker.open = true;
    this.pricePicker.examen = {
      id: Number(e.id),
      nombre: e.nombre ?? 'Examen',
      precioBase: Number(e.precio ?? 0),
      tipo: 'Examen',
    };
    this.pricePicker.rows = [];
    this.pricePicker.filter = '';
    this.pricePicker.loading = true;

    this.api.get<any>(`PreciosClinica/porClinica/${e.id}`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res)
          ? res
          : res?.items ?? res?.result ?? res?.data ?? [];

        this.pricePicker.rows = data.map((r: any) => {
          const idc = Number(r.id ?? 0);
          const nombreClinica =
            r.clinica ?? this.clinicasMap.get(idc) ?? `Clínica #${idc}`;
          const precio = Number(
            r.precioEspecial ?? r.precio_especial ?? r.precio ?? 0
          );
          return { id_clinica: idc, nombre: nombreClinica, precio };
        });

        this.pricePicker.loading = false;
      },
      error: (err) => {
        console.error('❌ Error obteniendo precios de clínica:', err);
        this.pricePicker.rows = [];
        this.pricePicker.loading = false;
      },
    });
  }

  cerrarPricePicker(): void {
    this.pricePicker.open = false;
  }


  //  Filtro en el modal
 
  get rowsFiltradas(): Array<{ id_clinica: number; nombre: string; precio: number }> {
    const q = this.pricePicker.filter.trim().toLowerCase();
    if (!q) return this.pricePicker.rows;
    return this.pricePicker.rows.filter((r) =>
      r.nombre.toLowerCase().includes(q)
    );
  }

  usarPrecioBase(): void {
    const ex = this.pricePicker.examen;
    if (this.cotizacionActual.some((x) => x.id_examen === ex.id)) {
      alert('Este examen ya está en la cotización.');
      return;
    }
    this.cotizacionActual.push({
      id_examen: ex.id,
      nombre: ex.nombre,
      precio: ex.precioBase,
    });
    this.cerrarPricePicker();
    this.limpiarBusqueda();
    this.calcularTotal();
  }

  usarPrecioClinica(row: { id_clinica: number; nombre: string; precio: number }): void {
    const ex = this.pricePicker.examen;
    if (this.cotizacionActual.some((x) => x.id_examen === ex.id)) {
      alert('Este examen ya está en la cotización.');
      return;
    }
    this.cotizacionActual.push({
      id_examen: ex.id,
      nombre: `${ex.nombre} (${row.nombre})`,
      precio: row.precio,
    });
    this.cerrarPricePicker();
    this.limpiarBusqueda();
    this.calcularTotal();
  }

  eliminarDeCotizacion(id_examen: number): void {
    this.cotizacionActual = this.cotizacionActual.filter(
      (x) => x.id_examen !== id_examen
    );
    this.calcularTotal();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.resultadosBusqueda = [];
  }

  resetTodo(): void {
    this.cotizacionActual = [];
    this.total = 0;
    this.limpiarBusqueda();
    this.cerrarPricePicker();
  }


  // Impresión HTML

  imprimirCotizacion(): void {
  if (!this.cotizacionActual.length) {
    alert('No hay exámenes en la cotización.');
    return;
  }

  const w = window.open('', '_blank');
  if (!w) return;

  const fecha = new Date().toLocaleString();
  const total = this.total.toFixed(2);

  //  Usa la ruta absoluta del logo desde tu app Angular
  const logoUrl = `${window.location.origin}/assets/img/logo_lab.png`;

  w.document.write(`
    <html>
      <head>
        <title>Cotización</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 32px;
            color: #222;
          }
          header {
            text-align: center;
            border-bottom: 2px solid #ccc;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          header img {
            width: 100px;
            height: auto;
            margin-bottom: 5px;
          }
          h2 {
            margin: 0;
            font-size: 20px;
          }
          .fecha {
            text-align: right;
            font-size: 13px;
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            border: 1px solid #999;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f6f6f6;
          }
          tfoot td {
            font-weight: bold;
            background: #f0f0f0;
          }
        </style>
      </head>
      <body>
        <header>
          <img src="${logoUrl}" alt="Logo Laboratorio">
          <h2>Laboratorio Clínico CDC</h2>
          <div class="fecha">Fecha: ${fecha}</div>
        </header>

        <table>
          <thead>
            <tr><th>#</th><th>Examen / Perfil</th><th>Precio (Q)</th></tr>
          </thead>
          <tbody>
            ${this.cotizacionActual
              .map(
                (x, i) =>
                  `<tr><td>${i + 1}</td><td>${x.nombre}</td><td>Q${Number(
                    x.precio
                  ).toFixed(2)}</td></tr>`
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="2">Total</td><td>Q${total}</td></tr>
          </tfoot>
        </table>
      </body>
    </html>
  `);

  w.document.close();
  w.print();
}


  calcularTotal(): void {
    this.total = this.cotizacionActual.reduce(
      (sum: number, item: any) => sum + Number(item.precio ?? 0),
      0
    );
  }
}
