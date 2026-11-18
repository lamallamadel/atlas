import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsBadgeStatus,
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsFilterChipComponent,
  DsIconComponent,
  DsInputComponent,
  DsRadioGroupComponent,
  DsRadioOption,
  DsSkeletonComponent,
  DsToastService,
} from '../design-system';
import {
  DossierMatchesResponse,
  DossierMatchingApiService,
  DossierSearchCriteria,
  MatchScope,
} from '../services/dossier-matching-api.service';

export interface ChoiceOption {
  value: string;
  label: string;
}

export const TRANSACTION_OPTIONS: ChoiceOption[] = [
  { value: 'SALE', label: 'Achat' },
  { value: 'RENT', label: 'Location' },
];
export const CATEGORY_OPTIONS: ChoiceOption[] = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];
/** Mêmes clés que les synonymes du brain (brain/match/engine.py). */
export const EQUIPMENT_OPTIONS: ChoiceOption[] = [
  'parking', 'climatisation', 'ascenseur', 'piscine', 'jardin', 'terrasse', 'balcon',
  'cuisine équipée', 'vue mer', 'chauffage', 'cheminée', 'concierge',
].map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }));
export const CONDITION_OPTIONS: ChoiceOption[] = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon_etat', label: 'Bon état' },
  { value: 'a_rafraichir', label: 'À rafraîchir' },
  { value: 'a_renover', label: 'À rénover' },
];
const EXCLUSION_LABELS: Record<string, string> = {
  'type de transaction': 'type de transaction',
  'catégorie': 'catégorie',
  ville: 'ville',
  budget: 'budget',
};

/** Valeurs du formulaire (les champs numériques sont saisis comme du texte). */
export interface CriteriaForm {
  transactionTypes: string[];
  categories: string[];
  cities: string;
  budgetMin: string;
  budgetMax: string;
  surfaceMin: string;
  surfaceMax: string;
  furnished: 'any' | 'yes' | 'no';
  equipments: string[];
  acceptedConditions: string[];
}

export function emptyForm(): CriteriaForm {
  return {
    transactionTypes: [], categories: [], cities: '', budgetMin: '', budgetMax: '',
    surfaceMin: '', surfaceMax: '', furnished: 'any', equipments: [], acceptedConditions: [],
  };
}

function toNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function formToCriteria(f: CriteriaForm): DossierSearchCriteria {
  return {
    transactionTypes: f.transactionTypes,
    categories: f.categories,
    cities: f.cities.split(',').map((c) => c.trim()).filter(Boolean),
    budgetMin: toNumber(f.budgetMin),
    budgetMax: toNumber(f.budgetMax),
    surfaceMin: toNumber(f.surfaceMin),
    surfaceMax: toNumber(f.surfaceMax),
    furnished: f.furnished === 'any' ? null : f.furnished === 'yes',
    equipments: f.equipments,
    acceptedConditions: f.acceptedConditions,
  };
}

export function criteriaToForm(c: DossierSearchCriteria): CriteriaForm {
  const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));
  return {
    transactionTypes: c.transactionTypes ?? [],
    categories: c.categories ?? [],
    cities: (c.cities ?? []).join(', '),
    budgetMin: str(c.budgetMin),
    budgetMax: str(c.budgetMax),
    surfaceMin: str(c.surfaceMin),
    surfaceMax: str(c.surfaceMax),
    furnished: c.furnished === null || c.furnished === undefined ? 'any' : c.furnished ? 'yes' : 'no',
    equipments: c.equipments ?? [],
    acceptedConditions: c.acceptedConditions ?? [],
  };
}

/** Erreur à afficher avant l'envoi, ou null. */
export function validateCriteria(c: DossierSearchCriteria): string | null {
  const empty =
    !c.transactionTypes.length && !c.categories.length && !c.cities.length && c.budgetMin === null &&
    c.budgetMax === null && c.surfaceMin === null && c.surfaceMax === null && c.furnished === null &&
    !c.equipments.length && !c.acceptedConditions.length;
  if (empty) return 'Renseignez au moins un critère.';
  for (const v of [c.budgetMin, c.budgetMax, c.surfaceMin, c.surfaceMax]) {
    if (v !== null && v < 0) return 'Les montants et surfaces doivent être positifs.';
  }
  if (c.budgetMin !== null && c.budgetMax !== null && c.budgetMin > c.budgetMax) {
    return 'Le budget minimum dépasse le budget maximum.';
  }
  if (c.surfaceMin !== null && c.surfaceMax !== null && c.surfaceMin > c.surfaceMax) {
    return 'La surface minimum dépasse la surface maximum.';
  }
  return null;
}

export function scoreStatus(score: number): DsBadgeStatus {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  return 'warning';
}

export function exclusionSummary(excluded: Record<string, number>): string | null {
  const parts = Object.entries(excluded)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} (${EXCLUSION_LABELS[k] ?? k})`);
  return parts.length ? `Écartés : ${parts.join(', ')}` : null;
}

/**
 * Critères de recherche d'un acheteur ou locataire, et biens correspondants avec leur score,
 * ce qui correspond et ce qui ne correspond pas (ou n'a pas pu être vérifié).
 */
@Component({
  selector: 'app-dossier-matching',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsEmptyStateComponent,
    DsFilterChipComponent,
    DsIconComponent,
    DsInputComponent,
    DsRadioGroupComponent,
    DsSkeletonComponent,
  ],
  templateUrl: './dossier-matching.component.html',
  styleUrls: ['./dossier-matching.component.scss'],
})
export class DossierMatchingComponent implements OnInit {
  readonly dossierId = input.required<number>();

  private readonly api = inject(DossierMatchingApiService);
  private readonly toast = inject(DsToastService);

  readonly transactionOptions = TRANSACTION_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly equipmentOptions = EQUIPMENT_OPTIONS;
  readonly conditionOptions = CONDITION_OPTIONS;
  readonly furnishedOptions: DsRadioOption[] = [
    { value: 'any', label: 'Indifférent' },
    { value: 'yes', label: 'Meublé' },
    { value: 'no', label: 'Non meublé' },
  ];

  form: CriteriaForm = emptyForm();
  readonly hasCriteria = signal(false);
  readonly loadingCriteria = signal(true);
  readonly saving = signal(false);
  readonly searching = signal(false);
  readonly formError = signal<string | null>(null);
  readonly unavailable = signal(false);
  readonly scope = signal<MatchScope>('ALL');
  readonly result = signal<DossierMatchesResponse | null>(null);
  readonly exclusion = computed(() => {
    const r = this.result();
    return r ? exclusionSummary(r.excluded) : null;
  });

  readonly scoreStatus = scoreStatus;

  ngOnInit(): void {
    this.api.getCriteria(this.dossierId()).subscribe({
      next: (c) => {
        this.loadingCriteria.set(false);
        if (c) {
          this.form = criteriaToForm(c);
          this.hasCriteria.set(true);
          this.search();
        }
      },
      error: () => {
        this.loadingCriteria.set(false);
        this.toast.error('Impossible de charger les critères de recherche');
      },
    });
  }

  isSelected(list: string[], value: string): boolean {
    return list.includes(value);
  }

  toggle(list: string[], value: string): void {
    const i = list.indexOf(value);
    if (i >= 0) list.splice(i, 1);
    else list.push(value);
  }

  saveAndSearch(): void {
    const criteria = formToCriteria(this.form);
    const error = validateCriteria(criteria);
    this.formError.set(error);
    if (error) return;
    this.saving.set(true);
    this.api.saveCriteria(this.dossierId(), criteria).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.form = criteriaToForm(saved);
        this.hasCriteria.set(true);
        this.search();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || err?.error?.detail || "Les critères n'ont pas pu être enregistrés");
      },
    });
  }

  setScope(scope: MatchScope): void {
    if (this.scope() === scope) return;
    this.scope.set(scope);
    if (this.hasCriteria()) this.search();
  }

  search(): void {
    this.searching.set(true);
    this.unavailable.set(false);
    this.api.matches(this.dossierId(), this.scope()).subscribe({
      next: (r) => {
        this.searching.set(false);
        this.result.set(r);
      },
      error: (err) => {
        this.searching.set(false);
        if (err?.status === 503) {
          this.unavailable.set(true);
        } else {
          this.toast.error('La recherche de biens a échoué');
        }
      },
    });
  }
}
