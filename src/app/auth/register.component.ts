import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../core/env';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  firstname = '';
  lastname = '';
  username = '';
  password = '';
  confirm = '';
  error = '';
  success = '';
  private base = environment.apiUrl.replace(/\/+$/, '');

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.error = '';
    this.success = '';

    if (!this.username || !this.password || !this.firstname || !this.lastname) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (this.password !== this.confirm) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    //  Enviar con nombre y apellido separados
    const newUser = {
      username: this.username,
      passwordHash: this.password,
      firstname: this.firstname,
      lastname: this.lastname
    };

    this.http.post(`${this.base}/auth/register`, newUser).subscribe({
      next: () => {
        this.success = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo registrar el usuario.';
      }
    });
  }
}
