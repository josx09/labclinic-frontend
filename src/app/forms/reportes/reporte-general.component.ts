import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../core/env'; 
Chart.register(...registerables);

// Tipo seguro para claves
type SeccionReporte = 'pacientes' | 'referidos' | 'examenes' | 'activos';

@Component({
  selector: 'app-reporte-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-general.component.html',
})
export class ReporteGeneralComponent implements OnInit {

  resumen = {
    totalPacientes: 0,
    totalReferidos: 0,
    totalExamenes: 0,
    totalActivos: 0,
  };

  filtro = { desde: '', hasta: '' };
  chart?: Chart;
  cargando = false;
  mensaje = '';
  private apiUrl = `${environment.apiUrl}/reportes`;

  // CORREGIDO: tipado seguro para evitar errores TS7053
  incluir: Record<SeccionReporte, boolean> = {
    pacientes: true,
    referidos: false,
    examenes: false,
    activos: false,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ==========================================================
  //  Cargar datos generales
  // ==========================================================
  cargarDatos() {
    let urlPersonas = `${environment.apiUrl}/personas`;
    let urlExamenes = `${environment.apiUrl}/examenes`;

    if (this.filtro.desde && this.filtro.hasta) {
      urlPersonas += `?desde=${this.filtro.desde}&hasta=${this.filtro.hasta}`;
      urlExamenes += `?desde=${this.filtro.desde}&hasta=${this.filtro.hasta}`;
    }

    Promise.all([
      this.http.get<any[]>(urlPersonas).toPromise(),
      this.http.get<any[]>(urlExamenes).toPromise(),
    ])
      .then(([personas, examenes]) => {
        if (personas && examenes) {
          this.resumen.totalPacientes = personas.length;
          this.resumen.totalReferidos = personas.filter(p => p.tipoCliente === 1).length;
          this.resumen.totalActivos = personas.filter(p => p.estado === 1).length;
          this.resumen.totalExamenes = examenes.length;
          this.generarGrafico();
        }
      })
      .catch(() => alert('Error al cargar los datos.'));
  }

  limpiarFiltro() {
    this.filtro.desde = '';
    this.filtro.hasta = '';
    this.cargarDatos();
  }

  // =========================================================
  //  Generar gráfico
  // ==========================================================
  generarGrafico() {
    const ctx = document.getElementById('graficoGeneral') as HTMLCanvasElement;
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pacientes', 'Referidos', 'Exámenes', 'Activos'],
        datasets: [
          {
            label: 'Totales',
            data: [
              this.resumen.totalPacientes,
              this.resumen.totalReferidos,
              this.resumen.totalExamenes,
              this.resumen.totalActivos,
            ],
            backgroundColor: ['#007bff', '#ffc107', '#28a745', '#17a2b8'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Resumen General del Laboratorio', font: { size: 18 } },
        },
      },
    });
  }

  // =========================================================
  //  PDF individual
  // =========================================================
  descargarPDF(tipo: string) {
    this.cargando = true;
    let url = `${this.apiUrl}/${tipo}`;
    if (this.filtro.desde && this.filtro.hasta) {
      url += `?desde=${this.filtro.desde}&hasta=${this.filtro.hasta}`;
    }
    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: res => this.descargarArchivo(res, `reporte_${tipo}.pdf`),
      error: () => this.mostrarMensaje('Error al generar el reporte PDF.', 'danger'),
      complete: () => (this.cargando = false),
    });
  }

  // =========================================================
  //  Excel individual
  // =========================================================
  exportarExcel(tipo: string) {
    this.cargando = true;
    let url = `${this.apiUrl}/excel/${tipo}`;
    if (this.filtro.desde && this.filtro.hasta) {
      url += `?desde=${this.filtro.desde}&hasta=${this.filtro.hasta}`;
    }
    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: res => this.descargarArchivo(res, `reporte_${tipo}.xlsx`),
      error: () => this.mostrarMensaje('Error al exportar a Excel.', 'danger'),
      complete: () => (this.cargando = false),
    });
  }

  // =========================================================
  //  PDF general combinado (MISMO FORMATO QUE EXCEL)
  // =========================================================
  generarReporteGeneral() {
    // CORREGIDO: tipado seguro
    const seleccionadas = (Object.keys(this.incluir) as SeccionReporte[])
      .filter(key => this.incluir[key]);

    if (seleccionadas.length === 0) {
      this.mostrarMensaje("Seleccione al menos un reporte.", "warning");
      return;
    }

    this.cargando = true;

    const body = {
      secciones: seleccionadas,
      desde: this.filtro.desde || "",
      hasta: this.filtro.hasta || ""

    };

    this.http.post(`${this.apiUrl}/general`, body, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        this.cargando = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reporte_general.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        this.cargando = false;
        console.error(err);
        this.mostrarMensaje("Error al generar el PDF.", "danger");
      }
    });
  }

  // =========================================================
  //  Excel general combinado
  // =========================================================
  exportarExcelGeneral() {
    const seleccionados = this.obtenerSeleccionados();
    if (!seleccionados.length) {
      this.mostrarMensaje('Selecciona al menos un tipo de reporte para exportar.', 'warning');
      return;
    }
    this.cargando = true;
    let url = `${this.apiUrl}/generalexcel`;
    if (this.filtro.desde && this.filtro.hasta) {
      url += `?desde=${this.filtro.desde}&hasta=${this.filtro.hasta}`;
    }
    this.http.post(url, seleccionados, { responseType: 'blob', observe: 'response' }).subscribe({
      next: res => this.descargarArchivo(res, 'reporte_general.xlsx'),
      error: () => this.mostrarMensaje('No se pudo generar el Excel general.', 'danger'),
      complete: () => (this.cargando = false),
    });
  }

  // ==========================================================
  //  Descargar resultados clínicos por paciente
  // ==========================================================
  descargarResultadosPaciente(idPaciente: number, desde?: string, hasta?: string) {
    this.cargando = true;
    let params = '';
    if (desde) params += `?desde=${desde}`;
    if (hasta) params += `${params ? '&' : '?'}hasta=${hasta}`;
    const url = `${this.apiUrl}/resultados/${idPaciente}${params}`;

    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: res => this.descargarArchivo(res, `reporte_resultados_${idPaciente}.pdf`),
      error: () => this.mostrarMensaje('Error al generar el reporte clínico.', 'danger'),
      complete: () => (this.cargando = false),
    });
  }

  // ==========================================================
  //  Utilidades internas
  // ==========================================================
  private obtenerSeleccionados(): string[] {
    return (Object.keys(this.incluir) as SeccionReporte[])
      .filter(k => this.incluir[k]);
  }

  private descargarArchivo(res: HttpResponse<Blob>, nombre: string) {
    const blob = res.body!;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
    this.mostrarMensaje(`Descarga completada: ${nombre}`, 'success');
  }

  mostrarMensaje(msg: string, tipo: string) {
    this.mensaje = msg;
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
      alertBox.className = `alert alert-${tipo}`;
      alertBox.style.display = 'block';
      setTimeout(() => (alertBox.style.display = 'none'), 4000);
    }
  }
}
