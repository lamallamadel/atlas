import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-session-expired',
    templateUrl: './session-expired.component.html',
    styleUrls: ['./session-expired.component.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ],
    imports: [MatIcon, MatButton]
})
export class SessionExpiredComponent {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
