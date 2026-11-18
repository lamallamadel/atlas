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
  CriteriaSuggestion,
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

const FIELD_LABELS: Record<string, string> = {
  transactionTypes: 'Projet', categories: 'Type de bien', cities: 'Villes', budgetMin: 'Budget minimum',
  budgetMax: 'Budget maximum', surfaceMin: 'Surface minimum', surfaceMax: 'Surface maximum',
  furnished: 'Mobilier', equipments: 'Équipements', acceptedConditions: 'États acceptés',
};

function optionLabel(options: ChoiceOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export interface SuggestionLine {
  field: string;
  label: string;
  value: string;
  evidence: string | null;
}

/** Lignes lisibles d'une suggestion (champ, valeur, citation du client). */
export function suggestionLines(s: CriteriaSuggestion): SuggestionLine[] {
  const out: SuggestionLine[] = [];
  const c = s.suggestion;
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const push = (field: string, value: string | null) => {
    if (value) out.push({ field, label: FIELD_LABELS[field], value, evidence: s.evidence[field] ?? null });
  };
  push('transactionTypes', c.transactionTypes?.map((v) => optionLabel(TRANSACTION_OPTIONS, v)).join(', ') || null);
  push('categories', c.categories?.map((v) => optionLabel(CATEGORY_OPTIONS, v)).join(', ') || null);
  push('cities', c.cities?.join(', ') || null);
  push('budgetMin', c.budgetMin != null ? `${fmt(c.budgetMin)} MAD` : null);
  push('budgetMax', c.budgetMax != null ? `${fmt(c.budgetMax)} MAD` : null);
  push('surfaceMin', c.surfaceMin != null ? `${fmt(c.surfaceMin)} m²` : null);
  push('surfaceMax', c.surfaceMax != null ? `${fmt(c.surfaceMax)} m²` : null);
  push('furnished', c.furnished === true ? 'Meublé' : c.furnished === false ? 'Non meublé' : null);
  push('equipments', c.equipments?.map((v) => optionLabel(EQUIPMENT_OPTIONS, v)).join(', ') || null);
  push('acceptedConditions', c.acceptedConditions?.map((v) => optionLabel(CONDITION_OPTIONS, v)).join(', ') || null);
  return out;
}

/**
 * Applique une suggestion au formulaire sans rien effacer : les listes sont complétées,
 * les valeurs simples ne sont remplacées que si la suggestion en propose une.
 */
export function mergeSuggestion(form: CriteriaForm, s: Partial<DossierSearchCriteria>): CriteriaForm {
  const union = (a: string[], b?: string[]) => [...new Set([...a, ...(b ?? [])])];
  const num = (current: string, v?: number | null) => (v === null || v === undefined ? current : String(v));
  const cities = union(
    form.cities.split(',').map((c) => c.trim()).filter(Boolean),
    s.cities,
  );
  return {
    transactionTypes: union(form.transactionTypes, s.transactionTypes),
    categories: union(form.categories, s.categories),
    cities: cities.join(', '),
    budgetMin: num(form.budgetMin, s.budgetMin),
    budgetMax: num(form.budgetMax, s.budgetMax),
    surfaceMin: num(form.surfaceMin, s.surfaceMin),
    surfaceMax: num(form.surfaceMax, s.surfaceMax),
    furnished: s.furnished === true ? 'yes' : s.furnished === false ? 'no' : form.furnished,
    equipments: union(form.equipments, s.equipments),
    acceptedConditions: union(form.acceptedConditions, s.acceptedConditions),
  };
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

  readonly suggesting = signal(false);
  readonly suggestion = signal<CriteriaSuggestion | null>(null);
  readonly suggestionLines = computed(() => {
    const s = this.suggestion();
    return s ? suggestionLines(s) : [];
  });

  suggest(): void {
    this.suggesting.set(true);
    this.api.suggestCriteria(this.dossierId()).subscribe({
      next: (s) => {
        this.suggesting.set(false);
        this.suggestion.set(s);
        if (!suggestionLines(s).length) {
          this.toast.info('Aucun critère clair trouvé dans les notes et messages du client');
        }
      },
      error: (err) => {
        this.suggesting.set(false);
        if (err?.status === 400) {
          this.toast.info("Ce dossier n'a encore ni note ni message du client");
        } else {
          this.toast.error('La suggestion de critères a échoué');
        }
      },
    });
  }

  applySuggestion(): void {
    const s = this.suggestion();
    if (!s) return;
    this.form = mergeSuggestion(this.form, s.suggestion);
    this.suggestion.set(null);
    this.toast.success('Critères ajoutés au formulaire : vérifiez-les puis enregistrez');
  }

  dismissSuggestion(): void {
    this.suggestion.set(null);
  }

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
