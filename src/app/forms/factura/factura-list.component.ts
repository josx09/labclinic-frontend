import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturaService } from './factura.service';
import { environment } from '../../core/env';

@Component({
  standalone: true,
  selector: 'app-factura-list',
  templateUrl: './factura-list.component.html',
  imports: [CommonModule],
})
export class FacturaListComponent implements OnInit {
  facturas: any[] = [];
  total = 0;

  constructor(private facturaService: FacturaService) {}

  ngOnInit() {
    this.cargarFacturas();
  }

  cargarFacturas() {
    this.facturaService.getAll().subscribe({
      next: (res) => {
        this.facturas = res.items;
        this.total = res.total;
      },
      error: (err) => console.error('Error cargando facturas:', err),
    });
  }

  verComprobante(f: any) {
    window.open(`${environment.apiUrl}/pagos/${f.idPago}/comprobante`, '_blank');
  }
}
