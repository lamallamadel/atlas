import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-expired',
  templateUrl: './session-expired.component.html',
  styleUrls: ['./session-expired.component.css']
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
