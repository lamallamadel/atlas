import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsDialogService,
  DsIconComponent,
  DsInputComponent,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { OwnerAnnonce, OwnerApiService, OwnerProperty, ownerAnnonceState } from '../../services/owner-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { MANDATE_TYPE_LABELS, OwnerMandateApiService, OwnerRequest, REQUEST_STATUS } from '../../services/mandate-api.service';
import { OwnerMandateRequestDialogComponent } from './owner-mandate-request-dialog.component';

const VERIFICATION_STATUS: Record<string, { label: string; status: 'info' | 'success' | 'neutral' | 'error' }> = {
  NONE: { label: 'Non vérifié', status: 'neutral' },
  PENDING: { label: 'En cours de contrôle', status: 'info' },
  VERIFIED: { label: 'Bien vérifié', status: 'success' },
  REJECTED: { label: 'Titre non confirmé', status: 'error' },
};
import { OwnerPropertyDialogComponent } from './owner-property-dialog.component';

/**
 * Fiche d'un bien côté propriétaire (UC-P3) : texte de l'annonce, photos, publication. La
 * première annonce passe par la vérification d'Atlas avant d'être en ligne.
 */
@Component({
  selector: 'app-owner-property',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, FormsModule, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsIconComponent, DsInputComponent,
    DsSkeletonComponent, DsTextareaComponent, PageHeaderComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack op-page">
      <nav class="op-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/proprietaire">Mes biens</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        <span aria-current="page">{{ property()?.title || 'Bien' }}</span>
      </nav>

      @if (property(); as p) {
        <ds-page-header eyebrow="Mon bien" [titleBefore]="p.title" [description]="subtitle(p)">
          <ng-container slot="actions">
            <ds-button variant="ghost" size="md" prefixIcon="edit" (dsClick)="editProperty(p)">Modifier le bien</ds-button>
            @if (canPublish()) {
              <ds-button variant="marine" size="md" prefixIcon="send" [loading]="busy()" [disabled]="busy() || blockers().length > 0" (dsClick)="publish()">
                {{ annonce()?.moderationStatus === 'MOD_REJECTED' ? 'Renvoyer en vérification' : 'Publier' }}
              </ds-button>
            }
          </ng-container>
        </ds-page-header>

        <div class="op-layout">
          <div class="op-main">
            <ds-card [pad]="true" elevation="xs">
              <form class="ds-form-stack" #f="ngForm" (ngSubmit)="saveListing(f)">
                <h2 class="op-card-title">Annonce</h2>
                <ds-input label="Titre de l'annonce" name="title" [(ngModel)]="draft.title" required></ds-input>
                <ds-textarea label="Description (80 caractères au moins)" name="description" [rows]="6" [showCount]="true" [(ngModel)]="draft.description"></ds-textarea>
                <ds-input [label]="p.transactionType === 'RENT' ? 'Loyer mensuel (MAD)' : 'Prix (MAD)'" type="number" name="price" prefixIcon="coin" [(ngModel)]="draft.price"></ds-input>
                <div class="op-actions">
                  <ds-button variant="ghost" nativeType="submit" [loading]="saving()" [disabled]="saving() || !!f.invalid">
                    {{ annonce() ? 'Enregistrer' : 'Créer l\\'annonce' }}
                  </ds-button>
                </div>
              </form>
            </ds-card>

            <ds-card [pad]="true" elevation="xs">
              <div class="op-photos-head">
                <h2 class="op-card-title">Photos <span class="op-count">{{ annonce()?.photos?.length ?? 0 }}</span></h2>
                <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" multiple class="op-file" (change)="upload(fileInput)" aria-label="Ajouter des photos">
                <ds-button variant="ghost" size="sm" prefixIcon="image" [disabled]="!annonce() || uploading()" [loading]="uploading()" (dsClick)="fileInput.click()">Ajouter des photos</ds-button>
              </div>
              @if (!annonce()) {
                <p class="op-muted">Créez d'abord l'annonce pour ajouter des photos. Il en faut 3 au moins pour publier.</p>
              } @else if (!annonce()!.photos.length) {
                <p class="op-muted">Aucune photo. Ajoutez-en 3 au moins : séjour, cuisine, chambre, vue.</p>
              } @else {
                <ul class="op-photos" role="list">
                  @for (photo of annonce()!.photos; track photo.id) {
                    <li class="op-photo">
                      @if (photoUrls()[photo.id]; as url) { <img [src]="url" [alt]="'Photo ' + photo.id"> } @else { <ds-skeleton variant="rect" width="100%" height="100%"></ds-skeleton> }
                      <button type="button" class="op-photo__delete" (click)="deletePhoto(photo.id)" [attr.aria-label]="'Supprimer la photo ' + photo.id">
                        <ds-icon name="trash" [size]="16"></ds-icon>
                      </button>
                    </li>
                  }
                </ul>
              }
            </ds-card>
          </div>

          <aside class="op-side">
            <ds-card [pad]="true" elevation="xs">
              <div class="ds-form-stack">
                <div class="op-status-head">
                  <h2 class="op-card-title">Publication</h2>
                  <ds-badge [status]="state().status">{{ state().label }}</ds-badge>
                </div>
                <p class="op-muted">{{ statusText() }}</p>
                @if (annonce()?.moderationNote; as note) {
                  <div class="op-note" role="status"><strong>Message d'Atlas :</strong> {{ note }}</div>
                }
                @if (blockers().length && annonce()?.status !== 'PUBLISHED') {
                  <div>
                    <p class="op-subtitle">Avant de publier</p>
                    <ul class="op-blockers">
                      @for (b of blockers(); track b) { <li>{{ b }}</li> }
                    </ul>
                  </div>
                }
                @if (annonce()?.status === 'PUBLISHED') {
                  <ds-button variant="ghost" size="sm" [routerLink]="['/annonces', annonce()!.id]">Voir sur le portail</ds-button>
                  <ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="withdraw()">Retirer l'annonce</ds-button>
                }
                @if (annonce()?.moderationStatus === 'MOD_PENDING') {
                  <ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="withdraw()">Annuler la demande</ds-button>
                }
              </div>
            </ds-card>

            <ds-card [pad]="true" elevation="xs">
              <div class="ds-form-stack">
                <h2 class="op-card-title">Confier à un agent</h2>
                @if (mandateRequest(); as r) {
                  <div class="op-row">
                    <ds-badge [status]="requestStatus(r).status">{{ requestStatus(r).label }}</ds-badge>
                    <span class="op-muted">{{ requestSummary(r) }}</span>
                  </div>
                  @if (liveMandate(); as m) {
                    <ds-button variant="marine" size="md" [routerLink]="['/proprietaire/mandats', m.id]">Suivre le mandat</ds-button>
                  }
                  <ds-button variant="ghost" size="md" [routerLink]="['/proprietaire/demandes', r.id]">
                    {{ r.proposals.length ? 'Voir les propositions' : 'Voir la demande' }}
                  </ds-button>
                }
                @if (!mandateRequest() || canAskAgain()) {
                  <p class="op-muted">Une agence s'occupe des visites et de la négociation. Les agences ne voient ni votre adresse ni votre téléphone avant que vous en choisissiez une.</p>
                  <ds-button variant="ghost" size="md" prefixIcon="users" (dsClick)="askAgent(p)">Demander des propositions</ds-button>
                }
              </div>
            </ds-card>

            <ds-card [pad]="true" elevation="xs">
              <h2 class="op-card-title">Le bien</h2>
              <dl class="op-facts">
                <dt>Projet</dt><dd>{{ p.transactionType === 'RENT' ? 'Location' : 'Vente' }}</dd>
                <dt>Type</dt><dd>{{ p.propertyType || '—' }}</dd>
                <dt>Surface</dt><dd>{{ p.surface ? (p.surface + ' m²') : '—' }}</dd>
                <dt>Pièces</dt><dd>{{ p.rooms || '—' }}</dd>
                <dt>Prix souhaité</dt><dd>@if (p.expectedPrice) { {{ p.expectedPrice | number: '1.0-0' }} MAD } @else { — }</dd>
                <dt>Adresse</dt><dd>{{ p.address || '—' }} <span class="op-private"><ds-icon name="lock" [size]="12"></ds-icon> privée</span></dd>
                <dt>Titre foncier</dt><dd>{{ p.landTitleNumber || '—' }}</dd>
                <dt>Vérification</dt><dd><ds-badge [status]="verification().status">{{ verification().label }}</ds-badge></dd>
              </dl>
              @if (p.verificationStatus !== 'VERIFIED' && p.verificationStatus !== 'PENDING') {
                <div class="op-verify">
                  <p class="op-muted">{{ p.landTitleNumber
                    ? 'Atlas contrôle le titre foncier déclaré. Le badge « Bien vérifié » rassure acquéreurs et agences.'
                    : 'Ajoutez le numéro du titre foncier dans la fiche du bien pour obtenir le badge « Bien vérifié ».' }}</p>
                  @if (p.landTitleNumber) {
                    <ds-button variant="ghost" size="sm" prefixIcon="check" [disabled]="busy()" (dsClick)="requestVerification(p)">Faire vérifier le bien</ds-button>
                  }
                </div>
              }
            </ds-card>
          </aside>
        </div>
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="280px"></ds-skeleton>
      }
    </div>
  `,
  styles: [`
    .op-page { gap: var(--ds-space-6); }
    .op-breadcrumb { display: flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .op-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .op-breadcrumb a:hover, .op-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .op-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
    .op-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: var(--ds-space-6); align-items: start; }
    @media (max-width: 960px) { .op-layout { grid-template-columns: 1fr; } }
    .op-main, .op-side { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .op-card-title { margin: 0; font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .op-count { margin-left: var(--ds-space-1); font-weight: 400; color: var(--ds-text-muted); }
    .op-actions { display: flex; justify-content: flex-end; }
    .op-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .op-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2); }
    .op-subtitle { margin: 0 0 var(--ds-space-1); font-size: var(--ds-text-sm); font-weight: 600; color: var(--ds-text); }
    .op-blockers { margin: 0; padding-left: var(--ds-space-5); font-size: var(--ds-text-sm); color: var(--ds-text); }
    .op-note { padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-warning-hl); font-size: var(--ds-text-sm); color: var(--ds-text); }
    .op-status-head, .op-photos-head { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); margin-bottom: var(--ds-space-3); }
    .op-file { display: none; }
    .op-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--ds-space-3); margin: 0; padding: 0; list-style: none; }
    .op-photo { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: var(--ds-radius-md); background: var(--ds-surface-2); }
    .op-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-photo__delete { position: absolute; top: var(--ds-space-2); right: var(--ds-space-2); display: inline-flex; padding: var(--ds-space-1); border: none; border-radius: var(--ds-radius-sm); background: var(--ds-surface); color: var(--ds-error); cursor: pointer; }
    .op-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: var(--ds-space-3) 0 0; font-size: var(--ds-text-sm); }
    .op-facts dt { color: var(--ds-text-muted); }
    .op-facts dd { margin: 0; color: var(--ds-text); }
    .op-verify { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ds-space-2); margin-top: var(--ds-space-4); }
    .op-private { display: inline-flex; align-items: center; gap: 2px; margin-left: var(--ds-space-1); font-size: var(--ds-text-xs); color: var(--ds-text-faint); }
  `],
})
export class OwnerPropertyComponent implements OnInit, OnDestroy {
  private readonly api = inject(OwnerApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

  readonly property = signal<OwnerProperty | null>(null);
  private readonly mandateApi = inject(OwnerMandateApiService);
  /** Dernière demande d'accompagnement pour ce bien (lot B). */
  readonly mandateRequest = signal<OwnerRequest | null>(null);
  readonly canAskAgain = computed(() => {
    const r = this.mandateRequest();
    return !!r && (r.status === 'MREQ_EXPIRED' || r.status === 'MREQ_CANCELLED');
  });
  /** Mandat en cours (à signer ou actif) sur la dernière demande. */
  readonly liveMandate = computed(() =>
    this.mandateRequest()?.mandates.find(m => m.status === 'MANDATE_PENDING_SIGNATURE' || m.status === 'MANDATE_ACTIVE') ?? null);
  readonly verification = computed(() => VERIFICATION_STATUS[this.property()?.verificationStatus ?? 'NONE'] ?? VERIFICATION_STATUS['NONE']);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly busy = signal(false);
  readonly photoUrls = signal<Record<number, string>>({});

  readonly annonce = computed<OwnerAnnonce | null>(() => this.property()?.annonce ?? null);
  readonly state = computed(() => ownerAnnonceState(this.annonce()));
  readonly blockers = computed(() => this.annonce()?.blockers ?? ['Rédigez l’annonce']);
  readonly canPublish = computed(() => {
    const a = this.annonce();
    return !!a && a.status !== 'PUBLISHED' && a.moderationStatus !== 'MOD_PENDING';
  });

  draft: { title: string; description: string; price: number | string | null } = { title: '', description: '', price: null };
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();
  }

  ngOnDestroy(): void {
    Object.values(this.photoUrls()).forEach(url => URL.revokeObjectURL(url));
  }

  subtitle(p: OwnerProperty): string {
    return [p.city, p.district].filter(Boolean).join(' · ');
  }

  statusText(): string {
    const a = this.annonce();
    if (!a) return 'Rédigez l’annonce et ajoutez 3 photos, puis publiez.';
    if (a.status === 'PUBLISHED') return 'Votre annonce est visible sur le portail. Les contacts arrivent dans votre espace.';
    if (a.moderationStatus === 'MOD_PENDING') return 'Atlas vérifie votre première annonce, en général sous 4 heures ouvrées.';
    if (a.moderationStatus === 'MOD_REJECTED') return 'Corrigez l’annonce selon le message ci-dessous, puis renvoyez-la.';
    if (a.status === 'SUSPENDED') return 'Votre annonce est retirée du portail. Republiez-la quand vous voulez.';
    return 'Brouillon : invisible sur le portail tant que vous ne publiez pas.';
  }

  requestStatus(r: OwnerRequest) {
    return REQUEST_STATUS[r.status] ?? { label: r.status, status: 'neutral' as const };
  }

  requestSummary(r: OwnerRequest): string {
    const live = r.mandates.find(m => m.status === 'MANDATE_PENDING_SIGNATURE' || m.status === 'MANDATE_ACTIVE');
    if (live) return `Confié à ${live.agencyName} (${MANDATE_TYPE_LABELS[live.mandateType]?.toLowerCase() ?? live.mandateType}).`;
    const n = r.proposals.length;
    if (r.status !== 'MREQ_OPEN') return n ? `${n} proposition${n > 1 ? 's' : ''} reçue${n > 1 ? 's' : ''}.` : 'Aucune proposition.';
    return n ? `${n} proposition${n > 1 ? 's' : ''} à comparer.` : (r.visibility === 'MREQ_DIRECT' ? `En attente de ${r.targetAgencyName}.` : 'En attente des agences.');
  }

  requestVerification(p: OwnerProperty): void {
    this.busy.set(true);
    this.mandateApi.requestPropertyVerification(p.id).subscribe({
      next: r => {
        this.busy.set(false);
        this.property.set({ ...p, verificationStatus: r.verificationStatus });
        this.toast.success('Demande envoyée, Atlas contrôle le titre foncier');
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Demande impossible')); },
    });
  }

  askAgent(p: OwnerProperty): void {
    this.dialog.open<OwnerRequest>(OwnerMandateRequestDialogComponent, {
      data: { propertyId: p.id, propertyTitle: p.title, city: p.city, transactionType: p.transactionType, expectedPrice: p.expectedPrice },
      width: '640px',
    }).closed.subscribe(r => { if (r) this.mandateRequest.set(r); });
  }

  private loadMandateRequest(): void {
    this.mandateApi.requests().subscribe({
      next: list => this.mandateRequest.set(list.find(r => r.propertyId === this.id) ?? null),
      error: () => undefined,
    });
  }

  reload(): void {
    this.loadMandateRequest();
    this.api.property(this.id).subscribe({
      next: p => {
        this.property.set(p);
        this.loading.set(false);
        this.draft = {
          title: p.annonce?.title ?? p.title,
          description: p.annonce?.description ?? p.description ?? '',
          price: p.annonce?.price ?? p.expectedPrice,
        };
        this.loadPhotos(p.annonce);
      },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Bien introuvable')); },
    });
  }

  private loadPhotos(annonce: OwnerAnnonce | null): void {
    if (!annonce) return;
    const known = this.photoUrls();
    for (const photo of annonce.photos) {
      if (known[photo.id]) continue;
      this.api.photoBlobUrl(this.id, photo.id).subscribe({
        next: url => this.photoUrls.update(m => ({ ...m, [photo.id]: url })),
        error: () => undefined,
      });
    }
  }

  private setAnnonce(a: OwnerAnnonce): void {
    this.property.update(p => (p ? { ...p, annonce: a } : p));
    this.loadPhotos(a);
  }

  saveListing(form: NgForm): void {
    if (form.invalid || this.saving()) return;
    this.saving.set(true);
    const price = Number(this.draft.price);
    this.api.saveAnnonce(this.id, {
      title: this.draft.title.trim(),
      description: (this.draft.description || '').trim(),
      price: Number.isFinite(price) && price > 0 ? price : null,
    }).subscribe({
      next: a => { this.saving.set(false); this.setAnnonce(a); this.toast.success('Annonce enregistrée'); },
      error: err => { this.saving.set(false); this.toast.error(serverMessage(err, 'Enregistrement impossible')); },
    });
  }

  upload(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.uploading.set(true);
    this.api.addPhotos(this.id, files).subscribe({
      next: () => { this.uploading.set(false); this.toast.success(files.length > 1 ? `${files.length} photos ajoutées` : 'Photo ajoutée'); this.reload(); },
      error: err => { this.uploading.set(false); this.toast.error(serverMessage(err, 'Envoi des photos impossible')); },
    });
  }

  deletePhoto(mediaId: number): void {
    this.api.deletePhoto(this.id, mediaId).subscribe({
      next: () => {
        const url = this.photoUrls()[mediaId];
        if (url) URL.revokeObjectURL(url);
        this.reload();
      },
      error: err => this.toast.error(serverMessage(err, 'Suppression impossible')),
    });
  }

  publish(): void {
    this.busy.set(true);
    this.api.publish(this.id).subscribe({
      next: a => {
        this.busy.set(false);
        this.setAnnonce(a);
        this.toast.success(a.status === 'PUBLISHED' ? 'Annonce en ligne' : 'Annonce envoyée en vérification');
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Publication impossible')); },
    });
  }

  withdraw(): void {
    this.busy.set(true);
    this.api.withdraw(this.id).subscribe({
      next: a => { this.busy.set(false); this.setAnnonce(a); this.toast.success('Annonce retirée'); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Retrait impossible')); },
    });
  }

  editProperty(p: OwnerProperty): void {
    this.dialog.open<OwnerProperty>(OwnerPropertyDialogComponent, { data: { property: p }, width: '640px' })
      .closed.subscribe(updated => { if (updated) this.reload(); });
  }
}
