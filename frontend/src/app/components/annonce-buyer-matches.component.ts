import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsIconComponent,
  DsSkeletonComponent,
  DsToastService,
} from '../design-system';
import {
  AnnonceBuyerMatchesApiService,
  BuyerMatch,
  PitchSendResult,
} from '../services/annonce-buyer-matches-api.service';
import { AnnoncePitchComposerComponent } from './annonce-pitch-composer.component';
import { scoreStatus } from './dossier-matching.component';

/** Ordre d'affichage : écartés en dernier, puis score décroissant. */
export function sortMatches(list: BuyerMatch[]): BuyerMatch[] {
  return [...list].sort((a, b) => {
    const da = a.status === 'DISMISSED' ? 1 : 0;
    const db = b.status === 'DISMISSED' ? 1 : 0;
    return da - db || b.score - a.score || a.id - b.id;
  });
}

/**
 * Acheteurs potentiels : dossiers dont les critères de recherche correspondent à cette annonce.
 * Calculés automatiquement à la création ou modification de l'annonce et après l'analyse des photos.
 */
@Component({
  selector: 'app-annonce-buyer-matches',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    AnnoncePitchComposerComponent,
    RouterLink,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsEmptyStateComponent,
    DsIconComponent,
    DsSkeletonComponent,
  ],
  templateUrl: './annonce-buyer-matches.component.html',
  styleUrls: ['./annonce-buyer-matches.component.scss'],
})
export class AnnonceBuyerMatchesComponent implements OnInit {
  readonly annonceId = input.required<number>();

  private readonly api = inject(AnnonceBuyerMatchesApiService);
  private readonly toast = inject(DsToastService);

  readonly matches = signal<BuyerMatch[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly loadError = signal(false);
  readonly busyId = signal<number | null>(null);
  /** Acheteur pour lequel l'éditeur de proposition est ouvert. */
  readonly composerFor = signal<number | null>(null);

  readonly active = computed(() => this.matches().filter((m) => m.status !== 'DISMISSED'));
  readonly dismissed = computed(() => this.matches().filter((m) => m.status === 'DISMISSED'));
  readonly newCount = computed(() => this.matches().filter((m) => m.status === 'NEW').length);
  readonly scoreStatus = scoreStatus;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.list(this.annonceId()).subscribe({
      next: (list) => {
        this.matches.set(sortMatches(list));
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.refreshing.set(true);
    this.api.refresh(this.annonceId()).subscribe({
      next: (list) => {
        this.matches.set(sortMatches(list));
        this.refreshing.set(false);
        const n = list.filter((m) => m.status !== 'DISMISSED').length;
        this.toast.success(n ? `${n} acheteur(s) correspondant(s)` : 'Aucun acheteur ne correspond pour le moment');
      },
      error: (e: HttpErrorResponse) => {
        this.refreshing.set(false);
        this.toast.error(
          e?.status === 503 ? "Le service d'IA est indisponible, réessayez plus tard" : 'La recherche d\'acheteurs a échoué',
        );
      },
    });
  }

  toggleDismiss(m: BuyerMatch): void {
    const dismissing = m.status !== 'DISMISSED';
    const call = dismissing
      ? this.api.dismiss(this.annonceId(), m.id)
      : this.api.undismiss(this.annonceId(), m.id);
    this.busyId.set(m.id);
    call.subscribe({
      next: () => {
        this.busyId.set(null);
        const status = dismissing ? 'DISMISSED' : 'SEEN';
        this.matches.update((list) => sortMatches(list.map((x) => (x.id === m.id ? { ...x, status } : x))));
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error("L'opération a échoué");
      },
    });
  }

  toggleComposer(m: BuyerMatch): void {
    this.composerFor.update((id) => (id === m.id ? null : m.id));
  }

  onPitchSent(m: BuyerMatch, r: PitchSendResult): void {
    this.composerFor.set(null);
    this.matches.update((list) =>
      list.map((x) =>
        x.id === m.id
          ? { ...x, pitchedAt: r.pitchedAt, pitchChannel: r.channel, status: x.status === 'NEW' ? 'SEEN' : x.status }
          : x,
      ),
    );
  }

  channelLabel(c: string | null): string {
    return c === 'SMS' ? 'SMS' : 'WhatsApp';
  }
}
