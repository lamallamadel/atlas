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
  FollowUpKind,
  PitchPurpose,
  PitchSendResult,
  ReplyIntent,
  VisitPlanResult,
} from '../services/annonce-buyer-matches-api.service';
import { AnnonceVisitPlannerComponent } from './annonce-visit-planner.component';
import { AnnoncePitchComposerComponent } from './annonce-pitch-composer.component';
import { scoreStatus } from './dossier-matching.component';
import type { DsBadgeStatus } from '../design-system';

/** Libellé et couleur de la réponse du client. */
export const REPLY_LABELS: Record<ReplyIntent, { label: string; status: DsBadgeStatus }> = {
  VISITE: { label: 'Veut visiter', status: 'success' },
  INTERESSE: { label: 'Intéressé', status: 'info' },
  NEGOCIATION: { label: 'Discute le prix', status: 'warning' },
  QUESTION: { label: 'Pose une question', status: 'info' },
  PAS_INTERESSE: { label: 'Pas intéressé', status: 'error' },
  AUTRE: { label: 'A répondu', status: 'neutral' },
};

/** Une visite peut être planifiée tant que le client n'a pas refusé et qu'aucune n'existe. */
export function canPlanVisit(m: BuyerMatch): boolean {
  return !!m.replyIntent && m.replyIntent !== 'PAS_INTERESSE' && !m.visitAppointmentId;
}

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
    AnnonceVisitPlannerComponent,
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
  readonly composerPurpose = signal<PitchPurpose>('PITCH');
  readonly followUpCount = computed(() => this.matches().filter((m) => !!m.followUpKind).length);
  readonly followUpLabels: Record<FollowUpKind, string> = {
    AGENT_REPLY_DUE: 'À relancer : le client attend votre réponse depuis plus de 24 h',
    CLIENT_SILENT: "À relancer : pas de réponse du client depuis 3 jours",
  };
  /** Acheteur pour lequel le formulaire de visite est ouvert. */
  readonly plannerFor = signal<number | null>(null);
  replyLabel(intent: ReplyIntent): { label: string; status: DsBadgeStatus } {
    return REPLY_LABELS[intent] ?? REPLY_LABELS.AUTRE;
  }
  readonly canPlanVisit = canPlanVisit;

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

  toggleComposer(m: BuyerMatch, purpose: PitchPurpose = 'PITCH'): void {
    const sameOpen = this.composerFor() === m.id && this.composerPurpose() === purpose;
    this.composerPurpose.set(purpose);
    this.composerFor.set(sameOpen ? null : m.id);
  }

  /** Relance faite autrement (téléphone…) : le rappel disparaît. */
  followUpDone(m: BuyerMatch): void {
    this.busyId.set(m.id);
    this.api.followUpDone(this.annonceId(), m.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.matches.update((list) => list.map((x) => (x.id === m.id ? { ...x, followUpKind: null } : x)));
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error("L'opération a échoué");
      },
    });
  }

  onPitchSent(m: BuyerMatch, r: PitchSendResult): void {
    this.composerFor.set(null);
    this.matches.update((list) =>
      list.map((x) =>
        x.id === m.id
          ? {
              ...x,
              pitchedAt: r.pitchedAt,
              pitchChannel: r.channel,
              status: x.status === 'NEW' ? 'SEEN' : x.status,
              followUpKind: null,
            }
          : x,
      ),
    );
  }

  followUpLabel(kind: FollowUpKind): string {
    return this.followUpLabels[kind] ?? 'À relancer';
  }

  channelLabel(c: string | null): string {
    return c === 'SMS' ? 'SMS' : 'WhatsApp';
  }

  togglePlanner(m: BuyerMatch): void {
    this.plannerFor.update((id) => (id === m.id ? null : m.id));
  }

  onVisitPlanned(m: BuyerMatch, r: VisitPlanResult): void {
    this.plannerFor.set(null);
    this.matches.update((list) =>
      list.map((x) => (x.id === m.id ? { ...x, visitAppointmentId: r.appointmentId, proposedStart: r.startTime, proposedEnd: r.endTime } : x)),
    );
  }
}
