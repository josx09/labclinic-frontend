import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../core/crud.service';
import { env } from '../core/env';
import { Subscription } from 'rxjs';

type Insumo = {
  id?: number;
  idCategoria: number;
  idProveedor?: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  unidadMedida?: string;
  estado: number;
  almacenado?: string;
  precio: number;
  descripcion?: string;
};

type Categoria = { id: number; nombre: string; descripcion?: string };
type Proveedor = { id: number; nombre: string; empresa?: string };

@Component({
  standalone: true,
  selector: 'app-insumos',
  imports: [CommonModule, FormsModule],
  templateUrl: './insumos.component.html'
})
export class InsumosComponent implements OnInit, OnDestroy {
  items: Insumo[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];
  model: Insumo = {
    idCategoria: 1,
    nombre: '',
    stock: 0,
    stockMinimo: 0,
    estado: 1,
    precio: 0
  };

  editingId: number | null = null;
  loading = false;
  error = '';
  deleteId: number | null = null;
  showDeleteModal = false;

  // ✅ NUEVO: indicadores de stock
  conteoStock = { suficiente: 0, bajo: 0, critico: 0 };
  porcentaje = { suficiente: 0, bajo: 0, critico: 0 };

  private sucursalSub!: Subscription;

  constructor(private api: CrudService) {}

  ngOnInit() {
    this.load();
    this.loadCategorias();
    this.loadProveedores();

    // 🔹 Recargar automáticamente cuando cambie la sucursal
    this.sucursalSub = env.sucursalId.subscribe(id => {
      console.log('🏥 Cambio de sucursal detectado:', id);
      this.load();
    });
  }

  ngOnDestroy() {
    if (this.sucursalSub) this.sucursalSub.unsubscribe();
  }

  // ============================================================
  // ✅ Cargar insumos
  // ============================================================
  load() {
    this.loading = true;
    this.api.list<any>('insumolaboratorio').subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.items ?? [];
        this.items = data;
        this.loading = false;
        this.actualizarConteoStock(); // 🔹 Calcula niveles de stock
      },
      error: _ => {
        this.error = 'Error cargando insumos';
        this.loading = false;
      }
    });
  }

  loadCategorias() {
    this.api.list<any>('categoriainsumo').subscribe({
      next: (res: any) => {
        this.categorias = Array.isArray(res) ? res : res.items ?? [];
      },
      error: _ => (this.error = 'Error cargando categorías')
    });
  }

  loadProveedores() {
    this.api.list<any>('proveedor').subscribe({
      next: (res: any) => {
        this.proveedores = Array.isArray(res) ? res : res.items ?? [];
      },
      error: _ => (this.error = 'Error cargando proveedores')
    });
  }

  getCategoriaNombre(id: number): string {
    const cat = this.categorias.find(c => c.id === id);
    return cat ? cat.nombre : '—';
  }

  getProveedorNombre(id?: number): string {
    const prov = this.proveedores.find(p => p.id === id);
    return prov ? prov.nombre : '—';
  }

  edit(it: Insumo) {
    this.model = { ...it };
    this.editingId = it.id ?? null;
  }

  reset() {
    this.model = {
      idCategoria: 1,
      nombre: '',
      stock: 0,
      stockMinimo: 0,
      estado: 1,
      precio: 0
    };
    this.editingId = null;
    this.error = '';
  }

  save() {
    this.loading = true;
    const body: Insumo = {
  idCategoria: this.model.idCategoria,
  idProveedor: this.model.idProveedor,
  nombre: this.model.nombre,
  stock: this.model.stock,
  stockMinimo: this.model.stockMinimo,
  unidadMedida: this.model.unidadMedida,
  estado: this.model.estado,
  almacenado: this.model.almacenado,
  precio: this.model.precio,
  descripcion: this.model.descripcion
};

if (this.editingId) body.id = this.editingId;

const obs = this.editingId
  ? this.api.update<Insumo>('insumolaboratorio', this.editingId!, body)
  : this.api.create<Insumo>('insumolaboratorio', body);


    obs.subscribe({
      next: _ => {
        this.reset();
        this.load();
        this.actualizarConteoStock(); // 🔹 Refresca niveles de stock
      },
      error: _ => {
        this.error = 'No se pudo guardar';
        this.loading = false;
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
    this.api.remove<any>('insumolaboratorio', this.deleteId).subscribe({
      next: () => {
        this.load();
        this.cancelRemove();
        this.loading = false;
        this.actualizarConteoStock(); // 🔹 Recalcula después de eliminar
      },
      error: () => {
        this.error = 'No se pudo eliminar';
        this.loading = false;
      }
    });
  }

  // ============================================================
  // 🔹 Calcula totales y porcentajes de stock
  // ============================================================
  actualizarConteoStock() {
    if (!this.items || this.items.length === 0) {
      this.conteoStock = { suficiente: 0, bajo: 0, critico: 0 };
      this.porcentaje = { suficiente: 0, bajo: 0, critico: 0 };
      return;
    }

    let suficiente = 0, bajo = 0, critico = 0;

    for (const ins of this.items) {
      if (ins.stock <= ins.stockMinimo) {
        critico++;
      } else if (ins.stock > ins.stockMinimo && ins.stock <= (ins.stockMinimo * 2)) {
        bajo++;
      } else {
        suficiente++;
      }
    }

    this.conteoStock = { suficiente, bajo, critico };

    const total = suficiente + bajo + critico;
    this.porcentaje = {
      suficiente: +(suficiente / total * 100).toFixed(1),
      bajo: +(bajo / total * 100).toFixed(1),
      critico: +(critico / total * 100).toFixed(1)
    };
  }

  // ============================================================
// 📊 CONTROL DE USO DE INSUMOS (Opción A)
// ============================================================

usosHoy: any[] = [];
showUsoModal = false;
nuevoUso = { idInsumo: 0, cantidad: 0, justificacion: '' };
loadingUso = false;

// 🔹 Mostrar modal y cargar los registros del día
verUsosHoy() {
  this.showUsoModal = true;
  this.loadUsosHoy();
}

// 🔹 Cerrar modal
cerrarModalUso() {
  this.showUsoModal = false;
  this.nuevoUso = { idInsumo: 0, cantidad: 0, justificacion: '' };
  this.usosHoy = [];
}

// 🔹 Cargar registros de uso del día
loadUsosHoy() {
  this.loadingUso = true;
  this.api.list<any>('examenes/insumos/hoy').subscribe({
    next: (res) => {
      this.usosHoy = Array.isArray(res) ? res : [];
      this.loadingUso = false;
    },
    error: (_) => {
      this.loadingUso = false;
      alert('⚠️ Error al cargar los usos de hoy');
    },
  });
}

// 🔹 Registrar uso manual extra
registrarUsoManual() {
  if (!this.nuevoUso.idInsumo || this.nuevoUso.cantidad <= 0) {
    alert('Por favor selecciona un insumo y una cantidad válida.');
    return;
  }

  const body = {
    idInsumo: this.nuevoUso.idInsumo,
    cantidadUsada: this.nuevoUso.cantidad,
    justificacion: this.nuevoUso.justificacion || 'Uso adicional',
  };

  this.api.create<any>('examenes/insumos/manual', body).subscribe({
    next: (_) => {
      alert('✅ Uso manual registrado correctamente.');
      this.nuevoUso = { idInsumo: 0, cantidad: 0, justificacion: '' };
      this.loadUsosHoy();
      this.load(); // recargar inventario
    },
    error: (_) => alert('❌ No se pudo registrar el uso.'),
  });
}

// ============================================================
// 📅 FILTRO POR FECHAS (Opcional)
// ============================================================
filtro = { desde: '', hasta: '' };

// 🔹 Buscar registros por rango de fechas
buscarPorRango() {
  if (!this.filtro.desde || !this.filtro.hasta) {
    alert('Por favor selecciona ambas fechas.');
    return;
  }

  this.loadingUso = true;
  const url = `examenes/insumos/hoy?desde=${this.filtro.desde}&hasta=${this.filtro.hasta}`;

  this.api.list<any>(url).subscribe({
    next: (res) => {
      this.usosHoy = Array.isArray(res) ? res : [];
      this.loadingUso = false;
    },
    error: (_) => {
      this.loadingUso = false;
      alert('⚠️ Error al cargar registros.');
    },
  });
}


}
