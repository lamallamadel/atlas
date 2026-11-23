import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VitrineService, DemoFormData, PUBLIC_CONTACT_CONSENT_TEXT, publicLeadErrorMessage } from '../../../services/vitrine.service';
import { FormsModule } from '@angular/forms';
import { DsSelectComponent, type DsSelectOption } from '../../../design-system';

@Component({
    selector: 'app-demo',
    templateUrl: './demo.component.html',
    styleUrls: ['./demo.component.scss'],
    imports: [RouterLink, FormsModule, DsSelectComponent]
})
export class DemoComponent {
  submitting = false;
  submitted = false;
  errorMessage = '';
  readonly consentText = PUBLIC_CONTACT_CONSENT_TEXT;

  form: DemoFormData = {
    nom: '', email: '', tel: '', ville: '', actorType: '',
    teamSize: '', listingVolume: '', desiredPlan: '',
    needs: [], message: '', consent: false
  };

  readonly needOptions = [
    'Publication d\'annonces', 'CRM & leads', 'Agenda & visites',
    'WhatsApp Business', 'Analytiques', 'Multi-agences', 'Promoteur / programmes'
  ];

  readonly villes: DsSelectOption[] = [
    { value: 'Casablanca', label: 'Casablanca' },
    { value: 'Rabat', label: 'Rabat' },
    { value: 'Tanger', label: 'Tanger' },
    { value: 'Marrakech', label: 'Marrakech' },
    { value: 'Fès', label: 'Fès' },
    { value: 'Agadir', label: 'Agadir' },
    { value: 'Autres', label: 'Autres' }
  ];

  readonly actorTypes: DsSelectOption[] = [
    { value: 'agence', label: 'Agence immobilière' },
    { value: 'promoteur', label: 'Promoteur immobilier' },
    { value: 'agent', label: 'Agent indépendant' },
    { value: 'reseau', label: 'Réseau d\'agences' },
    { value: 'autre', label: 'Autre' }
  ];

  readonly teamSizes: DsSelectOption[] = [
    { value: '1-3', label: '1–3 personnes' },
    { value: '4-10', label: '4–10 personnes' },
    { value: '11-30', label: '11–30 personnes' },
    { value: '30+', label: '30+ personnes' }
  ];

  readonly desiredPlans: DsSelectOption[] = [
    { value: '', label: 'Je ne sais pas encore' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  constructor(private vitrineService: VitrineService, private router: Router) {}

  toggleNeed(need: string): void {
    const idx = this.form.needs.indexOf(need);
    if (idx === -1) this.form.needs.push(need);
    else this.form.needs.splice(idx, 1);
  }

  hasNeed(need: string): boolean { return this.form.needs.includes(need); }

  isValid(): boolean {
    return !!this.form.nom && !!this.form.email && !!this.form.tel && !!this.form.actorType && this.form.consent;
  }

  submit(): void {
    if (!this.isValid() || this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    this.vitrineService.submitDemoRequest(this.form).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: (err) => { this.submitting = false; this.errorMessage = publicLeadErrorMessage(err); }
    });
  }
}
