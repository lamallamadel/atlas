import { Component } from '@angular/core';
import { VitrineService, ContactFormData } from '../../../services/vitrine.service';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    standalone: false
})
export class ContactComponent {
  submitting = false;
  submitted = false;

  form: ContactFormData = { nom: '', email: '', tel: '', sujet: '', message: '' };

  constructor(private vitrineService: VitrineService) {}

  isValid(): boolean { return !!this.form.nom && !!this.form.email && !!this.form.sujet && !!this.form.message; }

  submit(): void {
    if (!this.isValid() || this.submitting) return;
    this.submitting = true;
    this.vitrineService.submitContactRequest(this.form).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: () => { this.submitting = false; }
    });
  }
}
