import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LeadScoringApiService, LeadPriority } from '../services/lead-scoring-api.service';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsCardComponent, 
  DsBadgeComponent,
  DsSkeletonComponent,
  DsToastService
} from '../design-system';

@Component({
  selector: 'app-lead-priority-queue',
  standalone: true,
  imports: [
    CommonModule,
    DsCardComponent,
    DsButtonComponent,
    DsIconComponent,
    DsBadgeComponent,
    DsSkeletonComponent
  ],
  templateUrl: './lead-priority-queue.component.html',
  styleUrls: ['./lead-priority-queue.component.css']
})
export class LeadPriorityQueueComponent implements OnInit {
  private leadScoringApi = inject(LeadScoringApiService);
  private router = inject(Router);
  private toastService = inject(DsToastService);

  leads: LeadPriority[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading = true;
    this.leadScoringApi.getPriorityQueue(50).subscribe({
      next: (leads) => {
        this.leads = leads;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading priority queue:', error);
        this.toastService.error('Échec du chargement de la file de priorité');
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.loadLeads();
  }

  recalculateAll(): void {
    this.loading = true;
    this.leadScoringApi.recalculateAllScores().subscribe({
      next: () => {
        this.toastService.success('Recalcul des scores initié');
        setTimeout(() => this.loadLeads(), 2000);
      },
      error: (error) => {
        console.error('Error recalculating scores:', error);
        this.toastService.error('Échec du recalcul des scores');
        this.loading = false;
      }
    });
  }

  viewDossier(dossierId: number): void {
    this.router.navigate(['/dossiers', dossierId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins}m`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  getUrgencyLabel(level: string): string {
    const labels: { [key: string]: string } = {
      urgent: 'URGENT',
      high: 'HAUT',
      medium: 'MOYEN',
      low: 'BAS'
    };
    return labels[level] || level.toUpperCase();
  }

  getUrgencyBadgeStatus(level: string): any {
    switch (level) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'active';
      case 'low': return 'neutral';
      default: return 'neutral';
    }
  }
}
