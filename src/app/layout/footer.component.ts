import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  template: `
  <footer class="app-footer-adv text-white">
    <div class="container-fluid p-4 pb-0">
      <section>
        <div class="row gy-4">

        
          <div class="col-12 col-lg-4">
            <h6 class="text-uppercase fw-semibold mb-3">Centreo de Diagnóstico Completo</h6>
            <p class="mb-0 small pe-lg-5">
              Tu Laboratorio de Confianza, a tu alcance.
            </p>
          </div>

         
          <div class="col-6 col-lg-2">
            <h6 class="text-uppercase fw-semibold mb-3">Módulos</h6>
            <ul class="list-unstyled small mb-0 footer-links">
              <li><a routerLink="/persona" class="link-light">Personas</a></li>
              <li><a routerLink="/insumolaboratorio" class="link-light">Insumos</a></li>
              <li><a routerLink="/cita" class="link-light">Citas</a></li>
              <li><a routerLink="/pago" class="link-light">Pagos</a></li>
              <li><a routerLink="/examen" class="link-light">Examenes</a></li>
              <li><a routerLink="/reportes" class="link-light">Reportes</a></li>
            </ul>
          </div>

          
          <div class="col-12 col-lg-3">
            <h6 class="text-uppercase fw-semibold mb-3">Contacto</h6>
            <ul class="list-unstyled small mb-0 footer-contact">
              <li class="d-flex gap-2 mb-2">
                <i class="bi bi-geo-alt"></i>
                <span>Poptún, Petén, Guatemala</span>
              </li>
              <li class="d-flex gap-2 mb-2">
                <i class="bi bi-envelope"></i>
                <span>{{ 'info@labclinic.com' }}</span>

              </li>
              <li class="d-flex gap-2 mb-2">
                <i class="bi bi-telephone"></i>
                <span>+ (502) 7756 5791</span>
              </li>
            
            </ul>
          </div>

          
          <div class="col-6 col-lg-3">
            <h6 class="text-uppercase fw-semibold mb-3">Síganos</h6>
            <div class="social d-flex gap-2 flex-wrap">
              <a class="btn btn-icon rounded-circle" style="background:#3b5998" href="#"><i class="bi bi-facebook"></i></a>
              <a class="btn btn-icon rounded-circle" style="background:#55acee" href="#"><i class="bi bi-twitter-x"></i></a>
              <a class="btn btn-icon rounded-circle" style="background:#dd4b39" href="#"><i class="bi bi-google"></i></a>
              <a class="btn btn-icon rounded-circle" style="background:#ac2bac" href="#"><i class="bi bi-instagram"></i></a>
              <a class="btn btn-icon rounded-circle" style="background:#0a66c2" href="#"><i class="bi bi-linkedin"></i></a>
              <a class="btn btn-icon rounded-circle" style="background:#333333" href="#"><i class="bi bi-github"></i></a>
            </div>
          </div>

        </div>
      </section>
    </div>

    
    <div class="copy text-center small">
      © {{year}} Lab Clinic por Jose Gongora
    </div>
  </footer>
  `,
  styles: [`
    .app-footer-adv{
      background:#8f9cba;           
      border-top:1px solid rgba(0,0,0,.08);
      margin-top:auto;               
      border-radius:12px;            
      overflow:hidden;
    }
    .app-footer-adv .copy{
      background: rgba(0,0,0,.18);
      padding:.6rem 1rem;
    }

    .footer-links li + li { margin-top:.35rem; }
    .footer-links a { text-decoration:none; opacity:.9; }
    .footer-links a:hover { opacity:1; text-decoration:underline; }

    .footer-contact i { font-size:1.05rem; opacity:.9; }

    .social .btn-icon{
      width:40px; height:40px; border:0;
      display:inline-flex; align-items:center; justify-content:center;
      color:#fff; box-shadow:0 4px 14px rgba(0,0,0,.12);
      transition:transform .12s ease, filter .12s ease;
    }
    .social .btn-icon:hover{ transform:translateY(-2px); filter:brightness(1.05); }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
