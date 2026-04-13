import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VitrineService, DemoFormData } from '../../../services/vitrine.service';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {
  submitting = false;
  submitted = false;

  form: DemoFormData = {
    nom: '', email: '', tel: '', ville: '', actorType: '',
    teamSize: '', listingVolume: '', desiredPlan: '',
    needs: [], message: ''
  };

  readonly needOptions = [
    'Publication d\'annonces', 'CRM & leads', 'Agenda & visites',
    'WhatsApp Business', 'Analytiques', 'Multi-agences', 'Promoteur / programmes'
  ];

  readonly villes = ['Casablanca', 'Rabat', 'Tanger', 'Marrakech', 'Fès', 'Agadir', 'Autres'];

  constructor(private vitrineService: VitrineService, private router: Router) {}

  toggleNeed(need: string): void {
    const idx = this.form.needs.indexOf(need);
    if (idx === -1) this.form.needs.push(need);
    else this.form.needs.splice(idx, 1);
  }

  hasNeed(need: string): boolean { return this.form.needs.includes(need); }

  isValid(): boolean {
    return !!this.form.nom && !!this.form.email && !!this.form.tel && !!this.form.actorType;
  }

  submit(): void {
    if (!this.isValid() || this.submitting) return;
    this.submitting = true;
    this.vitrineService.submitDemoRequest(this.form).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: () => { this.submitting = false; }
    });
  }
}
