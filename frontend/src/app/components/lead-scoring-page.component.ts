import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadPriorityQueueComponent } from './lead-priority-queue.component';
import { LeadScoringConfigDialogComponent } from './lead-scoring-config-dialog.component';
import { LeadScoringApiService, LeadScoringConfig } from '../services/lead-scoring-api.service';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsCardComponent, 
  DsTabsComponent, 
  DsTab, 
  DsToastService,
  DsDialogService,
  PageHeaderComponent
} from '../design-system';

@Component({
  selector: 'app-lead-scoring-page',
  standalone: true,
  imports: [
    CommonModule,
    LeadPriorityQueueComponent,
    DsButtonComponent,
    DsIconComponent,
    DsCardComponent,
    DsTabsComponent,
    PageHeaderComponent
  ],
  templateUrl: './lead-scoring-page.component.html',
  styleUrls: ['./lead-scoring-page.component.css']
})
export class LeadScoringPageComponent implements OnInit {
  private dsDialogService = inject(DsDialogService);
  private leadScoringApi = inject(LeadScoringApiService);
  private toastService = inject(DsToastService);

  activeConfig: LeadScoringConfig | null = null;
  activeTab = 'queue';

  readonly tabs: DsTab[] = [
    { value: 'queue', label: 'File de priorité', badge: 'En direct' },
    { value: 'about', label: 'À propos du Scoring' }
  ];

  ngOnInit(): void {
    this.loadActiveConfig();
  }

  loadActiveConfig(): void {
    this.leadScoringApi.getActiveConfig().subscribe({
      next: (config) => {
        this.activeConfig = config;
      },
      error: (error) => {
        console.error('Error loading active config:', error);
      }
    });
  }

  openConfigDialog(): void {
    const dialogRef = this.dsDialogService.open<LeadScoringConfig>(LeadScoringConfigDialogComponent, {
      width: '800px',
      data: { config: this.activeConfig }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.loadActiveConfig();
      }
    });
  }
}
