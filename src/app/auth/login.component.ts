import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './login.component.html'
})
export class LoginComponent {
  u = '';
  p = '';
  error = '';

  constructor(private auth: AuthService) {}

  login() {
    this.error = '';
    this.auth.login(this.u, this.p).subscribe({
      error: (e) => {
        this.error = e?.error?.message ?? 'Credenciales inválidas';
      }
    });
  }
}
