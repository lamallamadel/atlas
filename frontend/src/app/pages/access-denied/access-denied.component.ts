import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { DsButtonComponent } from '../../design-system/primitives/ds-button/ds-button.component';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [DsButtonComponent],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.25,0.8,0.25,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class AccessDeniedComponent {
  constructor(private router: Router, private authService: AuthService) {}

  goToDashboard(): void { this.router.navigate(['/dashboard']); }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
