import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      // Cas d'usage n°1 : un compte propriétaire n'a pas d'espace Pro, il va dans le sien.
      const url = state.url || '';
      // « /proprietaire » commence aussi par « /pro » : on teste le segment entier.
      if (this.authService.hasRole('OWNER') && (url === '/pro' || url.startsWith('/pro/') || url.startsWith('/pro?'))) {
        return this.router.createUrlTree(['/proprietaire']);
      }
      return true;
    }

    sessionStorage.setItem('returnUrl', state.url || '/dashboard');
    return this.router.createUrlTree(['/login']);
  }
}
