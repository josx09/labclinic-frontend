import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from './pago.service';
import { environment, env } from '../../core/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pago-parcial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-parcial.component.html',
  styleUrls: ['./pago-parcial.component.css']
})
export class PagoParcialComponent implements OnInit, OnDestroy {
  @Input() paciente: any = null;
  @Input() examenes: any[] = [];

  metodoPago: number = 1; 
  nota: string = '';
  cargando: boolean = false;
  ultimoPagoId: number | null = null;

  private sucursalSub!: Subscription;
  idSucursalActiva: number = env.sucursalId.value;

  constructor(private pagoService: PagoService) {}

  // ==========================================================
  //  CICLO DE VIDA
  // ==========================================================
  ngOnInit(): void {

    this.sucursalSub = env.sucursalId.subscribe(id => {
      this.idSucursalActiva = id;
      console.log('🏥 Cambio de sucursal detectado en PagoParcialComponent:', id);
     
    });
  }

  ngOnDestroy(): void {
    if (this.sucursalSub) this.sucursalSub.unsubscribe();
  }

  // ==========================================================
  //  CALCULA TOTAL SELECCIONADO
  // ==========================================================
  get totalSeleccionado(): number {
    if (!this.examenes?.length) return 0;
    return this.examenes
      .filter(x => x.selected)
      .reduce((sum, e) => {
        const precio = parseFloat(e.precio_aplicado ?? e.monto ?? e.precio ?? 0);
        return sum + (isNaN(precio) ? 0 : precio);
      }, 0);
  }

  toggleExamen(_: any) {
    console.log(`✅ Total actualizado: Q${this.totalSeleccionado.toFixed(2)}`);
  }

  // ==========================================================
  //  CONFIRMAR PAGO PARCIAL
  // ==========================================================
  confirmarPagoParcial() {
    const seleccionados = this.examenes.filter(x => x.selected);
    if (seleccionados.length === 0) {
      alert('⚠️ Debe seleccionar al menos un examen.');
      return;
    }

    const idPersona = this.paciente?.id_persona || this.paciente?.id;
    if (!idPersona) {
      alert('❌ No se encontró el ID del paciente.');
      return;
    }

    const monto = this.totalSeleccionado;
    if (monto <= 0) {
      alert('⚠️ El monto total no puede ser cero.');
      return;
    }

    this.cargando = true;

    //  Payload extendido con sucursal activa
    const body = {
      idPersona: idPersona,
      idUsuario: 1, //  
      idTipoPago: this.metodoPago,
      montoPagado: monto,
      examenIds: seleccionados.map(x => x.id || x.id_examen),
      concepto: 'Pago parcial de examen clínico',
      nota: this.nota ?? '',
      idSucursal: this.idSucursalActiva 
    };

    console.log('📤 Enviando pago parcial:', body);

    this.pagoService.createFromExams(body).subscribe({
      next: (res) => {
        alert(`✅ Pago parcial registrado correctamente: Q${res.cubierto ?? monto}`);

        this.ultimoPagoId = res.id ?? res.id_pago ?? null;

        // Cerrar modal Bootstrap
        const modalEl = document.getElementById('pagoParcialModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal?.hide();

        // Notificar al componente padre (recargar lista)
        const event = new CustomEvent('pagoParcialConfirmado', { detail: idPersona });
        window.dispatchEvent(event);

        // Abrir comprobante PDF
        if (this.ultimoPagoId) {
          setTimeout(() => {
            window.open(`${environment.apiUrl}/pagos/${this.ultimoPagoId}/comprobante`, '_blank');
          }, 800);
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al registrar el pago parcial:', err);
        alert(err.error?.message || '❌ Error al registrar el pago parcial.');
        this.cargando = false;
      }
    });
  }

  // ==========================================================
  //  VER COMPROBANTE
  // ==========================================================
  verComprobante() {
    if (!this.ultimoPagoId) return;
    window.open(`${environment.apiUrl}/pagos/${this.ultimoPagoId}/comprobante`, '_blank');
  }
}
