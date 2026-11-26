import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Lien court des alertes WhatsApp du propriétaire (`/p/c12`, `/p/d5`) : le modèle Meta n'a qu'une
 * variable en fin d'URL. « c » ouvre un contact, « d » une demande d'accompagnement.
 */
@Component({
  selector: 'app-owner-link',
  standalone: true,
  template: '',
})
export class OwnerLinkComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('ref') ?? '';
    const match = /^([cd])(\d+)$/.exec(ref);
    const target = !match ? ['/proprietaire']
      : match[1] === 'c' ? ['/proprietaire/contacts', match[2]]
      : ['/proprietaire/demandes', match[2]];
    this.router.navigate(target, { replaceUrl: true });
  }
}
