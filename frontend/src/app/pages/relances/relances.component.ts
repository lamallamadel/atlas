import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsBadgeStatus,
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsFilterChipComponent,
  DsIconComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { AnnonceBuyerMatchesApiService, BuyerMatch, ReplyIntent } from '../../services/annonce-buyer-matches-api.service';
import { BuyerInboxApiService, BuyerInboxItem, InboxSection, toBuyerMatch } from '../../services/buyer-inbox-api.service';
import { REPLY_LABELS } from '../../components/annonce-buyer-matches.component';
import { AnnoncePitchComposerComponent } from '../../components/annonce-pitch-composer.component';
import { AnnonceVisitPlannerComponent } from '../../components/annonce-visit-planner.component';

export const SECTION_INFO: Record<InboxSection, { title: string; empty: string; icon: string }> = {
  FOLLOW_UP: { title: 'À relancer', empty: 'Aucune relance en attente.', icon: 'clock' },
  VISIT_TO_PLAN: { title: 'Visites à planifier', empty: 'Aucune visite demandée en attente.', icon: 'calendar' },
  RECENT_REPLY: { title: 'Réponses récentes', empty: 'Aucune réponse ces 7 derniers jours.', icon: 'whatsapp' },
  UPCOMING_VISIT: { title: 'Visites prévues', empty: 'Aucune visite prévue.', icon: 'check' },
};
export const SECTIONS: InboxSection[] = ['FOLLOW_UP', 'VISIT_TO_PLAN', 'RECENT_REPLY', 'UPCOMING_VISIT'];

/** « attend depuis 26 h », « depuis 3 j ». */
export function waitingLabel(since: string | null, now = new Date()): string | null {
  if (!since) return null;
  const hours = Math.floor((now.getTime() - new Date(since).getTime()) / 3_600_000);
  if (hours < 1) return "depuis moins d'une heure";
  return hours < 48 ? `depuis ${hours} h` : `depuis ${Math.floor(hours / 24)} j`;
}

type OpenPanel = { matchId: number; kind: 'follow-up' | 'plan' };

/**
 * Relances : toutes annonces confondues, les clients qui attendent l'agent, les visites demandées
 * à planifier, les réponses récentes et les visites prévues — par ordre d'urgence.
 */
@Component({
  selector: 'app-relances',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsEmptyStateComponent,
    DsFilterChipComponent,
    DsIconComponent,
    DsSkeletonComponent,
    PageHeaderComponent,
    AnnoncePitchComposerComponent,
    AnnonceVisitPlannerComponent,
  ],
  templateUrl: './relances.component.html',
  styleUrls: ['./relances.component.scss'],
})
export class RelancesComponent implements OnInit {
  private readonly api = inject(BuyerInboxApiService);
  private readonly matchesApi = inject(AnnonceBuyerMatchesApiService);
  private readonly toast = inject(DsToastService);

  readonly sections = SECTIONS;
  readonly info = SECTION_INFO;
  readonly waitingLabel = waitingLabel;
  readonly toBuyerMatch = toBuyerMatch;

  readonly items = signal<BuyerInboxItem[]>([]);
  readonly counts = signal<Record<InboxSection, number>>({ FOLLOW_UP: 0, VISIT_TO_PLAN: 0, RECENT_REPLY: 0, UPCOMING_VISIT: 0 });
  readonly mine = signal(true);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly open = signal<OpenPanel | null>(null);
  readonly busyId = signal<number | null>(null);

  readonly total = computed(() => this.items().length);
  readonly urgent = computed(() => this.counts().FOLLOW_UP + this.counts().VISIT_TO_PLAN);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.inbox(this.mine()).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.counts.set(r.counts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  setMine(mine: boolean): void {
    if (this.mine() === mine) return;
    this.mine.set(mine);
    this.open.set(null);
    this.load();
  }

  itemsOf(section: InboxSection): BuyerInboxItem[] {
    return this.items().filter((i) => i.section === section);
  }

  replyLabel(intent: ReplyIntent | null): { label: string; status: DsBadgeStatus } | null {
    return intent ? REPLY_LABELS[intent] ?? REPLY_LABELS.AUTRE : null;
  }

  /** Depuis quand le client attend (ou depuis quand il est silencieux). */
  waitingSince(i: BuyerInboxItem): string | null {
    if (i.section === 'FOLLOW_UP') {
      return i.followUpKind === 'AGENT_REPLY_DUE' ? i.replyAt : i.pitchedAt;
    }
    return i.section === 'VISIT_TO_PLAN' ? i.replyAt : null;
  }

  isOpen(i: BuyerInboxItem, kind: OpenPanel['kind']): boolean {
    const o = this.open();
    return !!o && o.matchId === i.matchId && o.kind === kind;
  }

  toggle(i: BuyerInboxItem, kind: OpenPanel['kind']): void {
    this.open.set(this.isOpen(i, kind) ? null : { matchId: i.matchId, kind });
  }

  match(i: BuyerInboxItem): BuyerMatch {
    return toBuyerMatch(i);
  }

  followUpDone(i: BuyerInboxItem): void {
    this.busyId.set(i.matchId);
    this.matchesApi.followUpDone(i.annonceId, i.matchId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error("L'opération a échoué");
      },
    });
  }

  /** Après un envoi ou une planification : la ligne change de section. */
  done(): void {
    this.open.set(null);
    this.load();
  }
}
