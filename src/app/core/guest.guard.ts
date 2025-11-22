import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = auth['_logged']?.value || false;

  if (isLoggedIn && localStorage.getItem('token')) {
    router.navigate(['/home']);
    return false;
  }
  return true;
};
