import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsSkeletonComponent,
  DsToastService,
} from '../design-system';
import {
  AnnonceReport,
  AnnonceReportApiService,
  AnnonceReportResolution,
  REPORT_REASON_LABELS,
} from '../services/annonce-report-api.service';
import { serverMessage } from './annonce-publication-panel.component';

/**
 * Signalements de l'annonce envoyés par les visiteurs du portail. L'agence les écarte ou suspend
 * l'annonce (ce qui la retire du portail et clôt tous ses signalements ouverts).
 */
@Component({
  selector: 'app-annonce-reports-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DsBadgeComponent, DsButtonComponent, DsCardComponent, DsSkeletonComponent],
  template: `
    @if (loading()) {
      <ds-card elevation="xs" class="rep-card"><ds-skeleton variant="text" width="50%" height="16px"></ds-skeleton></ds-card>
    } @else if (reports().length) {
      <ds-card elevation="xs" class="rep-card">
        <div class="rep-head">
          <h2 class="rep-title">Signalements</h2>
          @if (openCount()) {
            <ds-badge status="warning" size="sm">{{ openCount() }} à traiter</ds-badge>
          }
        </div>
        <ul class="rep-list">
          @for (r of reports(); track r.id) {
            <li class="rep-item" [class.rep-item--closed]="r.status === 'CLOSED'">
              <div class="rep-item__top">
                <strong>{{ reasonLabel(r) }}</strong>
                <span class="rep-muted">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              @if (r.comment) { <p class="rep-comment">« {{ r.comment }} »</p> }
              @if (r.reporterEmail) { <p class="rep-muted">Contact : {{ r.reporterEmail }}</p> }
              @if (r.status === 'OPEN') {
                <div class="rep-actions">
                  <ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="close(r, 'DISMISSED')">Écarter</ds-button>
                  <ds-button variant="danger" size="sm" [disabled]="busy()" (dsClick)="close(r, 'ANNONCE_SUSPENDED')">Suspendre l'annonce</ds-button>
                </div>
              } @else {
                <p class="rep-muted">
                  {{ r.resolution === 'ANNONCE_SUSPENDED' ? 'Annonce suspendue' : 'Écarté' }}
                  @if (r.closedBy) { par {{ r.closedBy }} }
                  @if (r.closedAt) { le {{ r.closedAt | date:'dd/MM/yyyy' }} }
                </p>
              }
            </li>
          }
        </ul>
      </ds-card>
    }
  `,
  styles: [`
    .rep-card { display: block; margin-top: var(--ds-space-4); }
    .rep-head { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); margin-bottom: var(--ds-space-3); }
    .rep-title { font-size: var(--ds-text-base); font-weight: 600; margin: 0; }
    .rep-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ds-space-3); }
    .rep-item { padding: var(--ds-space-3); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); font-size: var(--ds-text-sm); }
    .rep-item--closed { opacity: 0.7; }
    .rep-item__top { display: flex; justify-content: space-between; gap: var(--ds-space-3); }
    .rep-comment { margin: var(--ds-space-2) 0 0; }
    .rep-muted { margin: var(--ds-space-2) 0 0; font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .rep-actions { display: flex; gap: var(--ds-space-2); margin-top: var(--ds-space-3); }
  `],
})
export class AnnonceReportsPanelComponent implements OnInit {
  readonly annonceId = input.required<number>();
  /** Émis quand l'annonce a été suspendue, pour recharger la fiche. */
  readonly annonceSuspended = output<void>();

  private readonly api = inject(AnnonceReportApiService);
  private readonly toast = inject(DsToastService);

  readonly reports = signal<AnnonceReport[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly openCount = computed(() => this.reports().filter(r => r.status === 'OPEN').length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listForAnnonce(this.annonceId()).subscribe({
      next: list => { this.reports.set(list); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  close(report: AnnonceReport, resolution: AnnonceReportResolution): void {
    this.busy.set(true);
    this.api.close(report.id, resolution).subscribe({
      next: () => {
        this.busy.set(false);
        if (resolution === 'ANNONCE_SUSPENDED') {
          this.toast.success('Annonce suspendue : elle n\'apparaît plus sur le portail');
          this.annonceSuspended.emit();
        } else {
          this.toast.success('Signalement écarté');
        }
        this.load();
      },
      error: err => {
        this.busy.set(false);
        this.toast.error(serverMessage(err, "L'opération a échoué"));
        this.load();
      },
    });
  }

  reasonLabel(r: AnnonceReport): string {
    return REPORT_REASON_LABELS[r.reasonCode] ?? r.reasonCode;
  }
}
