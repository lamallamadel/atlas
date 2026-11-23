import { Component } from '@angular/core';
import { VitrineService, ContactFormData, PUBLIC_CONTACT_CONSENT_TEXT, publicLeadErrorMessage } from '../../../services/vitrine.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsInputComponent,
  DsSkeletonComponent,
  DsCardComponent
} from '../../../design-system';

@Component({
    selector: 'app-contact',
    standalone: true,
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    imports: [
      CommonModule,
      FormsModule, 
      RouterLink,
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent,
      DsInputComponent,
      DsSkeletonComponent,
      DsCardComponent
    ]
})
export class ContactComponent {
  submitting = false;
  submitted = false;
  errorMessage = '';
  readonly consentText = PUBLIC_CONTACT_CONSENT_TEXT;

  form: ContactFormData = { nom: '', email: '', tel: '', sujet: '', message: '', consent: false };

  readonly sujetOptions: DsSelectOption[] = [
    { value: '', label: 'Sélectionner un sujet…' },
    { value: 'demande_demo', label: 'Demande de démonstration' },
    { value: 'info_prix', label: 'Informations sur les tarifs' },
    { value: 'support_technique', label: 'Support technique' },
    { value: 'partenariat', label: 'Partenariat' },
    { value: 'autre', label: 'Autre' }
  ];

  constructor(private vitrineService: VitrineService) {}

  isValid(): boolean { return !!this.form.nom && !!this.form.email && !!this.form.sujet && !!this.form.message && this.form.consent; }

  submit(): void {
    if (!this.isValid() || this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    this.vitrineService.submitContactRequest(this.form).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: (err) => { this.submitting = false; this.errorMessage = publicLeadErrorMessage(err); }
    });
  }
}
