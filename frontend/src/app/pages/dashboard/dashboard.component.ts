import { Component, OnInit } from '@angular/core';
import { PingService } from '../../services/ping.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  apiStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  lastChecked: Date | null = null;
  errorMessage = '';

  constructor(private pingService: PingService) { }

  ngOnInit(): void {
    this.checkApiConnection();
  }

  checkApiConnection(): void {
    this.apiStatus = 'checking';
    this.errorMessage = '';

    this.pingService.ping().subscribe({
      next: (response) => {
        this.apiStatus = 'connected';
        this.lastChecked = new Date();
      },
      error: (error) => {
        this.apiStatus = 'disconnected';
        this.lastChecked = new Date();
        this.errorMessage = error.status ?
          `HTTP ${error.status}: ${error.statusText}` :
          'Unable to reach the API server';
      }
    });
  }
}
