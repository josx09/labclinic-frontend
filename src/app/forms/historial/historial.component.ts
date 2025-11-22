import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/env';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  historial: any[] = [];
  idPaciente!: number;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rol = (localStorage.getItem('rol') || '').toLowerCase();

    if (rol.includes('cliente')) {
      // Cliente autenticado → usa el endpoint protegido del usuario
      this.http.get<any[]>(`${environment.apiUrl}/historial/paciente/mi-historial`)
        .subscribe({
          next: data => {
            // Agregamos propiedad abierta: false
            this.historial = data.map(item => ({ ...item, abierto: false }));
          },
          error: err => console.error('Error al cargar historial del cliente:', err)
        });
    } else {
      // Admin o médico → usa el id en la URL
      this.idPaciente = Number(this.route.snapshot.paramMap.get('id'));
      this.cargarHistorial();
    }
  }

  cargarHistorial(): void {
    this.http.get<any[]>(`${environment.apiUrl}/historial/paciente/${this.idPaciente}`)
      .subscribe({
        next: data => {
          this.historial = data.map(item => ({ ...item, abierto: false }));
        },
        error: err => console.error('Error al cargar historial:', err)
      });
  }

  //  Alternar visibilidad del grupo (colapsado manual)
  toggleGrupo(index: number): void {
  this.historial = this.historial.map((g, i) => ({
    ...g,
    abierto: i === index ? !g.abierto : false
  }));
}


  //  Botón para volver al panel principal
  volverAlPanel(): void {
  this.router.navigate(['/home']);
}


  //  Sumar precios
  getTotal(examenes: any[]): number {
    return examenes.reduce((sum, ex) => sum + (ex.precioAplicado || 0), 0);
  }

  imprimirHistorial(): void {
    const fechaActual = new Date().toLocaleString();
    const paciente = "Paciente actual"; // opcional, cámbialo si tienes nombre dinámico

    let contenido = `
      <div style="text-align:center; margin-bottom:20px;">
        <h2 style="color:#007bff; margin:0;">🧾 Historial médico del paciente</h2>
        <p><strong>Paciente:</strong> ${paciente}</p>
        <p><strong>Fecha de impresión:</strong> ${fechaActual}</p>
        <hr/>
      </div>
    `;

    this.historial.forEach(grupo => {
      const fechaGrupo = new Date(grupo.fecha).toLocaleDateString('es-GT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      contenido += `
        <h3 style="color:#007bff; margin-top:30px;">📅 ${fechaGrupo}</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="border:1px solid #ddd; padding:8px;">Examen</th>
              <th style="border:1px solid #ddd; padding:8px;">Clínica</th>
              <th style="border:1px solid #ddd; padding:8px;">Precio (Q)</th>
              <th style="border:1px solid #ddd; padding:8px;">Resultado</th>
              <th style="border:1px solid #ddd; padding:8px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.examenes.map((ex: any) => `
              <tr>
                <td style="border:1px solid #ddd; padding:8px;">${ex.tipoExamen}</td>
                <td style="border:1px solid #ddd; padding:8px;">${ex.clinica}</td>
                <td style="border:1px solid #ddd; padding:8px;">Q${ex.precioAplicado.toFixed(2)}</td>
                <td style="border:1px solid #ddd; padding:8px;">${ex.resultado || 'Pendiente'}</td>
                <td style="border:1px solid #ddd; padding:8px;">
                  <span style="
                    display:inline-block;
                    padding:4px 8px;
                    border-radius:4px;
                    color:white;
                    background:${ex.estado === 1 ? '#28a745' : '#6c757d'};">
                    ${ex.estado === 1 ? 'Activo' : 'Finalizado'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });

    const ventana = window.open('', '_blank', 'width=900,height=700');
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Historial Médico - ${paciente}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h2, h3 { color: #007bff; }
              hr { border: none; border-top: 2px solid #007bff; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>${contenido}</body>
        </html>
      `);
      ventana.document.close();
      ventana.focus();
      ventana.print();
      ventana.close();
    }
  }

  imprimirResultados(): void {
    if (!this.historial.length) {
      alert('⚠️ No hay resultados disponibles para imprimir.');
      return;
    }

    const ids = this.historial.flatMap(grupo => grupo.examenes.map((ex: any) => ex.id)).filter(Boolean);
    if (!ids.length) {
      alert('⚠️ No se encontraron exámenes válidos para imprimir.');
      return;
    }

    this.http.post(`${environment.apiUrl}/examenes/reporte-multiple`, ids, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (err) => {
          console.error('❌ Error al imprimir resultados:', err);
          alert('❌ No se pudo generar el PDF de resultados.');
        }
      });
  }

  imprimirVisita(grupo: any): void {
    if (!grupo?.examenes?.length) {
      alert('⚠️ No hay exámenes para imprimir en esta visita.');
      return;
    }

    const ids = grupo.examenes.map((e: any) => e.id);
    this.http.post(`${environment.apiUrl}/examenes/reporte-multiple`, ids, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const pdfUrl = URL.createObjectURL(blob);
          window.open(pdfUrl, '_blank');
        },
        error: (err) => {
          console.error('❌ Error al generar PDF de la visita:', err);
          alert('Error al generar el PDF de esta visita.');
        }
      });
  }
}
